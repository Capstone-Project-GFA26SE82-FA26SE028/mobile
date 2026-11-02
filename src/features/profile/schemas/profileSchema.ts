import type { FormErrors, PasswordValues, ProfileValues } from '../types/types';

export function validateProfile(
  values: ProfileValues,
): FormErrors<ProfileValues> {
  const errors: FormErrors<ProfileValues> = {};
  if (!values.fullName.trim()) errors.fullName = 'Vui lòng nhập họ và tên.';
  else if (values.fullName.trim().length > 255)
    errors.fullName = 'Họ và tên tối đa 255 ký tự.';
  if (values.phoneNumber.trim() && !/^0\d{9}$/.test(values.phoneNumber.trim()))
    errors.phoneNumber = 'Nhập 10 chữ số, bắt đầu bằng 0.';
  const avatar = values.avatarUrl.trim();
  if (avatar.length > 2048) errors.avatarUrl = 'Đường dẫn ảnh quá dài.';
  else if (avatar) {
    try {
      if (!['http:', 'https:'].includes(new URL(avatar).protocol))
        throw new Error();
    } catch {
      errors.avatarUrl = 'Nhập đường dẫn ảnh HTTP hoặc HTTPS hợp lệ.';
    }
  }
  return errors;
}

// Count UTF-8 bytes without relying on TextEncoder being available on Android.
function passwordBytes(value: string) {
  let bytes = 0;
  for (const character of value) {
    const code = character.codePointAt(0)!;
    bytes += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
  }
  return bytes;
}

export function validatePassword(
  values: PasswordValues,
): FormErrors<PasswordValues> {
  const errors: FormErrors<PasswordValues> = {};
  if (!values.currentPassword)
    errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại.';
  else if (passwordBytes(values.currentPassword) > 72)
    errors.currentPassword = 'Mật khẩu quá dài. Vui lòng nhập ngắn hơn.';
  if (!values.newPassword.trim())
    errors.newPassword = 'Vui lòng nhập mật khẩu mới.';
  else if (values.newPassword.length < 8)
    errors.newPassword = 'Mật khẩu phải có ít nhất 8 ký tự.';
  else if (passwordBytes(values.newPassword) > 72)
    errors.newPassword = 'Mật khẩu quá dài. Vui lòng nhập ngắn hơn.';
  else if (values.newPassword === values.currentPassword)
    errors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại.';
  if (!values.confirmPassword)
    errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới.';
  else if (values.newPassword !== values.confirmPassword)
    errors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
  return errors;
}
