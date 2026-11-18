export type PaymentRequest = {
    serviceRequestId: string;
    tableSessionId: string;
    restaurantId: string;
    status: string;
    requestedAt: string;
    handledByRef: string | null;
    tables: {
        tableId: string;
        tableCode: string;
    }[];
};
export type PreparedBill = {
    checkoutId: string;
    checkoutStatus: string;
    bill: {
        billId: string;
        billNumber: string;
        subTotal: number;
        serviceAmount: number;
        vatAmount: number;
        totalAmount: number;
        items: {
            billLineId: string;
            quantity: number;
            lineTotal: number;
            item: {
                name?: string;
                itemName?: string;
            };
        }[];
    };
};
export type Handover = {
    paymentId: string;
    status: string;
    paymentStatus: string;
    amount: number;
    cashReceived: number;
    changeAmount: number;
    collectedAt: string;
    confirmedAt: string | null;
};
export type CollectionDraft = {
    key: string;
    received: number;
    billId: string;
    checkoutId: string;
    sessionId?: string;
    restaurantId?: string;
    tableId?: string;
    handover?: Handover;
};
