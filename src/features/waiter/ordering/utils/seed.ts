import type { CustomerOrder } from '../types/types';

export function createCustomerOrders(now: number): CustomerOrder[] {
  return [
    {
      id: 'QR-001',
      sessionId: 'S3',
      version: 1,
      createdAt: now - 2 * 60000,
      status: 'awaiting_confirmation',
      note: 'Cho bé ăn trước giúp mình nhé.',
      lines: [
        {
          dishId: 'salmon',
          name: 'Cá hồi áp chảo sốt chanh',
          quantity: 1,
          price: 189000,
          note: 'Không tiêu, ít sốt',
        },
        {
          dishId: 'orange',
          name: 'Nước cam tươi',
          quantity: 2,
          price: 45000,
          note: 'Không đá',
        },
      ],
    },
    {
      id: 'QR-002',
      sessionId: 'S2',
      version: 1,
      createdAt: now - 60000,
      status: 'awaiting_confirmation',
      note: 'Gọi thêm sau lượt đầu.',
      lines: [
        {
          dishId: 'salad',
          name: 'Salad vườn Mộc',
          quantity: 1,
          price: 79000,
          note: 'Sốt để riêng',
        },
      ],
    },
    {
      id: 'QR-003',
      sessionId: 'S3',
      version: 1,
      createdAt: now - 30000,
      status: 'awaiting_confirmation',
      note: '',
      lines: [
        {
          dishId: 'toast',
          name: 'Bánh mì bơ & trứng',
          quantity: 1,
          price: 69000,
          note: 'Cắt đôi giúp mình',
        },
      ],
    },
  ];
}
