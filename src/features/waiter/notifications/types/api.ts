export type NotificationState = {
  initialized: boolean;
  knownIds: Record<string, true>;
  soundEnabled: boolean;
  soundCue: number;
  soundError: string | null;
};
