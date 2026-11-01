import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { authError } from '@/features/auth/api/authApi';
import {
  Badge,
  Button,
  Empty,
  Field,
  Notice,
  Sheet,
} from '../../shared/components/UI';
import { QueryStatus } from '../../shared/components/QueryStatus';
import { useNow } from '../../shared/hooks/useWaiterCommands';
import { colors } from '../../shared/utils/theme';
import { useServiceTables } from '../../tables/hooks/useTables';
import {
  useReservation,
  useReservationAction,
  useReservationAvailability,
} from '../hooks/useReservations';
import type {
  AvailabilityQuery,
  ReservationAction,
} from '../types/types';
import {
  reservationCanCheckIn,
  reservationDateFields,
  reservationStartAt,
  reservationStatusLabel,
} from '../utils/liveReservation';

export type ReservationMode = 'detail' | ReservationAction['action'];

export function ReservationSheet({
  id,
  initialMode,
  onClose,
  onDone,
}: {
  id: string;
  initialMode: ReservationMode;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const detail = useReservation(id);
  const reservation = detail.data;
  const tables = useServiceTables();
  const mutation = useReservationAction();
  const [mode, setMode] = useState(initialMode);
  const [fields, setFields] = useState<{ date: string; time: string } | null>(
    null,
  );
  const [tableIds, setTableIds] = useState<string[]>([]);
  const [preview, setPreview] = useState<AvailabilityQuery | null>(null);
  const availability = useReservationAvailability(preview);
  const sending = useRef(false);
  const now = useNow();
  useEffect(() => {
    if (!reservation || fields) return;
    setFields(reservationDateFields(reservation.startAt));
    setTableIds(initialMode === 'update' ? reservation.assignedTableIds : []);
  }, [reservation, fields, initialMode]);

  const selecting = mode === 'confirm' || mode === 'update';
  const startAt =
    mode === 'update' && fields
      ? reservationStartAt(fields.date, fields.time)
      : (reservation?.startAt ?? null);
  const currentStatus =
    mode === 'confirm' || mode === 'reject' ? 'Pending' : 'Confirmed';
  const allowed = reservation?.status === currentStatus;
  const candidates = availability.data?.tables ?? [];
  const chosen = candidates.filter((table) => tableIds.includes(table.tableId));
  const capacity = chosen.reduce((sum, table) => sum + table.capacity, 0);
  // Availability includes this reservation's own existing allocation. Only the
  // server can exclude that allocation and validate the final update atomically.
  const selectable = (table: (typeof candidates)[number]) =>
    table.isScheduleAvailable ||
    (mode === 'update' &&
      !!reservation?.assignedTableIds.includes(table.tableId));
  const selectionValid =
    !!reservation &&
    !!preview &&
    availability.isSuccess &&
    !availability.error &&
    chosen.length === tableIds.length &&
    chosen.length > 0 &&
    chosen.every(selectable) &&
    capacity >= reservation.partySize &&
    !availability.data.reasons.length;

  function switchMode(next: ReservationMode) {
    if (!reservation || mutation.isPending) return;
    mutation.reset();
    setMode(next);
    setFields(reservationDateFields(reservation.startAt));
    setTableIds(next === 'update' ? reservation.assignedTableIds : []);
    setPreview(null);
  }

  async function submit() {
    if (
      sending.current ||
      !reservation ||
      !allowed ||
      detail.error ||
      detail.isFetching
    )
      return;
    let request: ReservationAction;
    if (mode === 'confirm') {
      if (!selectionValid) return;
      request = { action: mode, id, tableIds };
    } else if (mode === 'update') {
      if (!selectionValid || !startAt) return;
      request = { action: mode, id, tableIds, startAt };
    } else if (mode === 'reject' || mode === 'cancel' || mode === 'check-in') {
      if (mode === 'check-in' && !reservationCanCheckIn(reservation, now))
        return;
      request = { action: mode, id };
    } else return;
    sending.current = true;
    try {
      await mutation.mutateAsync(request);
      const messages = {
        confirm: 'Đã xác nhận đặt bàn.',
        update: 'Đã cập nhật lịch và bàn.',
        reject: 'Đã từ chối yêu cầu đặt bàn.',
        cancel: 'Đã hủy đặt bàn.',
        'check-in': 'Đã ghi nhận khách đến. Mở bàn để bắt đầu phục vụ.',
      };
      onDone(messages[request.action]);
    } catch {
      // The mutation error remains visible. Refresh latest status after conflicts.
      void detail.refetch();
      if (preview) void availability.refetch();
    } finally {
      sending.current = false;
    }
  }

  return (
    <Sheet
      title={
        mode === 'detail'
          ? 'Chi tiết đặt bàn'
          : mode === 'confirm'
            ? 'Xác nhận bàn phù hợp'
            : mode === 'update'
              ? 'Đổi lịch và bàn'
              : mode === 'reject'
                ? 'Từ chối yêu cầu đặt bàn'
                : mode === 'cancel'
                  ? 'Hủy đặt bàn'
                  : 'Ghi nhận khách đến'
      }
      onClose={() => {
        if (!sending.current) onClose();
      }}
    >
      <QueryStatus query={detail} />
      {reservation && (
        <>
          <Text className="text-[17px] font-[700] text-[#183B32]">
            {reservation.contactName} · {reservation.partySize} khách
          </Text>
          <Text className="text-[12px] leading-[19px] text-[#7C8983]">
            {new Date(reservation.startAt).toLocaleString('vi-VN')} –{' '}
            {new Date(reservation.endAt).toLocaleString('vi-VN')} ·{' '}
            {reservation.phone}
          </Text>
          <Badge text={reservationStatusLabel(reservation.status)} />
          {!!reservation.assignedTableIds.length && (
            <View className="flex-row flex-wrap gap-[10px]">
              {reservation.assignedTableIds.map((id) => {
                const table = tables.data?.find(
                  (table) => table.tableId === id,
                );
                return (
                  <Badge
                    key={id}
                    text={
                      table
                        ? `${table.tableCode} · ${table.areaName}`
                        : `Bàn ${id.slice(0, 8)}`
                    }
                    tone="blue"
                  />
                );
              })}
            </View>
          )}
          {reservation.status === 'Confirmed' &&
            !reservation.hasConsistentAssignment && (
              <Notice
                error
                text="Phân bổ bàn không còn nhất quán. Kiểm tra lại bàn và khu vực trước khi đón khách."
              />
            )}
          {reservation.holdUntil && (
            <Text className="text-[11px] leading-[16px] text-[#7C8983]">
              Hạn khách đến:{' '}
              {new Date(reservation.holdUntil).toLocaleString('vi-VN')}
            </Text>
          )}
          {reservation.confirmedAt && (
            <Text className="text-[11px] leading-[16px] text-[#7C8983]">
              Xác nhận lúc:{' '}
              {new Date(reservation.confirmedAt).toLocaleString('vi-VN')}
            </Text>
          )}
          {reservation.cancelledAt && (
            <Text className="text-[11px] leading-[16px] text-[#7C8983]">
              Hủy lúc:{' '}
              {new Date(reservation.cancelledAt).toLocaleString('vi-VN')}
            </Text>
          )}
          {mode === 'detail' ? (
            <>
              {reservation.status === 'Pending' && (
                <>
                  <Button
                    title="Duyệt đặt bàn"
                    onPress={() => switchMode('confirm')}
                  />
                  <Button
                    title="Từ chối đặt bàn"
                    secondary
                    onPress={() => switchMode('reject')}
                  />
                </>
              )}
              {reservation.status === 'Confirmed' && (
                <>
                  <Button
                    title="Khách đã đến"
                    disabled={!reservationCanCheckIn(reservation, now)}
                    onPress={() => switchMode('check-in')}
                  />
                  <Button
                    title="Đổi lịch / bàn"
                    secondary
                    onPress={() => switchMode('update')}
                  />
                  <Button
                    title="Hủy đặt bàn"
                    secondary
                    onPress={() => switchMode('cancel')}
                  />
                </>
              )}
            </>
          ) : (
            <>
              {!allowed && (
                <Notice
                  error
                  text="Trạng thái đặt bàn đã thay đổi. Vui lòng đóng bảng và kiểm tra lại."
                />
              )}
              {selecting && fields && (
                <>
                  {mode === 'update' && (
                    <>
                      <Field
                        label="Ngày đến (DD/MM/YYYY)"
                        value={fields.date}
                        editable={!mutation.isPending}
                        maxLength={10}
                        onChangeText={(date) => {
                          setFields({ ...fields, date });
                          setPreview(null);
                        }}
                      />
                      <Field
                        label="Giờ đến (HH:mm, theo giờ thiết bị)"
                        value={fields.time}
                        editable={!mutation.isPending}
                        maxLength={5}
                        onChangeText={(time) => {
                          setFields({ ...fields, time });
                          setPreview(null);
                        }}
                      />
                      {!startAt && (
                        <Notice
                          error
                          text="Nhập ngày và giờ hợp lệ để kiểm tra bàn."
                        />
                      )}
                    </>
                  )}
                  <Button
                    title="Kiểm tra bàn phù hợp"
                    secondary
                    disabled={
                      !startAt ||
                      !allowed ||
                      mutation.isPending ||
                      detail.isFetching
                    }
                    onPress={() => {
                      if (!startAt) return;
                      setPreview({
                        restaurantId: reservation.restaurantId,
                        areaId: reservation.requestedAreaId,
                        partySize: reservation.partySize,
                        startAt,
                      });
                      if (preview?.startAt === startAt)
                        void availability.refetch();
                    }}
                  />
                  {preview && <QueryStatus query={availability} />}
                  {preview && availability.data && (
                    <>
                      <Notice
                        text={`Có thể chọn nhiều bàn · Đã chọn ${capacity}/${reservation.partySize} chỗ. Bàn chỉ được giữ khi lưu thành công.`}
                      />
                      {availability.data.reasons.map((reason) => (
                        <Notice key={reason} error text={reason} />
                      ))}
                      {mode === 'update' && (
                        <Notice text="Bàn đang gán có thể xuất hiện trùng lịch với chính lượt đặt này. Hệ thống sẽ kiểm tra lại khi lưu." />
                      )}
                      <View className="flex-row flex-wrap gap-[10px]">
                        {candidates.map((table) => {
                          const selected = tableIds.includes(table.tableId);
                          const canSelect =
                            selectable(table) && !mutation.isPending && allowed;
                          return (
                            <Pressable
                              key={table.tableId}
                              accessibilityRole="button"
                              accessibilityLabel={`Chọn ${table.tableCode}`}
                              accessibilityState={{
                                selected,
                                disabled: !canSelect,
                              }}
                              disabled={!canSelect}
                              onPress={() =>
                                setTableIds((current) =>
                                  selected
                                    ? current.filter(
                                        (id) => id !== table.tableId,
                                      )
                                    : [...current, table.tableId],
                                )
                              }
                              className="p-[14px] rounded-[12px] border-[1px]"
                              style={{
                                borderColor: selected
                                  ? colors.green
                                  : colors.line,
                                backgroundColor: selected
                                  ? colors.mint
                                  : '#fff',
                                opacity: canSelect ? 1 : 0.5,
                              }}
                            >
                              <Text className="text-[14px] leading-[21px] text-[#183B32]">
                                {selected ? '✓ ' : ''}
                                {table.tableCode}
                              </Text>
                              <Text className="text-[11px] leading-[16px] text-[#7C8983]">
                                {table.capacity} chỗ ·{' '}
                                {table.cleaningStatus === 'Clean'
                                  ? 'Đã dọn'
                                  : 'Chưa dọn'}
                              </Text>
                              {!table.isScheduleAvailable && (
                                <Text className="text-[11px] leading-[16px] text-[#7C8983]">
                                  {reservation.assignedTableIds.includes(
                                    table.tableId,
                                  )
                                    ? 'Bàn đang gán · cần kiểm tra lại'
                                    : 'Không phù hợp khung giờ'}
                                </Text>
                              )}
                            </Pressable>
                          );
                        })}
                      </View>
                      {!candidates.length && (
                        <Empty text="Chưa có bàn phù hợp trong khu vực này." />
                      )}
                    </>
                  )}
                </>
              )}
              {mode === 'reject' && (
                <Notice text="Xác nhận từ chối yêu cầu đặt bàn của khách?" />
              )}
              {mode === 'cancel' && (
                <Notice text="Xác nhận hủy lượt đặt bàn đã duyệt?" />
              )}
              {mode === 'check-in' && (
                <Notice text="Chỉ ghi nhận khi khách đã đến. Sau đó mở bàn để bắt đầu phục vụ." />
              )}
              {mode === 'check-in' &&
                !reservationCanCheckIn(reservation, now) && (
                  <Notice
                    error
                    text="Chỉ ghi nhận trong khoảng từ 30 phút trước giờ hẹn đến hạn khách đến."
                  />
                )}
              {mutation.isError && (
                <Notice error text={authError(mutation.error)} />
              )}
              <Button
                title={
                  mutation.isPending
                    ? 'Đang xử lý…'
                    : mode === 'confirm'
                      ? 'Xác nhận đặt bàn'
                      : mode === 'update'
                        ? 'Lưu thay đổi'
                        : mode === 'reject'
                          ? 'Xác nhận từ chối'
                          : mode === 'cancel'
                            ? 'Xác nhận hủy đặt bàn'
                            : 'Xác nhận khách đã đến'
                }
                danger={mode === 'reject' || mode === 'cancel'}
                disabled={
                  !allowed ||
                  !!detail.error ||
                  detail.isFetching ||
                  mutation.isPending ||
                  (selecting && (!selectionValid || availability.isFetching)) ||
                  (mode === 'check-in' &&
                    !reservationCanCheckIn(reservation, now))
                }
                onPress={() => {
                  void submit();
                }}
              />
            </>
          )}
        </>
      )}
    </Sheet>
  );
}
