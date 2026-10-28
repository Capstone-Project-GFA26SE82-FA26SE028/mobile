import { useRef, useState } from 'react';
import { useAppSelector } from '../../../app/hooks';
import { authError, authService } from '../api/authApi';

export function useAuth() {
  const auth = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  async function run(action: () => Promise<unknown>) {
    if (lock.current) return;
    lock.current = true;
    setLoading(true);
    setError('');
    try {
      await action();
    } catch (cause) {
      setError(authError(cause));
    } finally {
      lock.current = false;
      setLoading(false);
    }
  }
  return {
    ...auth,
    loading,
    error,
    login: (email: string, password: string) =>
      run(() => authService.login(email, password)),
    logout: () => run(() => authService.logout()),
  };
}
