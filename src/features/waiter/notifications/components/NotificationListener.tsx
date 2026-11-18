import { useEffect, useRef } from 'react';
import { AppState, Vibration } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useNotifications } from '../hooks/useNotifications';
import { useBell } from '../hooks/useBell';
import {
  notificationSoundFailed,
  notificationsReceived,
} from '../store/notificationSlice';
import { authService } from '@/features/auth/api/authApi';
export function NotificationListener() {
  const feed = useNotifications();
  const dispatch = useAppDispatch();
  const cue = useAppSelector((s) => s.waiterNotifications.soundCue);
  const enabled = useAppSelector(
    (s) => s.waiter.authMode === 'api' && s.waiter.signedIn,
  );
  const user = useAppSelector((s) => s.waiter.waiter?.id);
  const played = useRef(cue);
  const play = useBell();
  useEffect(() => {
    if (enabled && feed.isSuccess && feed.data)
      dispatch(notificationsReceived(feed.data));
  }, [dispatch, enabled, feed.data, feed.isSuccess, user]);
  useEffect(() => {
    if (cue <= played.current || !enabled) {
      played.current = cue;
      return;
    }
    played.current = cue;
    if (AppState.currentState !== 'active') return;
    const identity = authService.identity();
    Vibration.vibrate(200);
    void play()
      .then(() => {
        if (identity === authService.identity())
          dispatch(notificationSoundFailed(null));
      })
      .catch(() => {
        if (identity === authService.identity())
          dispatch(
            notificationSoundFailed(
              'Chưa phát được chuông. Nhấn “Thử chuông” và kiểm tra âm lượng thiết bị.',
            ),
          );
      });
  }, [cue, enabled, play, dispatch]);
  return null;
}
