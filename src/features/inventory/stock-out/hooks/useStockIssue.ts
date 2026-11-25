import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import { useRef, useState } from 'react';
import { authService } from '../../../auth/api/authApi';
import { createStockIssue, type StockIssueRequest } from '../api/stockIssueApi';

export function useStockIssue() {
  const client = useQueryClient();
  const [uncertain, setUncertain] = useState(false);
  const attempt = useRef<{
    body: StockIssueRequest;
    staffSession: string;
  } | null>(null);
  const issue = useMutation({
    mutationFn: async (values: Omit<StockIssueRequest, 'stockIssueId'>) => {
      const staffSession = authService.identity();
      if (!staffSession) throw new Error('Vui lòng đăng nhập lại.');
      if (attempt.current && attempt.current.staffSession !== staffSession) {
        attempt.current = null;
        throw new Error('Tài khoản đã thay đổi. Vui lòng kiểm tra lại phiếu.');
      }
      attempt.current ??= {
        body: { ...values, stockIssueId: randomUUID() },
        staffSession,
      };
      return createStockIssue(attempt.current.body, staffSession);
    },
    onSuccess: () => {
      attempt.current = null;
      setUncertain(false);
      void client.invalidateQueries({ queryKey: ['inventory-stock'] });
    },
    onError: (error) => {
      const status = axios.isAxiosError(error)
        ? error.response?.status
        : undefined;
      if (status && status >= 400 && status < 500 && status !== 408)
        attempt.current = null;
      setUncertain(!!attempt.current);
    },
    retry: false,
  });
  return { issue, uncertain };
}
