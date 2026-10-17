export type CustomerOrder = {
  id: string;
  sessionId: string;
  version: number;
  createdAt: number;
  status: 'awaiting_confirmation' | 'confirmed';
  note: string;
  lines: { dishId: string; name: string; quantity: number; price: number; note: string }[];
  confirmedBy?: { id: string; name: string };
  confirmedAt?: number;
};
