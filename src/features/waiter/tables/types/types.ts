export type ServiceTable = {
  tableId: string;
  tableCode: string;
  areaId: string;
  areaName: string;
  restaurantId: string;
  cleaningStatus: string;
  openSessionIds: string[];
};
export type TableSession = {
  tableSessionId: string;
  tableId: string;
  tableCode: string;
  status: string;
  openedAt: string;
  isNewSession: boolean;
};
