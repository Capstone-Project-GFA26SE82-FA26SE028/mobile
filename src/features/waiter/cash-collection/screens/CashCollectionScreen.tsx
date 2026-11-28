import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { Text, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  Page,
  Title,
  Button,
  Card,
  Field,
  Notice,
  Empty,
} from '../../shared/components/UI';
import { QueryStatus } from '../../shared/components/QueryStatus';
import { money } from '../../shared/utils/rules';
import { collectionApi } from '../api/collectionApi';
import {
  useCollectionQuery,
  useCollectionAction,
} from '../hooks/useCollection';
import { startCollection, collectionSaved, discardCollection } from '../store/collectionSlice';
import { validCash } from '../utils/money';
import { authError, authService } from '@/features/auth/api/authApi';
import { readCollection, saveCollection, removeCollection } from '../store/collectionStorage';
import { useServiceTables } from '../../tables/hooks/useTables';
import { BillCard } from '../components/BillCard';
export default function CashCollectionScreen() {
  const {
    id = '',
    sessionId = '',
    requestId = '',
    restaurantId = '',
  } = useLocalSearchParams<{
    id: string;
    sessionId: string;
    requestId: string;
    restaurantId: string;
  }>();
  const tables = useServiceTables();
  const restaurant =
    restaurantId ||
    tables.data?.find((t) => t.tableId === id)?.restaurantId ||
    '';
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.waiter.waiter?.id);
  const draft = useAppSelector((s) => s.waiterCollection.drafts[requestId]);
  const [restored, setRestored] = useState(false);
  const [storageError, setStorageError] = useState('');
  useEffect(() => {
    let active = true;
    setRestored(false);
    setStorageError('');
    if (!user || !requestId) return;
    void readCollection(user, requestId)
      .then((saved) => {
        if (!active) return;
        if (saved) dispatch(startCollection({ id: requestId, draft: saved }));
        setRestored(true);
      })
      .catch((error) => {
        if (active) setStorageError(authError(error));
      });
    return () => {
      active = false;
    };
  }, [user, requestId, dispatch]);
  const [amount, setAmount] = useState('');
  const [review, setReview] = useState<{
    total: number;
    received: number;
  } | null>(null);
  const lock = useRef(false);
  const action = useCollectionAction();
  const request = useCollectionQuery(
    'request:' + requestId,
    async (signal) =>
      (await collectionApi.list(restaurant, signal)).find(
        (r) => r.serviceRequestId === requestId,
      ) ?? null,
    restored && !!restaurant && !!requestId && !draft?.handover,
  );
  const responsible = restored && !!user && request.data?.handledByRef === user;
  const bill = useCollectionQuery(
    'bill:' + requestId,
    async (signal) => {
      try {
        return await collectionApi.bill(sessionId, requestId, signal);
      } catch (error) {
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        const message = authError(error);
        if (status === 404 && message === 'Không tìm thấy yêu cầu thanh toán.') {
          return 'needsSubmission' as const;
        }
        if (status === 409 && message === 'Thu ngân chưa chốt hóa đơn cho yêu cầu này.') {
          return 'awaitingBill' as const;
        }
        throw error;
      }
    },
    responsible && !draft?.handover,
  );
  const needsSubmission = bill.data === 'needsSubmission';
  const awaitingBill = bill.data === 'awaitingBill';
  const preparedBill = typeof bill.data === 'object' ? bill.data : undefined;
  const checkoutId = preparedBill?.checkoutId;
  const payOs = useCollectionQuery(
    'payos:' + sessionId + ':' + checkoutId,
    (signal) => collectionApi.payOsPayments(sessionId, checkoutId!, signal),
    !!sessionId && !!checkoutId &&
      ['Presented', 'Paid'].includes(preparedBill?.checkoutStatus ?? '') &&
      !draft?.handover,
  );
  const paidByPayOs = payOs.data?.find((payment) => payment.paymentConfirmed);
  const openPayOsPayments = payOs.data?.filter(
    (payment) => !['Cancelled', 'Expired', 'Failed'].includes(payment.status),
  );
  const payOsNeedsReview = openPayOsPayments?.some((payment) => payment.requiresReview);
  const hasMatchingPayment = payOs.data?.some(
    (payment) => payment.amount === preparedBill?.bill.totalAmount,
  );
  const canCollectCash = payOs.isSuccess && hasMatchingPayment && !paidByPayOs && !payOsNeedsReview;
  const handover = useCollectionQuery(
    'handover:' + draft?.handover?.paymentId,
    (signal) => collectionApi.handover(draft!.handover!.paymentId, signal),
    !!draft?.handover,
  );
  const current = handover.data ?? draft?.handover;
  const billingError = axios.isAxiosError<{ result?: { status?: string; amount?: number } }>(action.error)
    ? action.error.response?.data.result
    : undefined;
  const returnRejectedCash = billingError?.status === 'CashReturnRequired';
  const cashReturnRequired = current?.status === 'ReturnRequired' ||
    current?.paymentStatus === 'SupersededByPayOs';
  async function run(work: () => Promise<unknown>) {
    if (lock.current) return;
    lock.current = true;
    try {
      await action.mutateAsync(work);
    } catch {
      /* Mutation error is displayed below. */
    } finally {
      lock.current = false;
    }
  }
  async function collect() {
    if (!canCollectCash || !preparedBill || !review || review.total !== preparedBill.bill.totalAmount)
      return;
    const submission = draft ?? {
      key: Crypto.randomUUID(),
      received: review.received,
      billId: preparedBill.bill.billId,
      checkoutId: preparedBill.checkoutId,
      sessionId,
      restaurantId: restaurant,
      tableId: id,
    };
    const identity = authService.identity();
    await run(async () => {
      if (!user) throw new Error('Vui lòng đăng nhập lại.');
      await saveCollection(user, requestId, submission);
      if (identity !== authService.identity())
        throw new Error('Tài khoản đã thay đổi.');
      dispatch(startCollection({ id: requestId, draft: submission }));
      const saved = await collectionApi.collect(submission);
      if (identity !== authService.identity()) return;
      dispatch(collectionSaved({ id: requestId, handover: saved }));
      await saveCollection(user, requestId, { ...submission, handover: saved });
      setReview(null);
    });
  }
  async function recover() {
    if (!draft || !user || paidByPayOs) return;
    const identity = authService.identity();
    await run(async () => {
      const saved = await collectionApi.collect(draft).catch(async (error: unknown) => {
        if (
          identity === authService.identity() &&
          axios.isAxiosError(error) &&
          error.response?.status === 400 &&
          authError(error) === 'Tiền khách đưa phải đủ toàn bộ giá trị hóa đơn.'
        ) {
          await removeCollection(user, requestId);
          if (identity === authService.identity()) {
            dispatch(discardCollection(requestId));
            setReview(null);
            setAmount(String(draft.received));
          }
        }
        throw error;
      });
      if (identity !== authService.identity()) return;
      dispatch(collectionSaved({ id: requestId, handover: saved }));
      await saveCollection(user, requestId, { ...draft, handover: saved });
    });
  }
  if (!sessionId || !requestId)
    return (
      <Page>
        <Empty text="Hãy mở thu hộ từ danh sách yêu cầu thanh toán của khách." />
      </Page>
    );
  if (!restored)
    return (
      <Page>
        <Title title="Thu hộ tiền mặt" />
        <Notice
          error={!!storageError}
          text={storageError || 'Đang khôi phục giao dịch…'}
        />
      </Page>
    );
  return (
    <Page>
      <Title
        title="Thu hộ tiền mặt"
        subtitle={request.data?.tables.map((t) => t.tableCode).join(', ')}
      />
      <QueryStatus query={tables} />
      {!current && !paidByPayOs && restaurant && <QueryStatus query={request} />}
      {returnRejectedCash ? (
        <Notice error text={`Khách đã chuyển khoản. Trả lại ${
          billingError?.amount == null ? 'toàn bộ tiền mặt' : money(billingError.amount)
        } đã nhận.`} />
      ) : !paidByPayOs && action.isError ? (
        <Notice error text={authError(action.error)} />
      ) : null}
      {paidByPayOs && (
        <Card>
          <Title title="Đã thanh toán qua PayOS" />
          <Text className="text-xl font-bold text-emerald-900">{money(paidByPayOs.amount)}</Text>
        </Card>
      )}
      {draft && !current && !paidByPayOs && !returnRejectedCash && (
        <Card>
          <Notice text="Có giao dịch đang chờ xác minh. Không nhận tiền lần nữa. Kiểm tra lại bằng đúng mã và số tiền đã lưu." />
          <Text>Tiền đã ghi nhận: {money(draft.received)}</Text>
          <Button
            title="Kiểm tra lại giao dịch đã gửi"
            disabled={action.isPending}
            onPress={() => void recover()}
          />
        </Card>
      )}
      {!current && !paidByPayOs && request.data?.status === 'Requested' && (
        <Button
          title="Tiếp nhận yêu cầu thanh toán"
          disabled={action.isPending}
          onPress={() =>
            void run(() => collectionApi.acknowledge(sessionId, requestId))
          }
        />
      )}
      {responsible && !current && !paidByPayOs && (
        <>
          {needsSubmission && (
            <Button
              title={action.isPending ? 'Đang gửi…' : 'Gửi yêu cầu đến thu ngân'}
              disabled={action.isPending || bill.isError}
              onPress={() =>
                void run(async () => {
                  await collectionApi.submit(sessionId, requestId);
                  await bill.refetch();
                })
              }
            />
          )}
          {awaitingBill && <Notice text="Đã gửi yêu cầu. Đang chờ thu ngân lập hóa đơn." />}
          {bill.isError && <QueryStatus query={bill} />}
          {bill.isPending && <Notice text="Đang kiểm tra hóa đơn…" />}
          {preparedBill && (
            <>
              <BillCard value={preparedBill} />
              {preparedBill.checkoutStatus !== 'Presented' ? (
                <Button
                  title="Xác nhận đã đưa bill cho khách"
                  disabled={action.isPending}
                  onPress={() =>
                    void run(() => collectionApi.present(sessionId, requestId))
                  }
                />
              ) : !canCollectCash ? (
                <Card>
                  {payOs.isError ? (
                    <QueryStatus query={payOs} />
                  ) : payOsNeedsReview ? (
                    <Notice error text="Giao dịch PayOS cần đối soát. Vui lòng liên hệ thu ngân." />
                  ) : payOs.isSuccess && !hasMatchingPayment ? (
                    <Notice text="Chờ thu ngân in phiếu có VietQR cho hóa đơn này." />
                  ) : (
                    <Notice text="Đang kiểm tra trạng thái thanh toán…" />
                  )}
                </Card>
              ) : (
                <Card>
                  <Title
                    title={review ? 'Kiểm tra tiền bàn giao' : 'Thu tiền mặt'}
                  />
                  {!review && !draft && (
                    <>
                      <Field
                        label="Số tiền khách đưa (₫)"
                        placeholder="Nhập số tiền đã nhận"
                        keyboardType="number-pad"
                        maxLength={15}
                        value={amount}
                        editable={!action.isPending}
                        onChangeText={(v) => setAmount(v.replace(/[^0-9]/g, ''))}
                      />
                      <Button
                        title="Khách đưa vừa đủ"
                        secondary
                        disabled={action.isPending}
                        onPress={() => setAmount(String(preparedBill.bill.totalAmount))}
                      />
                    </>
                  )}
                  <View className="gap-2 rounded-xl bg-emerald-50 p-3">
                    <View className="flex-row justify-between gap-2">
                      <Text className="text-slate-600">Tiền hóa đơn</Text>
                      <Text className="font-semibold">{money(preparedBill.bill.totalAmount)}</Text>
                    </View>
                    <View className="flex-row justify-between gap-2">
                      <Text className="text-slate-600">Giao thu ngân</Text>
                      <Text className="font-semibold">
                        {amount || draft ? money(Number(draft?.received ?? amount)) : '—'}
                      </Text>
                    </View>
                    <View className="flex-row justify-between gap-2 border-t border-emerald-100 pt-2">
                      <Text className="font-semibold text-emerald-900">Tiền thừa trả khách</Text>
                      <Text className="font-semibold text-emerald-900">
                        {amount || draft
                          ? money(Math.max(0, Number(draft?.received ?? amount) - preparedBill.bill.totalAmount))
                          : '—'}
                      </Text>
                    </View>
                  </View>
                  {!!amount && !draft && !validCash(amount, preparedBill.bill.totalAmount) && (
                    <Notice
                      error
                      text={`Số tiền phải là số nguyên và ít nhất bằng tiền hóa đơn (${money(preparedBill.bill.totalAmount)}).`}
                    />
                  )}
                  {draft && (
                    <Notice text="Đã bắt đầu ghi nhận. Thử lại dùng cùng số tiền và mã giao dịch; không nhận tiền lần nữa." />
                  )}
                  {review ? (
                    <>
                      <Button
                        title={action.isPending ? 'Đang gửi…' : 'Xác nhận và gửi thu ngân'}
                        disabled={action.isPending || preparedBill.bill.totalAmount !== review.total}
                        onPress={() => void collect()}
                      />
                      <Button
                        title="Sửa số tiền"
                        secondary
                        disabled={action.isPending}
                        onPress={() => setReview(null)}
                      />
                    </>
                  ) : (
                    <Button
                      title={
                        action.isPending
                          ? 'Đang ghi nhận…'
                          : draft
                            ? 'Kiểm tra và thử lại giao dịch'
                            : 'Kiểm tra số tiền'
                      }
                      disabled={
                        action.isPending ||
                        (!draft && !validCash(amount, preparedBill.bill.totalAmount))
                      }
                      onPress={() => {
                        if (draft) {
                          void recover();
                          return;
                        }
                        setReview({
                          total: preparedBill!.bill.totalAmount,
                          received: Number(amount),
                        });
                      }}
                    />
                  )}
                </Card>
              )}
            </>
          )}
        </>
      )}
      {current && (
        <Card>
          <Title
            title={
              cashReturnRequired
                ? 'Cần trả lại tiền mặt'
                : current.paymentStatus === 'Paid'
                ? 'Đã thanh toán'
                : 'Chờ thu ngân xác nhận'
            }
          />
          <Text>Khách đưa / giao thu ngân: {money(current.cashReceived)}</Text>
          {!cashReturnRequired && <Text>Tiền thừa trả khách: {money(current.changeAmount)}</Text>}
          <Notice
            text={
              cashReturnRequired
                ? 'Khách đã chuyển khoản. Phối hợp với thu ngân để trả lại toàn bộ tiền mặt đã nhận.'
                : current.paymentStatus === 'Paid'
                ? 'Thu ngân đã xác nhận nhận tiền. Kiểm tra và đưa tiền thừa lại khách.'
                : 'Giao toàn bộ tiền khách đưa cho thu ngân. Thanh toán chỉ hoàn tất sau khi thu ngân xác nhận.'
            }
          />
          <QueryStatus query={handover} />
        </Card>
      )}
      {!current && !paidByPayOs && request.isSuccess && !request.data && (
        <Notice text="Yêu cầu không còn trong danh sách đang xử lý. Hãy kiểm tra với thu ngân trước khi nhận tiền." />
      )}
      {request.data && request.data.handledByRef && !responsible && (
        <Notice text="Yêu cầu đang do nhân viên khác xử lý." />
      )}
    </Page>
  );
}
