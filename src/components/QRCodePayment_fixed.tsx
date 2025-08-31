import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import QRCode from 'qrcode';
import { createSolanaPayUrl, generateReference, pollForTransaction } from '../utils/solanaUtils';
import { PublicKey } from '@solana/web3.js';

interface QRCodePaymentProps {
  recipient: string;
  amount: number;
  currency: string;
  productName: string;
  onSuccess: (txId: string) => void;
  onError: (error: Error) => void;
}

export const QRCodePayment: React.FC<QRCodePaymentProps> = ({
  recipient,
  amount,
  currency,
  productName,
  onSuccess,
  onError,
}) => {
  const { connection } = useConnection();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [pollStatus, setPollStatus] = useState<string>('');
  const pollingRef = useRef<boolean>(false);
  const componentMountedRef = useRef<boolean>(true);

  // Memoize callbacks to prevent unnecessary re-renders
  const handleSuccess = useCallback((txId: string) => {
    if (!componentMountedRef.current) return;
    
    setPollStatus('Payment confirmed!');
    setIsPolling(false);
    pollingRef.current = false;
    onSuccess(txId);
  }, [onSuccess]);

  const handleError = useCallback((error: Error) => {
    if (!componentMountedRef.current) return;
    
    console.error('Payment polling failed:', error);
    setPollStatus('Payment verification failed');
    setIsPolling(false);
    pollingRef.current = false;
    onError(error);
  }, [onError]);

  const stopPolling = useCallback(() => {
    pollingRef.current = false;
    if (componentMountedRef.current) {
      setIsPolling(false);
    }
  }, []);

  // Single useEffect with proper cleanup and stable dependencies
  useEffect(() => {
    let isMounted = true;
    componentMountedRef.current = true;
    
    // Stop any existing polling first
    stopPolling();

    const generateQRCode = async () => {
      if (!isMounted) return;
      
      try {
        const ref = generateReference();
        const payUrl = createSolanaPayUrl(
          recipient,
          amount,
          currency,
          ref.toString(),
          productName,
          `Payment for ${productName}`
        );
        
        if (!isMounted) return;
        
        setReference(ref.toString());
        setQrCodeUrl(payUrl);
        
        // Generate QR code as data URL
        const qrDataUrl = await QRCode.toDataURL(payUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        });
        
        if (!isMounted) return;
        setQrCodeDataUrl(qrDataUrl);
        
        // Start polling for transaction only if component is still mounted and not already polling
        const startPolling = async () => {
          if (!isMounted || pollingRef.current) {
            return;
          }
          
          pollingRef.current = true;
          
          if (isMounted) {
            setIsPolling(true);
            setPollStatus('Waiting for payment...');
          }
          
          try {
            const referenceKey = new PublicKey(ref.toString());
            const recipientKey = new PublicKey(recipient);
            
            await pollForTransaction(
              connection,
              referenceKey,
              recipientKey,
              amount,
              currency,
              (signature: string) => {
                if (isMounted) {
                  handleSuccess(signature);
                }
              },
              (error: Error) => {
                if (isMounted) {
                  handleError(error);
                }
              }
            );
          } catch (error) {
            console.error('Failed to start polling:', error);
            if (isMounted) {
              setPollStatus('Failed to start payment verification');
              handleError(error as Error);
            }
          }
        };
        
        // Small delay to ensure any previous polling has stopped
        setTimeout(() => {
          if (isMounted) {
            startPolling();
          }
        }, 200);
        
      } catch (error) {
        console.error('QR Code generation failed:', error);
        if (isMounted) {
          handleError(error as Error);
        }
      }
    };

    generateQRCode();
    
    // Cleanup function
    return () => {
      isMounted = false;
      componentMountedRef.current = false;
      stopPolling();
    };
  }, [recipient, amount, currency, productName, connection, handleSuccess, handleError, stopPolling]);

  return (
    <div className="sp-qr-payment">
      <h3>Scan QR Code to Pay</h3>
      <p className="sp-qr-payment-subtitle">
        Use your mobile Solana wallet to scan and complete the payment
      </p>
      <div className="sp-qr-code">
        {qrCodeDataUrl ? (
          <img 
            src={qrCodeDataUrl} 
            alt="Solana Pay QR Code" 
            className="sp-qr-image"
          />
        ) : (
          <div className="sp-qr-loading">
            <div className="sp-loading-spinner"></div>
            <p>Generating secure QR code...</p>
          </div>
        )}
      </div>
      <div className="sp-qr-info">
        <p className="sp-qr-instructions">
          Scan this QR code with your Solana mobile wallet to complete payment
        </p>
        <div className="sp-payment-summary">
          <p><strong>Amount:</strong> {amount} {currency}</p>
          <p><strong>Network:</strong> Devnet</p>
        </div>
        {isPolling && (
          <div className="sp-polling-status">
            <div className="sp-polling-indicator">
              <span className="sp-spinner"></span>
              <span>{pollStatus}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
