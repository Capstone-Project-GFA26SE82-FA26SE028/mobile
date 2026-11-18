import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { Text } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Page, Title, Button, Card, Field, Notice, Sheet, Empty } from '../../shared/components/UI';
import { QueryStatus } from '../../shared/components/QueryStatus';
import { money } from '../../shared/utils/rules';
import { collectionApi } from '../api/collectionApi';
import { useCollectionQuery, useCollectionAction } from '../hooks/useCollection';
import { startCollection, collectionSaved } from '../store/collectionSlice';
import { validCash } from '../utils/money';
import { authError, authService } from '@/features/auth/api/authApi';
import { readCollection, saveCollection } from '../store/collectionStorage';
import { useServiceTables } from '../../tables/hooks/useTables';
import { BillCard } from '../components/BillCard';
export default function CashCollectionScreen() {
    const { id = '', sessionId = '', requestId = '', restaurantId = '' } = useLocalSearchParams<{
        id: string;
        sessionId: string;
        requestId: string;
        restaurantId: string;
    }>();
    const tables = useServiceTables();
    const restaurant = restaurantId || tables.data?.find(t => t.tableId === id)?.restaurantId || '';
    const dispatch = useAppDispatch();
    const user = useAppSelector(s => s.waiter.waiter?.id);
    const draft = useAppSelector(s => s.waiterCollection.drafts[requestId]);
    const [restored, setRestored] = useState(false);
    const [storageError, setStorageError] = useState('');
    useEffect(() => {
        let active = true;
        setRestored(false);
        setStorageError('');
        if (!user || !requestId)
            return;
        void readCollection(user, requestId).then(saved => {
            if (!active)
                return;
            if (saved)
                dispatch(startCollection({ id: requestId, draft: saved }));
            setRestored(true);
        }).catch(error => { if (active)
            setStorageError(authError(error)); });
        return () => { active = false; };
    }, [user, requestId, dispatch]);
    const [amount, setAmount] = useState('');
    const [review, setReview] = useState<{
        total: number;
        received: number;
    } | null>(null);
    const lock = useRef(false);
    const action = useCollectionAction();
    const request = useCollectionQuery('request:' + requestId, async (signal) => (await collectionApi.list(restaurant, signal)).find(r => r.serviceRequestId === requestId) ?? null, restored && !!restaurant && !!requestId && !draft?.handover);
    const responsible = restored && !!user && request.data?.handledByRef === user;
    const bill = useCollectionQuery('bill:' + requestId, signal => collectionApi.bill(sessionId, requestId, signal), responsible && !draft?.handover);
    const handover = useCollectionQuery('handover:' + draft?.handover?.paymentId, signal => collectionApi.handover(draft!.handover!.paymentId, signal), !!draft?.handover);
    const current = handover.data ?? draft?.handover;
    async function run(work: () => Promise<unknown>) {
        if (lock.current)
            return;
        lock.current = true;
        try {
            await action.mutateAsync(work);
        }
        catch { /* Mutation error is displayed below. */ }
        finally {
            lock.current = false;
        }
    }
    async function collect() {
        if (!bill.data || !review || review.total !== bill.data.bill.totalAmount)
            return;
        const submission = draft ?? { key: Crypto.randomUUID(), received: review.received, billId: bill.data.bill.billId, checkoutId: bill.data.checkoutId, sessionId, restaurantId: restaurant, tableId: id };
        const identity = authService.identity();
        await run(async () => {
            if (!user)
                throw new Error('Vui lòng đăng nhập lại.');
            await saveCollection(user, requestId, submission);
            if (identity !== authService.identity())
                throw new Error('Tài khoản đã thay đổi.');
            dispatch(startCollection({ id: requestId, draft: submission }));
            const saved = await collectionApi.collect(submission);
            if (identity !== authService.identity())
                return;
            dispatch(collectionSaved({ id: requestId, handover: saved }));
            await saveCollection(user, requestId, { ...submission, handover: saved });
            setReview(null);
        });
    }
    async function recover() {
        if (!draft || !user)
            return;
        const identity = authService.identity();
        await run(async () => {
            const saved = await collectionApi.collect(draft);
            if (identity !== authService.identity())
                return;
            dispatch(collectionSaved({ id: requestId, handover: saved }));
            await saveCollection(user, requestId, { ...draft, handover: saved });
        });
    }
    if (!sessionId || !requestId)
        return <Page><Empty text="Hãy mở thu hộ từ danh sách yêu cầu thanh toán của khách."/></Page>;
    if (!restored)
        return <Page><Title title="Thu hộ tiền mặt"/><Notice error={!!storageError} text={storageError || 'Đang khôi phục giao dịch…'}/></Page>;
    return <Page><Title title="Thu hộ tiền mặt" subtitle={request.data?.tables.map(t => t.tableCode).join(', ')}/>
    <QueryStatus query={tables}/>
    {!current && restaurant && <QueryStatus query={request}/>}
    {action.isError && <Notice error text={authError(action.error)}/>}
    {draft && !current && <Card>
      <Notice text="Có giao dịch đang chờ xác minh. Không nhận tiền lần nữa. Kiểm tra lại bằng đúng mã và số tiền đã lưu."/>
      <Text>Tiền đã ghi nhận: {money(draft.received)}</Text>
      <Button title="Kiểm tra lại giao dịch đã gửi" disabled={action.isPending} onPress={() => void recover()}/>
    </Card>}
    {!current && request.data?.status === 'Requested' && <Button title="Tiếp nhận yêu cầu thanh toán" disabled={action.isPending} onPress={() => void run(() => collectionApi.acknowledge(sessionId, requestId))}/>}
    {responsible && !current && <>
      <Button title="Gửi yêu cầu đến thu ngân" secondary disabled={action.isPending} onPress={() => void run(() => collectionApi.submit(sessionId, requestId))}/>
      {bill.isError && <><Notice text="Đang chờ thu ngân chốt bill. Nếu chưa gửi yêu cầu, hãy gửi đến thu ngân trước."/><QueryStatus query={bill}/></>}
      {bill.isPending && <Notice text="Đang tải hóa đơn…"/>}
      {bill.data && <><BillCard value={bill.data}/>
        {bill.data.checkoutStatus !== 'Presented' ? <Button title="Xác nhận đã đưa bill cho khách" disabled={action.isPending} onPress={() => void run(() => collectionApi.present(sessionId, requestId))}/> : <Card>
          <Notice text="Nhận toàn bộ tiền khách đưa và giao cho thu ngân. Thu ngân trả tiền thừa để bạn đưa lại khách."/>
          <Field label="Số tiền khách đưa (₫)" keyboardType="number-pad" maxLength={15} value={draft ? String(draft.received) : amount} editable={!draft && !action.isPending} onChangeText={v => setAmount(v.replace(/[^0-9]/g, ''))}/>
          <Text>Tiền thừa: {money(Math.max(0, Number(draft?.received ?? amount) - bill.data.bill.totalAmount))}</Text>
          {draft && <Notice text="Đã bắt đầu ghi nhận. Thử lại dùng cùng số tiền và mã giao dịch; không nhận tiền lần nữa."/>}
          <Button title={action.isPending ? 'Đang ghi nhận…' : draft ? 'Kiểm tra và thử lại giao dịch' : 'Ghi nhận đã nhận tiền'} disabled={action.isPending || !validCash(String(draft?.received ?? amount), bill.data.bill.totalAmount)} onPress={() => setReview({ total: bill.data!.bill.totalAmount, received: Number(draft?.received ?? amount) })}/>
        </Card>}
      </>}
    </>}
    {current && <Card><Title title={current.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chờ thu ngân xác nhận'}/>
      <Text>Khách đưa / giao thu ngân: {money(current.cashReceived)}</Text><Text>Tiền thừa trả khách: {money(current.changeAmount)}</Text>
      <Notice text={current.paymentStatus === 'Paid' ? 'Thu ngân đã xác nhận nhận tiền. Kiểm tra và đưa tiền thừa lại khách.' : 'Giao toàn bộ tiền khách đưa cho thu ngân. Thanh toán chỉ hoàn tất sau khi thu ngân xác nhận.'}/>
      <QueryStatus query={handover}/>
    </Card>}
    {!current && request.isSuccess && !request.data && <Notice text="Yêu cầu không còn trong danh sách đang xử lý. Hãy kiểm tra với thu ngân trước khi nhận tiền."/>}
    {request.data && request.data.handledByRef && !responsible && <Notice text="Yêu cầu đang do nhân viên khác xử lý."/>}
    {review && <Sheet title="Xác nhận thu hộ" onClose={() => { if (!action.isPending)
            setReview(null); }}>
      <Text>Hóa đơn: {money(review.total)}</Text><Text>Đã nhận từ khách: {money(review.received)}</Text><Text>Tiền thừa: {money(review.received - review.total)}</Text>
      <Notice text="Chỉ xác nhận khi đã cầm tiền. Giao toàn bộ số tiền khách đưa cho thu ngân."/>
      <Button title="Xác nhận đã nhận tiền" disabled={action.isPending || bill.data?.bill.totalAmount !== review.total} onPress={() => void collect()}/>
      {action.isError && <Notice error text={authError(action.error)}/>}
    </Sheet>}
  </Page>;
}
