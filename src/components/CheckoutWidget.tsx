import React, { useState, useMemo, useEffect } from 'react';
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
  onSuccess,
  onError,
  className = '',
  isOpen = true,
  onClose,
}) => {
  const { connection } = useConnection();
  const { publicKey, connected, isProcessing, sendPayment } = useSolanaWallet();
  const { paymentStatus, updateStatus } = usePaymentFlow(onSuccess, onError);
  
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Handle escape key and backdrop clicks
  useEffect(() => {
    if (!isOpen || !onClose) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  // Custom WalletMultiButton that closes the modal when clicked
  const CustomWalletMultiButton = () => {
    const handleClick = (e: React.MouseEvent) => {
      // Close the modal when the wallet button is clicked
      if (onClose) {
        onClose();
      }
      
      // You could also add a small delay to ensure the modal closes before
      // the wallet provider modal opens
      setTimeout(() => {
        // The original WalletMultiButton behavior will continue
        // as the click event propagates to the actual button
      }, 100);
    };

    return (
      <div onClick={handleClick}>
        <WalletMultiButton />
      </div>
    );
  };

  // Validate merchant wallet address
  const merchantPublicKey = useMemo(() => {
    try {
      return new PublicKey(merchantWallet);
    } catch (error) {
      setValidationError('Invalid merchant wallet address');
      return null;
    }
  }, [merchantWallet]);

  // Validate amount
  const isValidAmount = useMemo(() => {
    return amount > 0 && Number.isFinite(amount);
  }, [amount]);

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

    return methods;
  }, []);

  const handleWalletPayment = async () => {
    if (!connected || !publicKey) {
      const error = new Error('Please connect your wallet first');
      onError?.(error);
      updateStatus({ status: 'failed', error: error.message });
      return;
    }

    if (!merchantPublicKey) {
      const error = new Error('Invalid merchant wallet address');
      onError?.(error);
      updateStatus({ status: 'failed', error: error.message });
      return;
    }

    if (!isValidAmount) {
      const error = new Error('Invalid payment amount');
      onError?.(error);
      updateStatus({ status: 'failed', error: error.message });
      return;
    }

    try {
      updateStatus({ status: 'processing' });
      setValidationError(null);

      // Check connection
      const slot = await connection.getSlot();
      if (!slot) {
        throw new Error('Unable to connect to Solana network');
      }

      const reference = generateReference();

      const transaction = await createSolanaPayTransaction(
        connection,
        merchantPublicKey,
        publicKey,
        amount,
        currency,
        reference
      );

      const txId = await sendPayment(connection, transaction);
      
      updateStatus({ status: 'completed', txId });
      
    } catch (error) {
      console.error('Payment error:', error);
      
      let errorMessage = 'Payment failed';
      
      if (error instanceof Error) {
        // Handle specific error types
        if (error.message.includes('Insufficient')) {
          errorMessage = error.message;
        } else if (error.message.includes('User rejected')) {
          errorMessage = 'Transaction was cancelled';
        } else if (error.message.includes('Blockhash not found')) {
          errorMessage = 'Network error. Please try again.';
        } else if (error.message.includes('could not find account')) {
          errorMessage = `Token account not found. Please ensure you have ${currency} tokens.`;
        } else {
          errorMessage = error.message;
        }
      }
      
      updateStatus({ status: 'failed', error: errorMessage });
      onError?.(new Error(errorMessage));
    }
  };

  const renderValidationError = () => {
    if (validationError) {
      return (
        <div className="sp-validation-error">
          <h3>❌ Configuration Error</h3>
          <p>{validationError}</p>
        </div>
      );
    }
    return null;
  };

  const renderNetworkInfo = () => {
    const endpoint = connection.rpcEndpoint;
    const isDevnetConn = endpoint.includes('devnet');
    
    return (
      <div className="sp-network-info">
        <small>
          Network: {isDevnetConn ? 'Devnet' : 'Mainnet'} 
          {isDevnetConn && ' (Test Network)'}
        </small>
      </div>
    );
  };
  const renderPaymentContent = () => {
    // Show validation error first
    const validation = renderValidationError();
    if (validation) return validation;

    if (!selectedMethod) {
      return (
        <>
          {renderNetworkInfo()}
          <PaymentMethods
            methods={paymentMethods}
            selectedMethod={selectedMethod}
            onMethodSelect={setSelectedMethod}
          />
        </>
      );
    }

    switch (selectedMethod) {
      case 'wallet':
        return (
          <div className="sp-wallet-payment">
            <h3>Pay with Solana Wallet</h3>
            {renderNetworkInfo()}
            {!connected ? (
              <div className="sp-wallet-connect">
                <p>Connect your Solana wallet to continue</p>
                <CustomWalletMultiButton />
              </div>
            ) : (
              <div className="sp-wallet-connected">
                <p>Wallet connected: {publicKey?.toString().slice(0, 8)}...</p>
                <div className="sp-payment-details">
                  <p>Amount: {amount} {currency}</p>
                  <p>To: {merchantWallet.slice(0, 8)}...</p>
                </div>
                <button
                  className="sp-pay-button"
                  onClick={handleWalletPayment}
                  disabled={isProcessing || paymentStatus.status === 'processing' || !isValidAmount}
                >
                  {isProcessing || paymentStatus.status === 'processing' 
                    ? 'Processing...' 
                    : `Pay ${amount} ${currency}`
                  }
                </button>
                {!isValidAmount && (
                  <p className="sp-error-text">Invalid amount: {amount}</p>
                )}
              </div>
            )}
          </div>
        );

      case 'qr':
        return (
          <>
            {renderNetworkInfo()}
            <QRCodePayment
              recipient={merchantWallet}
              amount={amount}
              currency={currency}
              productName={productName}
              onSuccess={(txId) => updateStatus({ status: 'completed', txId })}
              onError={(error) => updateStatus({ status: 'failed', error: error.message })}
            />
          </>
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
          <button
            className="sp-new-payment-button"
            onClick={() => {
              updateStatus({ status: 'pending' });
              setSelectedMethod(null);
            }}
          >
            Make Another Payment
          </button>
        </div>
      );
    }

    if (paymentStatus.status === 'failed') {
      return (
        <div className="sp-error">
          <h3>❌ Payment Failed</h3>
          <p>{paymentStatus.error}</p>
          <div className="sp-error-actions">
            <button
              className="sp-retry-button"
              onClick={() => {
                updateStatus({ status: 'pending' });
                setValidationError(null);
              }}
            >
              Try Again
            </button>
            <button
              className="sp-back-button"
              onClick={() => {
                updateStatus({ status: 'pending' });
                setSelectedMethod(null);
                setValidationError(null);
              }}
            >
              Choose Different Method
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {isOpen && (
        <div 
          className={`sp-modal-overlay sp-theme-${theme}`}
          onClick={handleBackdropClick}
        >
          <div className={`sp-modal-container ${className}`}>
            <div className="sp-modal-header">
              <div className="sp-modal-header-content">
                <h2 className="sp-product-name">{productName}</h2>
                {description && <p className="sp-product-description">{description}</p>}
                <div className="sp-amount-display">
                  <span className="sp-amount-value">{amount}</span>
                  <span className="sp-amount-currency">{currency}</span>
                </div>
              </div>
              {onClose && (
                <button 
                  className="sp-modal-close" 
                  onClick={onClose}
                  aria-label="Close payment modal"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>

            <div className="sp-modal-content">
              {paymentStatus.status === 'pending' || paymentStatus.status === 'processing' 
                ? renderPaymentContent() 
                : renderPaymentStatus()
              }
            </div>

            {selectedMethod && paymentStatus.status === 'pending' && !validationError && (
              <div className="sp-modal-footer">
                <button
                  className="sp-back-button"
                  onClick={() => setSelectedMethod(null)}
                >
                  ← Back to Payment Methods
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};