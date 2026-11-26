import { useState } from 'react';
import { Text } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { authError } from '@/features/auth/api/authApi';
import { Button, Card, Field, Notice, Sheet, Stepper } from '../../shared/components/UI';
import { useCancelItem } from '../hooks/useOrders';
import type { Order, OrderLine } from '../types/api';

export function CancelItemButton({ order, line }: { order: Order; line: OrderLine }) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  // Preserve the exact request on retry, including its idempotency key.
  const [attempt, setAttempt] = useState<{ quantity: number; reason: string; key: string } | null>(null);
  const cancel = useCancelItem(order.tableSessionId, line.orderItemId);
  const remaining = line.remainingQuantity ?? line.quantity - (line.cancelledQuantity ?? 0);
  const eligible = ['PendingConfirmation', 'Confirmed', 'Ready'].includes(order.status)
    && ['PendingConfirmation', 'Pending', 'Hold'].includes(line.status) && remaining > 0;
  if (!eligible && !open) return null;
  return (
    <>
      <Button secondary icon="trash-outline" title={`Hủy món · ${line.nameSnapshot}`} onPress={() => {
        cancel.reset(); setAttempt(null); setQuantity(1); setReason(''); setOpen(true);
      }} />
      {open && (
        <Sheet title={cancel.isSuccess ? 'Đã hủy món' : 'Hủy món đã gọi'} onClose={() => { if (!cancel.isPending) setOpen(false); }}>
          <Card>
            <Text className="text-[17px] font-[700] text-[#183B32]">{line.nameSnapshot}</Text>
            <Text className="text-[12px] leading-[19px] text-[#7C8983]">Đơn {order.orderNumber} · {remaining} phần còn lại</Text>
          </Card>
          {cancel.isSuccess ? (
            <>
              <Notice text={`Đã hủy ${attempt?.quantity} phần ${line.nameSnapshot}. Danh sách món và tổng tiền sẽ được cập nhật.`} />
              <Button title="Hoàn tất" onPress={() => setOpen(false)} />
            </>
          ) : (
            <>
              <Notice text="Chỉ có thể hủy phần chưa chế biến. Hệ thống sẽ kiểm tra lại trạng thái món khi xác nhận." />
              <Text className="text-[14px] font-[600] text-[#183B32]">Số lượng muốn hủy</Text>
              <Stepper value={quantity} max={remaining} onChange={(value) => { if (!attempt) setQuantity(value); }} />
              <Field label="Lý do hủy món *" placeholder="Ví dụ: Khách gọi nhầm món…" value={reason} onChangeText={setReason} editable={!attempt} multiline maxLength={1000} />
              {!!cancel.error && <Notice error text={authError(cancel.error)} />}
              {!eligible && <Notice error text="Trạng thái món đã thay đổi. Đóng bảng để kiểm tra lại món." />}
              <Button danger icon="trash-outline" title={cancel.isPending ? 'Đang hủy món…' : attempt ? 'Thử lại yêu cầu hủy' : `Xác nhận hủy ${quantity} phần`} disabled={cancel.isPending || !eligible || !reason.trim() || quantity > remaining} onPress={() => {
                if (cancel.isPending) return;
                const request = attempt ?? { quantity, reason: reason.trim(), key: randomUUID() };
                setAttempt(request); cancel.mutate(request);
              }} />
              <Button secondary title="Đóng" disabled={cancel.isPending} onPress={() => setOpen(false)} />
            </>
          )}
        </Sheet>
      )}
    </>
  );
}
