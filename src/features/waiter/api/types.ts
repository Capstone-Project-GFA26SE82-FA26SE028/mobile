export type Envelope<T> = { isSuccess: boolean; message: string; result: T };
export type PageResult<T> = { items: T[]; totalCount: number; page: number; pageSize: number };
export type ServiceTable = {
  tableId: string; tableCode: string; areaId: string; areaName: string;
  restaurantId: string; cleaningStatus: string; openSessionIds: string[];
};
export type TableSession = {
  tableSessionId: string; tableId: string; tableCode: string; status: string;
  openedAt: string; isNewSession: boolean;
};
export type MenuOption = {
  optionId: string; optionName: string; extraPrice: number; canSelect: boolean;
};
export type MenuGroup = {
  optionGroupId: string; optionGroupName: string; minSelection: number;
  maxSelection: number; options: MenuOption[];
};
export type MenuItem = {
  itemId: string; itemName: string; categoryName: string; description?: string;
  imageUrl?: string; price: number | null; canOrder: boolean;
  unavailableReason?: string; optionGroups: MenuGroup[];
};
export type Selection = {
  itemId: string; quantity: number; note: string;
  options: { optionId: string; quantity: number }[];
};
export type OrderLine = {
  orderItemId: string; itemId: string; nameSnapshot: string; quantity: number;
  unitPriceSnapshot: number; lineTotal: number; note?: string; status: string;
  options: { optionId: string; name: string; quantity: number; extraPrice: number }[];
};
export type Order = {
  orderId: string; orderNumber: string; tableSessionId: string; source: string;
  status: string; version: string; createdAt: string; confirmedAt?: string;
  confirmedBy?: string; items: OrderLine[]; totalAmount: number;
};
