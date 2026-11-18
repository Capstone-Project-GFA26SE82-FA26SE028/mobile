import { useCallback, useEffect } from 'react';
import { Asset } from 'expo-asset';
let audio: HTMLAudioElement | null = null;
let consumers = 0;
export function useBell() {
  useEffect(() => {
    consumers++;
    return () => {
      if (--consumers === 0) {
        audio?.pause();
        audio = null;
      }
    };
  }, []);
  return useCallback(async () => {
    audio ??= new Audio(
      Asset.fromModule(require('../assets/notification-bell.wav')).uri,
    );
    audio.currentTime = 0;
    await audio.play();
  }, []);
}
