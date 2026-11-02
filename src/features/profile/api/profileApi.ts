import axios from 'axios';
import { axiosClient } from '../../../api/axiosClient';
import { authService } from '../../auth/api/authApi';
import type { PasswordValues, Profile, ProfileValues } from '../types/types';

type Response<T> = { isSuccess: boolean; message?: string | null; result: T };

function session() {
  const identity = authService.identity();
  if (!identity) throw new Error('Vui lòng đăng nhập lại.');
  return identity;
}

function result<T>(data: Response<T>, identity: string) {
  if (identity !== authService.identity())
    throw new Error('Tài khoản đã thay đổi. Vui lòng đăng nhập lại.');
  if (!data.isSuccess)
    throw new Error(data.message || 'Không thể hoàn tất yêu cầu.');
  return data.result;
}

function checkProfile(profile: Profile, identity: string) {
  if (profile.userId.toLowerCase() !== identity.split(':')[0].toLowerCase())
    throw new Error(
      'Thông tin hồ sơ không khớp với tài khoản. Vui lòng tải lại.',
    );
  return profile;
}

export async function getProfile(signal?: AbortSignal) {
  const identity = session();
  const { data } = await axiosClient.get<Response<Profile>>('/api/users/me', {
    signal,
    staffSession: identity,
  });
  return checkProfile(result(data, identity), identity);
}

export async function updateProfile(values: ProfileValues) {
  const identity = session();
  const { data } = await axiosClient.put<Response<Profile>>(
    '/api/users/me',
    {
      fullName: values.fullName.trim(),
      phoneNumber: values.phoneNumber.trim(),
      avatarUrl: values.avatarUrl.trim(),
    },
    { staffSession: identity },
  );
  const profile = checkProfile(result(data, identity), identity);
  authService.updateName(profile.fullName || profile.userName, identity);
  return profile;
}

export async function changePassword(values: PasswordValues) {
  const identity = session();
  const { data } = await axiosClient.post<Response<null>>(
    '/api/auth/change-password',
    values,
    { staffSession: identity },
  );
  result(data, identity);
  // The backend revokes the old sessions after changing the password.
  await authService.clear('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
}

export function profileError(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Không kết nối được máy chủ. Vui lòng thử lại.';
    if (error.response.status >= 500)
      return 'Dịch vụ tài khoản đang gián đoạn. Vui lòng thử lại.';
    return typeof error.response.data?.message === 'string'
      ? error.response.data.message
      : 'Không thể hoàn tất yêu cầu. Vui lòng kiểm tra thông tin.';
  }
  return error instanceof Error ? error.message : 'Không thể hoàn tất yêu cầu.';
}
