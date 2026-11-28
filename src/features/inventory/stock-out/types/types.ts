import type { StockMovement } from '../../stock/types/types';

export type StockIssueRequest = {
  stockIssueId: string;
  reason: string;
  items: {
    ingredientId: string;
    quantity: number;
    goodsReceiptItemId?: string;
    isDisposal?: boolean;
  }[];
};

export type StockIssue = {
  stockIssueId: string;
  createdByRef: string;
  createdByName?: string | null;
  reason: string;
  createdAt: string;
  allocations: StockIssueAllocation[];
};

type StockIssueAllocation = Omit<StockMovement, 'goodsReceiptItemId'> & {
  goodsReceiptItemId: string | null;
  receivedAt?: string | null;
  expiryDate?: string | null;
};
