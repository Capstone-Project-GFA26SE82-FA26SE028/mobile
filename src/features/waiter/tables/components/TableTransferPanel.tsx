import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { authError } from '@/features/auth/api/authApi';
import {
  Button,
  Card,
  Empty,
  Field,
  Notice,
  Sheet,
  Stepper,
} from '../../shared/components/UI';
import { QueryStatus } from '../../shared/components/QueryStatus';
import { useRefreshWaiterData } from '../../shared/hooks/useWaiterScope';
import { useSessionOrders } from '../../ordering/hooks/useOrders';
import { tablesApi } from '../api/tablesApi';
import type {
  ServiceTable,
  TableTransferRequest,
  TableTransferResult,
} from '../types/types';

export function TableTransferPanel({
  table,
  tables,
}: {
  table: ServiceTable;
  tables: ServiceTable[];
}) {
  const router = useRouter();
  const refresh = useRefreshWaiterData();
  const [mode, setMode] = useState<'merge' | 'split' | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [target, setTarget] = useState('');
  const [reason, setReason] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [attempt, setAttempt] = useState<TableTransferRequest | null>(null);
  const [message, setMessage] = useState('');
  const busy = useRef(false);
  const orders = useSessionOrders(
    mode === 'split' && sessionId ? [sessionId] : [],
  );
  const mutation = useMutation({
    mutationFn: async (
      request: TableTransferRequest,
    ): Promise<TableTransferResult> => {
      // A lost response may already have committed the transfer. Check before resuming.
      if (attempt) {
        try {
          const result = await tablesApi.transferStatus(request.key);
          if (result.status === 'Completed' || result.status === 'Aborted')
            return result;
        } catch {
          /* The POST safely resumes an existing operation using the same key. */
        }
      }
      return tablesApi.transfer(request);
    },
    retry: false,
    onSettled: refresh,
  });
  const candidates = tables.filter((t) => {
    if (t.restaurantId !== table.restaurantId || t.openSessionIds.length > 1)
      return false;
    const sameSession = t.openSessionIds.includes(sessionId);
    if (mode === 'merge') return t.openSessionIds.length === 1 && !sameSession;
    if (sameSession)
      return (
        tables.filter((row) => row.openSessionIds.includes(sessionId)).length >=
        2
      );
    return t.openSessionIds.length === 1 || t.cleaningStatus === 'Clean';
  });
  const lines = (orders.data ?? [])
    .flatMap((order) => order.items)
    .filter(
      (line) =>
        line.status !== 'Cancelled' &&
        line.quantity - (line.cancelledQuantity ?? 0) > 0,
    );
  const items = lines
    .map((line) => ({
      orderItemId: line.orderItemId,
      quantity: quantities[line.orderItemId] ?? 0,
    }))
    .filter((line) => line.quantity > 0);
  const valid =
    table.openSessionIds.includes(sessionId) &&
    candidates.some((t) => t.tableId === target) &&
    !!reason.trim() &&
    (mode === 'merge' ||
      (orders.isSuccess &&
        !orders.isFetching &&
        items.length > 0 &&
        items.length <= 100 &&
        items.every((item) => {
          const line = lines.find(
            (row) => row.orderItemId === item.orderItemId,
          )!;
          const max = line.quantity - (line.cancelledQuantity ?? 0);
          return (
            item.quantity <= max &&
            (['PendingConfirmation', 'Pending', 'Hold'].includes(line.status) ||
              item.quantity === max)
          );
        })));
  function start(next: 'merge' | 'split') {
    if (attempt) {
      setMode(attempt.mode);
      return;
    }
    mutation.reset();
    setSessionId(table.openSessionIds[0] ?? '');
    setTarget('');
    setReason('');
    setQuantities({});
    setMessage('');
    setMode(next);
  }
  async function submit() {
    if (busy.current || (!attempt && !valid) || !mode) return;
    busy.current = true;
    const request = attempt ?? {
      sessionId,
      mode,
      targetTableId: target,
      reason: reason.trim(),
      items: mode === 'split' ? items : [],
      key: randomUUID(),
    };
    setAttempt(request);
    setMessage('');
    try {
      const result = await mutation.mutateAsync(request);
      if (result.status === 'Completed') {
        setAttempt(null);
        setMode(null);
        setMessage('Đã hoàn tất gộp/tách bàn.');
        router.replace({
          pathname: '/waiter/table/[id]',
          params: { id: result.targetTableId },
        });
      } else if (result.status === 'Aborted') {
        setAttempt(null);
        setMessage(
          'Thao tác đã hủy. Bạn có thể chọn lại thông tin và thực hiện thao tác mới.',
        );
      } else {
        setMessage(
          'Thao tác đang xử lý. Bấm Tiếp tục để kiểm tra và hoàn tất với cùng mã thao tác.',
        );
      }
    } catch {
      /* Keep the exact payload and key for safe recovery after network errors. */
    } finally {
      busy.current = false;
    }
  }
  return (
    <>
      <Card>
        <Text className="text-[17px] font-[700] text-[#183B32]">
          Gộp và tách bàn
        </Text>
        <Notice text="Gộp chuyển toàn bộ món và bàn của phiên nguồn vào phiên đích. Tách chuyển các món được chọn sang bàn đích." />
        <View className="flex-row gap-[10px]">
          <View style={{ flex: 1 }}>
            <Button secondary title="Gộp bàn" onPress={() => start('merge')} />
          </View>
          <View style={{ flex: 1 }}>
            <Button secondary title="Tách bàn" onPress={() => start('split')} />
          </View>
        </View>
        {!!attempt && (
          <Notice text="Có thao tác chưa xác nhận hoàn tất. Mở lại để tiếp tục với cùng mã thao tác." />
        )}
        {!mode && !!message && <Notice text={message} />}
      </Card>
      {mode && (
        <Sheet
          title={mode === 'merge' ? 'Gộp bàn' : 'Tách bàn'}
          onClose={() => {
            if (!busy.current) setMode(null);
          }}
        >
          {!!attempt ? (
            <Notice
              text={`Đã gửi yêu cầu ${attempt.mode === 'merge' ? 'gộp' : 'tách'} bàn. Thông tin được giữ nguyên khi thử lại. Mã: ${attempt.key}`}
            />
          ) : (
            <>
              <Text className="text-[14px] font-[700] text-[#183B32]">
                Phiên nguồn · {table.tableCode}
              </Text>
              {table.openSessionIds.map((id, index) => (
                <Button
                  key={id}
                  secondary={sessionId !== id}
                  title={`Phiên ${index + 1} · ${id.slice(0, 8)}`}
                  onPress={() => {
                    setSessionId(id);
                    setTarget('');
                    setQuantities({});
                  }}
                />
              ))}
              <Text className="text-[14px] font-[700] text-[#183B32]">
                Chọn bàn đích
              </Text>
              {candidates.map((t) => (
                <Button
                  key={t.tableId}
                  secondary={target !== t.tableId}
                  title={`${t.tableCode} · ${t.areaName} · ${t.openSessionIds.length ? 'Có khách' : 'Trống'}`}
                  onPress={() => setTarget(t.tableId)}
                />
              ))}
              {!candidates.length && <Empty text="Chưa có bàn đích phù hợp." />}
              {mode === 'split' && (
                <>
                  <QueryStatus query={orders} />
                  <Notice text="Chọn số lượng cần chuyển. Món đã bắt đầu chế biến chỉ chuyển được toàn bộ dòng; bếp sẽ kiểm tra trạng thái khi xác nhận." />
                  {lines.map((line) => {
                    const max = line.quantity - (line.cancelledQuantity ?? 0);
                    const partial = [
                      'PendingConfirmation',
                      'Pending',
                      'Hold',
                    ].includes(line.status);
                    return (
                      <Card key={line.orderItemId}>
                        <Text className="text-[14px] font-[700] text-[#183B32]">
                          {line.nameSnapshot} · {max} phần
                        </Text>
                        {!!line.note && <Text>{line.note}</Text>}
                        {line.options.map((option) => (
                          <Text key={option.optionId}>
                            {option.name} × {option.quantity}
                          </Text>
                        ))}
                        {partial ? (
                          <Stepper
                            min={0}
                            max={max}
                            value={Math.min(
                              quantities[line.orderItemId] ?? 0,
                              max,
                            )}
                            onChange={(quantity) =>
                              setQuantities((prev) => ({
                                ...prev,
                                [line.orderItemId]: quantity,
                              }))
                            }
                          />
                        ) : (
                          <Button
                            secondary={!quantities[line.orderItemId]}
                            title={
                              quantities[line.orderItemId]
                                ? 'Bỏ chọn dòng món'
                                : `Chuyển toàn bộ ${max} phần`
                            }
                            onPress={() =>
                              setQuantities((prev) => ({
                                ...prev,
                                [line.orderItemId]: prev[line.orderItemId]
                                  ? 0
                                  : max,
                              }))
                            }
                          />
                        )}
                      </Card>
                    );
                  })}
                  {orders.isSuccess && !lines.length && (
                    <Empty text="Phiên chưa có món có thể tách." />
                  )}
                </>
              )}
              <Field
                label="Lý do"
                value={reason}
                onChangeText={setReason}
                multiline
                maxLength={1000}
              />
              <Notice
                text={`${mode === 'merge' ? 'Gộp toàn bộ phiên' : `Chuyển ${items.reduce((sum, item) => sum + item.quantity, 0)} phần món`} từ ${table.tableCode} đến ${candidates.find((t) => t.tableId === target)?.tableCode ?? 'bàn chưa chọn'}. Kiểm tra thông tin trước khi xác nhận.`}
              />
            </>
          )}
          {!!message && <Notice text={message} />}
          {mutation.isError && (
            <Notice error text={authError(mutation.error)} />
          )}
          <Button
            title={
              mutation.isPending
                ? 'Đang xử lý…'
                : attempt
                  ? 'Tiếp tục / Kiểm tra kết quả'
                  : mode === 'merge'
                    ? 'Xác nhận gộp bàn'
                    : 'Xác nhận tách bàn'
            }
            disabled={mutation.isPending || (!attempt && !valid)}
            onPress={() => {
              void submit();
            }}
          />
        </Sheet>
      )}
    </>
  );
}
