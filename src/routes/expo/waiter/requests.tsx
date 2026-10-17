import { Empty, Page, Title } from '@/features/waiter/shared/components/UI';

// Temporary route: the original feature screen will be migrated in its own branch.
export default function PendingFeatureScreen() {
  return (
    <Page>
      <Title title="Tính năng chưa được chuyển" />
      <Empty text="Tính năng này sẽ được đưa sang từ old-mobile ở nhánh riêng. Bạn có thể vào tab Cá nhân để đăng xuất." />
    </Page>
  );
}
