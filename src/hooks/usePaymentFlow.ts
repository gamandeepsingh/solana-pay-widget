import { useState, useCallback } from 'react';
import { PaymentStatus } from '../types';

export const usePaymentFlow = (onSuccess?: (txId: string) => void, onError?: (error: Error) => void) => {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({
    status: 'pending'
  });

  const updateStatus = useCallback((status: PaymentStatus) => {
    setPaymentStatus(status);
    
    if (status.status === 'completed' && status.txId) {
      onSuccess?.(status.txId);
    } else if (status.status === 'failed' && status.error) {
      onError?.(new Error(status.error));
    }
  }, [onSuccess, onError]);

  const resetStatus = useCallback(() => {
    setPaymentStatus({ status: 'pending' });
  }, []);

  return {
    paymentStatus,
    updateStatus,
    resetStatus,
  };
};