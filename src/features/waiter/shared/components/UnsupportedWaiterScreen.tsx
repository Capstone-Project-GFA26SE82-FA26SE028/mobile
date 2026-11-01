import { useState } from 'react';
import { Chips, Empty, Notice, Page, Search, Title } from './UI';

type Props = {
  title?: string;
  subtitle?: string;
  tabs?: string[];
  searchable?: boolean;
};

export default function UnsupportedWaiterScreen({
  title = 'Chức năng chưa khả dụng',
  subtitle,
  tabs = [],
  searchable = false,
}: Props) {
  const [tab, setTab] = useState(tabs[0] ?? '');
  const [query, setQuery] = useState('');
  return (
    <Page>
      <Title title={title} subtitle={subtitle} />
      {!!tabs.length && <Chips options={tabs} value={tab} onChange={setTab} />}
      {searchable && (
        <Search
          value={query}
          onChange={setQuery}
          placeholder="Tìm tên hoặc số điện thoại…"
        />
      )}
      <Notice text="Chưa thể tải hoặc cập nhật dữ liệu cho chức năng này trong phiên phục vụ hiện tại." />
      <Empty text="Chưa có dữ liệu để hiển thị." />
    </Page>
  );
}
