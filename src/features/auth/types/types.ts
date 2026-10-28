export type StaffRole = 'waiter' | 'inventory';

export type StaffProfile = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  active: true;
};

export type AuthCredentials = {
  user: {
    userId: string;
    userName: string;
    fullName?: string | null;
    email: string;
    roleId: string;
    isActive: boolean;
  };
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresAt: string;
  sessionExpiresAt: string;
};

export type SavedSession = { refreshToken: string; sessionExpiresAt: string };
export type AuthStorage = {
  read: () => Promise<SavedSession | null>;
  write: (session: SavedSession | null) => Promise<void>;
};
