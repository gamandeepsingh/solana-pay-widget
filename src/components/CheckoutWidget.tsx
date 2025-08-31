import React, { useState, useMemo } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';

import { CheckoutWidgetProps, PaymentMethod } from '../types';
import { useSolanaWallet } from '../hooks/useSolanaWallet';
import { usePaymentFlow } from '../hooks/usePaymentFlow';
import { PaymentMethods } from './PaymentMethods';
import { QRCodePayment } from './QRCodePayment';
import { createSolanaPayTransaction, generateReference } from '../utils/solanaUtils';

import '../styles/checkout-widget.css';

export const CheckoutWidget: React.FC<CheckoutWidgetProps> = ({
  checkoutId,
  merchantWallet,
  amount,
  currency,
  productName,
  description,
  theme = 'light',
  enableNftReceipt = false,
  webhookUrl,
  fallbackPayments = [],
  onSuccess,
  onError,
  className = '',
}) => {
  const { connection } = useConnection();
  const { publicKey, connected, isProcessing, sendPayment } = useSolanaWallet();
  const { paymentStatus, updateStatus } = usePaymentFlow(onSuccess, onError);
  
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const paymentMethods: PaymentMethod[] = useMemo(() => {
    const methods: PaymentMethod[] = [
      {
        id: 'wallet',
        name: 'Solana Wallet',
        icon: '🦊',
        type: 'solana',
      },
      {
        id: 'qr',
        name: 'QR Code',
        icon: '📱',
        type: 'qr',
      },
    ];

    if (fallbackPayments.includes('stripe')) {
      methods.push({
        id: 'stripe',
        name: 'Card Payment',
        icon: '💳',
        type: 'fallback',
      });
    }

    if (fallbackPayments.includes('razorpay')) {
      methods.push({
        id: 'razorpay',
        name: 'UPI / Card',
        icon: '📱',
        type: 'fallback',
      });
    }

    return methods;
  }, [fallbackPayments]);

  const handleWalletPayment = async () => {
    if (!connected || !publicKey) {
      onError?.(new Error('Wallet not connected'));
      return;
    }

    try {
      updateStatus({ status: 'processing' });

      const recipient = new PublicKey(merchantWallet);
      const reference = generateReference();

      const transaction = await createSolanaPayTransaction(
        connection,
        recipient,
        publicKey,
        amount,
        currency,
        reference
      );

      const txId = await sendPayment(connection, transaction);
      
      updateStatus({ status: 'completed', txId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      updateStatus({ status: 'failed', error: errorMessage });
    }
  };

  const handleFallbackPayment = async (method: string) => {
    try {
      updateStatus({ status: 'processing' });

      // This would integrate with Stripe/Razorpay
      // For demo purposes, we'll simulate success
      setTimeout(() => {
        updateStatus({ status: 'completed', txId: `fallback_${method}_${Date.now()}` });
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      updateStatus({ status: 'failed', error: errorMessage });
    }
  };

  const renderPaymentContent = () => {
    if (!selectedMethod) {
      return (
        <PaymentMethods
          methods={paymentMethods}
          selectedMethod={selectedMethod}
          onMethodSelect={setSelectedMethod}
        />
      );
    }

    switch (selectedMethod) {
      case 'wallet':
        return (
          <div className="sp-wallet-payment">
            <h3>Pay with Solana Wallet</h3>
            {!connected ? (
              <div className="sp-wallet-connect">
                <p>Connect your Solana wallet to continue</p>
                <WalletMultiButton />
              </div>
            ) : (
              <div className="sp-wallet-connected">
                <p>Wallet connected: {publicKey?.toString().slice(0, 8)}...</p>
                <button
                  className="sp-pay-button"
                  onClick={handleWalletPayment}
                  disabled={isProcessing || paymentStatus.status === 'processing'}
                >
                  {isProcessing || paymentStatus.status === 'processing' 
                    ? 'Processing...' 
                    : `Pay ${amount} ${currency}`
                  }
                </button>
              </div>
            )}
          </div>
        );

      case 'qr':
        return (
          <QRCodePayment
            recipient={merchantWallet}
            amount={amount}
            currency={currency}
            productName={productName}
            onSuccess={(txId) => updateStatus({ status: 'completed', txId })}
            onError={(error) => updateStatus({ status: 'failed', error: error.message })}
          />
        );

      case 'stripe':
      case 'razorpay':
        return (
          <div className="sp-fallback-payment">
            <h3>Pay with {selectedMethod === 'stripe' ? 'Card' : 'UPI/Card'}</h3>
            <button
              className="sp-pay-button"
              onClick={() => handleFallbackPayment(selectedMethod)}
              disabled={paymentStatus.status === 'processing'}
            >
              {paymentStatus.status === 'processing' 
                ? 'Processing...' 
                : `Pay ${amount} ${currency}`
              }
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  const renderPaymentStatus = () => {
    if (paymentStatus.status === 'completed') {
      return (
        <div className="sp-success">
          <h3>✅ Payment Successful!</h3>
          <p>Transaction ID: {paymentStatus.txId}</p>
          {enableNftReceipt && (
            <p>🎫 Your NFT receipt will be delivered shortly</p>
          )}
        </div>
      );
    }

    if (paymentStatus.status === 'failed') {
      return (
        <div className="sp-error">
          <h3>❌ Payment Failed</h3>
          <p>{paymentStatus.error}</p>
          <button
            className="sp-retry-button"
            onClick={() => {
              updateStatus({ status: 'pending' });
              setSelectedMethod(null);
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`sp-checkout-widget sp-theme-${theme} ${className}`}>
      <div className="sp-checkout-header">
        <h2 className="sp-product-name">{productName}</h2>
        {description && <p className="sp-product-description">{description}</p>}
        <div className="sp-amount">
          <span className="sp-amount-value">{amount}</span>
          <span className="sp-amount-currency">{currency}</span>
        </div>
      </div>

      <div className="sp-checkout-content">
        {paymentStatus.status === 'pending' || paymentStatus.status === 'processing' 
          ? renderPaymentContent() 
          : renderPaymentStatus()
        }
      </div>

      {selectedMethod && paymentStatus.status === 'pending' && (
        <button
          className="sp-back-button"
          onClick={() => setSelectedMethod(null)}
        >
          ← Back to Payment Methods
        </button>
      )}
    </div>
  );
};