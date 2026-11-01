/* eslint-disable @typescript-eslint/no-require-imports -- Metro needs static require calls for native image assets. */
import type { Dish } from '../../shared/types/types';
export const waiterMenu: Dish[] = [
  {
    id: 'salmon',
    name: 'Cá hồi áp chảo sốt chanh',
    category: 'Món chính',
    price: 189000,
    available: true,
    image: require('../../../../assets/images/waiter/salmon.jpg'),
  },
  {
    id: 'salad',
    name: 'Salad vườn Mộc',
    category: 'Khai vị',
    price: 79000,
    available: true,
    image: require('../../../../assets/images/waiter/salad.jpg'),
  },
  {
    id: 'pasta',
    name: 'Mì Ý sốt húng quế',
    category: 'Món chính',
    price: 119000,
    available: true,
    image: require('../../../../assets/images/waiter/pasta.jpg'),
  },
  {
    id: 'orange',
    name: 'Nước cam tươi',
    category: 'Đồ uống',
    price: 45000,
    available: true,
    image: require('../../../../assets/images/waiter/orange.jpg'),
  },
  {
    id: 'rice',
    name: 'Cơm rau củ cầu vồng',
    category: 'Món chính',
    price: 99000,
    available: false,
    image: require('../../../../assets/images/waiter/rice.jpg'),
  },
  {
    id: 'toast',
    name: 'Bánh mì bơ & trứng',
    category: 'Khai vị',
    price: 69000,
    available: true,
    image: require('../../../../assets/images/waiter/toast.jpg'),
  },
];
