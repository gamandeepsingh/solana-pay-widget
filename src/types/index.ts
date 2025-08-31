export interface CheckoutWidgetProps {
  /** Unique checkout identifier */
  checkoutId: string;
  /** Merchant's Solana wallet address */
  merchantWallet: string;
  /** Payment amount */
  amount: number;
  /** Payment currency */
  currency: 'SOL' | 'USDC' | 'USDT';
  /** Product/service name */
  productName: string;
  /** Product description */
  description?: string;
  /** Widget theme */
  theme?: 'light' | 'dark' | 'auto';
  /** Enable NFT receipt minting */
  enableNftReceipt?: boolean;
  /** Payment webhook URL */
  webhookUrl?: string;
  /** Enabled fallback payment methods */
  fallbackPayments?: ('stripe' | 'razorpay')[];
  /** Success callback */
  onSuccess?: (txId: string) => void;
  /** Error callback */
  onError?: (error: Error) => void;
  /** Custom styles */
  className?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  type: 'solana' | 'qr' | 'fallback';
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
