export interface CheckoutWidgetProps {
  checkoutId: string;
  merchantWallet: string;
  amount: number;
  currency: 'SOL' | 'USDC' | 'USDT';
  productName: string;
  description?: string;
  theme?: 'light' | 'dark' | 'auto';
  enableNftReceipt?: boolean;
  webhookUrl?: string;
  onSuccess?: (txId: string) => void;
  onError?: (error: Error) => void;
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  type: 'solana' | 'qr';
}

export interface PaymentStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  txId?: string;
  error?: string;
}

export interface SolanaPayRequest {
  recipient: string;
  amount: number;
  currency: string;
  reference: string;
  label: string;
  message?: string;
}
