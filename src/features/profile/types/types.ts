export type Profile = {
  userId: string;
  userName: string;
  email: string;
  fullName: string | null;
  phoneNumber: string | null;
  avatarUrl: string | null;
  roleId: string;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ProfileValues = {
  fullName: string;
  phoneNumber: string;
  avatarUrl: string;
};

export type PasswordValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type FormErrors<T> = Partial<Record<keyof T, string>>;
