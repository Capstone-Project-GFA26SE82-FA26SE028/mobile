export type WaiterProfile = {
  id: string;
  name: string;
  role: 'waiter';
  active: boolean;
  email?: string;
};

export const demoWaiter: WaiterProfile = {
  id: 'W_DEMO', name: 'Trần Hoàng', role: 'waiter', active: true,
};
