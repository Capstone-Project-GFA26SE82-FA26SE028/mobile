import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppSelector } from '../../../app/hooks';
import { changePassword, getProfile, updateProfile, uploadProfileAvatar } from '../api/profileApi';

export function useProfile() {
  const user = useAppSelector((state) => state.auth.user);
  const client = useQueryClient();
  const key = ['staff-profile', user?.id];
  const profile = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => getProfile(signal),
    enabled: !!user,
    retry: false,
  });
  const save = useMutation({
    mutationFn: updateProfile,
    retry: false,
    onSuccess: (value) => client.setQueryData(key, value),
  });
  const avatar = useMutation({
    mutationFn: ({ file, identity }: { file: FormData; identity: string }) =>
      uploadProfileAvatar(file, identity),
    retry: false,
    onSuccess: async (value) => {
      await client.cancelQueries({ queryKey: key });
      client.setQueryData<Awaited<ReturnType<typeof getProfile>>>(key, (current) =>
        current ? { ...current, avatarUrl: value.avatarUrl } : current,
      );
      void client.invalidateQueries({ queryKey: key });
    },
  });
  const password = useMutation({ mutationFn: changePassword, retry: false });
  return { user, profile, save, avatar, password };
}
