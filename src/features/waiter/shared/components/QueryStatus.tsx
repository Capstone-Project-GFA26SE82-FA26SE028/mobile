import { ActivityIndicator } from 'react-native';
import { Button, Notice } from './UI';
import { authError } from '../../auth/authService';

export function QueryStatus({ query }: { query: { isPending: boolean; error: unknown; refetch: () => unknown } }) {
  return <>
    {query.isPending && <ActivityIndicator accessibilityLabel="Đang tải dữ liệu" />}
    {!!query.error && <>
      <Notice error text={authError(query.error)} />
      <Button title="Thử lại" secondary onPress={() => { void query.refetch(); }} />
    </>}
  </>;
}
