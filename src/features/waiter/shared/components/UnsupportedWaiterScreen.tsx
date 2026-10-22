import { Empty, Page, Title } from './UI';

export default function UnsupportedWaiterScreen() {
  return <Page><Title title="Chức năng chưa khả dụng" />
    <Empty text="Chức năng này chưa có API backend. Hiện chưa thể gửi hoặc cập nhật dữ liệu." />
  </Page>;
}

