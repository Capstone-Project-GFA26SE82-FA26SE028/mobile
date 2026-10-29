import { Loading } from '@/components/Loading/Loading';
import { ErrorState } from '@/components/ErrorState/ErrorState';
import { authError } from '@/features/auth/api/authApi';

export function QueryStatus({
  query,
}: {
  query: { isPending: boolean; error: unknown; refetch: () => unknown };
}) {
  return (
    <>
      {query.isPending && <Loading compact />}
      {!!query.error && (
        <ErrorState
          message={authError(query.error)}
          onRetry={() => {
            void query.refetch();
          }}
          busy={query.isPending}
        />
      )}
    </>
  );
}
