export type ReceiptIngredient = {
  ingredientId: string;
  ingredientCode: string;
  ingredientName: string;
  baseUnit: string;
  isActive: boolean;
};

export type ReceiptPage<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type ReceiptItem = {
  goodsReceiptItemId: string;
  ingredientId: string;
  unitId: string | null;
  inputQuantity: number;
  conversionFactorSnapshot: number;
  receivedQuantity: number;
  expiryDate: string;
};
export type GoodsReceipt = {
  goodsReceiptId: string;
  receiptCode: string;
  status: string;
  createdByRef: string;
  createdAt: string;
  confirmAt: string | null;
  note: string | null;
  items: ReceiptItem[];
};
export type ReceiptRequest = {
  goodsReceiptId: string;
  note: string;
  items: {
    ingredientId: string;
    unitId: string | null;
    receivedQuantity: number;
    expiryDate: string;
  }[];
};
export type ReceiptUnit = { unitId: string; code: string; name: string };
export type IngredientConversion = {
  ingredientId: string;
  unitId: string;
  conversionFactor: number;
};
export type ReceiptDraftLine = {
  key: string;
  ingredient: ReceiptIngredient;
  quantity: string;
  expiry: string;
  unitId: string | null;
  unitLabel: string;
  factor: number;
};
