export function validCash(value: string, total: number) {
    const amount = Number(value);
    return /^\d+$/.test(value) && Number.isSafeInteger(amount) && amount >= total && total > 0;
}
export function requestPath(session: string, id: string) {
    return '/api/table-sessions/' + session + '/payment-requests/' + id;
}
