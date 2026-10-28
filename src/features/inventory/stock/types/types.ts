export type Ingredient = {
  ingredientId: string;
  ingredientCode: string;
  ingredientName: string;
  baseUnit: string;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  isLowStock: boolean;
  stockVersion: string;
};

export type StockLot = {
  goodsReceiptItemId: string;
  ingredientId: string;
  receivedAt: string;
  expiryDate: string | null;
  receivedQuantity: number;
  remainingQuantity: number;
  expiryStatus: string;
  canIssue: boolean;
};

export type StockMovement = {
  stockMovementId: string;
  stockIssueId: string | null;
  ingredientId: string;
  goodsReceiptItemId: string;
  movementType: string;
  quantityChange: number;
  performedByRef: string;
  reason: string | null;
  createdAt: string;
};

export type StockPage<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
};
export type StockFilter = 'all' | 'low' | 'inactive';
