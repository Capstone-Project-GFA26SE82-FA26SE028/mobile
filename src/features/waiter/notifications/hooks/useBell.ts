import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useCallback, useEffect } from 'react';
export function useBell() {
  const player = useAudioPlayer(require('../assets/notification-bell.wav'));
  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    }).catch(() => {});
  }, []);
  return useCallback(async () => {
    if (!player.isLoaded)
      throw new Error('Tiếng chuông đang tải. Hãy thử lại.');
    await player.seekTo(0);
    player.play();
  }, [player]);
}
