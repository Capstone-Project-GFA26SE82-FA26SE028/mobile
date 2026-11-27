export type ServiceTable = {
  tableId: string;
  tableCode: string;
  areaId: string;
  areaName: string;
  restaurantId: string;
  cleaningStatus: string;
  openSessionIds: string[];
};
export type TableTransferRequest = {
  sessionId: string;
  mode: 'merge' | 'split';
  targetTableId: string;
  reason: string;
  items: { orderItemId: string; quantity: number }[];
  key: string;
};
export type TableTransferResult = {
  operationId: string;
  sourceSessionId: string;
  targetSessionId: string;
  targetTableId: string;
  restaurantId: string;
  actorId: string;
  status: string;
};
export type TableSession = {
  tableSessionId: string;
  tableId: string;
  tableCode: string;
  status: string;
  openedAt: string;
  isNewSession: boolean;
};
