export { CheckoutWidget } from './components/CheckoutWidget';
export { WalletConnectionProvider } from './components/WalletConnectionProvider';
export { PaymentMethods } from './components/PaymentMethods';
export { QRCodePayment } from './components/QRCodePayment';

export { useSolanaWallet } from '../src/hooks/useSolanaWallet';
export { usePaymentFlow } from '../src/hooks/usePaymentFlow';

export { 
  createSolanaPayTransaction, 
  generateReference, 
  createSolanaPayUrl 
} from './utils/solanaUtils';

export type { 
  CheckoutWidgetProps, 
  PaymentMethod, 
  PaymentStatus, 
  SolanaPayRequest 
} from './types';