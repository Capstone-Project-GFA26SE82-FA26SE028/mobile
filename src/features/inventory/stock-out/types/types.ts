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
  reason: string;
  createdAt: string;
  allocations: StockMovement[];
};
