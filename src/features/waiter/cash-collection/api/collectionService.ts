import type { AxiosInstance } from 'axios';
import type { Envelope, PageResult } from '../../shared/types/api';
import type { PaymentRequest, PreparedBill, Handover, CollectionDraft } from '../types';
import { requestPath } from '../utils/money';
export function createCollectionService(client: Pick<AxiosInstance, 'get' | 'post'>) {
    function unwrap<T>(data: Envelope<T>): T {
        if (!data.isSuccess)
            throw new Error(data.message || 'Không thể xử lý thanh toán.');
        return data.result;
    }
    async function get<T>(url: string, signal?: AbortSignal) { return unwrap((await client.get<Envelope<T>>(url, { signal })).data); }
    async function post<T>(url: string) { return unwrap((await client.post<Envelope<T>>(url)).data); }
    return {
        async list(restaurant: string, signal?: AbortSignal) {
            const rows: PaymentRequest[] = [];
            for (let page = 1;; page++) {
                const data = unwrap((await client.get<Envelope<PageResult<PaymentRequest>>>('/api/restaurants/' + restaurant + '/payment-requests', { signal, params: { page, pageSize: 100 } })).data);
                rows.push(...data.items);
                if (!data.items.length || rows.length >= data.totalCount)
                    return rows;
            }
        },
        acknowledge: (session: string, id: string) => post<PaymentRequest>(requestPath(session, id) + '/acknowledge'),
        submit: (session: string, id: string) => post<unknown>(requestPath(session, id) + '/submit'),
        bill: (session: string, id: string, signal?: AbortSignal) => get<PreparedBill>(requestPath(session, id) + '/bill', signal),
        present: (session: string, id: string) => post<PreparedBill>(requestPath(session, id) + '/present'),
        handover: (id: string, signal?: AbortSignal) => get<Handover>('/api/cash-handovers/' + id, signal),
        async collect(draft: CollectionDraft) {
            return unwrap((await client.post<Envelope<Handover>>('/api/bills/' + draft.billId + '/cash-handovers', { checkoutId: draft.checkoutId, cashReceived: draft.received }, { headers: { 'Idempotency-Key': draft.key } })).data);
        },
    };
}
