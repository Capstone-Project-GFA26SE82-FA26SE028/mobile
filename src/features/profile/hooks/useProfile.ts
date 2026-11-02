import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppSelector } from '../../../app/hooks';
import { changePassword, getProfile, updateProfile } from '../api/profileApi';

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
  const password = useMutation({ mutationFn: changePassword, retry: false });
  return { user, profile, save, password };
}
