import React, { useEffect, useState, useRef } from 'react';
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

  useEffect(() => {
    const generateQRCode = async () => {
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
        
        console.log('QR Code Payment Details:', {
          recipient,
          amount,
          currency,
          reference: ref.toString(),
          productName,
          generatedUrl: payUrl
        });
        
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
        setQrCodeDataUrl(qrDataUrl);
        
        // Start polling for transaction
        const pollForTransactionHandler = async () => {
          if (pollingRef.current) return; // Prevent multiple polling instances
          
          pollingRef.current = true;
          setIsPolling(true);
          setPollStatus('Waiting for payment...');
          
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
                console.log('Payment completed! Transaction ID:', signature);
                setPollStatus('Payment confirmed!');
                setIsPolling(false);
                pollingRef.current = false;
                onSuccess(signature);
              },
              (error: Error) => {
                console.error('Payment polling failed:', error);
                setPollStatus('Payment verification failed');
                setIsPolling(false);
                pollingRef.current = false;
                onError(error);
              }
            );
          } catch (error) {
            console.error('Failed to start polling:', error);
            setPollStatus('Failed to start payment verification');
            setIsPolling(false);
            pollingRef.current = false;
            onError(error as Error);
          }
        };
        
        pollForTransactionHandler();
      } catch (error) {
        console.error('QR Code generation failed:', error);
        onError(error as Error);
      }
    };

    generateQRCode();
    
    // Cleanup function to stop polling when component unmounts
    return () => {
      pollingRef.current = false;
      setIsPolling(false);
    };
  }, [recipient, amount, currency, productName, onError, connection]);

  return (
    <div className="sp-qr-payment">
      <h3>Scan QR Code to Pay</h3>
      <div className="sp-qr-code">
        {qrCodeDataUrl ? (
          <img 
            src={qrCodeDataUrl} 
            alt="Solana Pay QR Code" 
            className="sp-qr-image"
          />
        ) : (
          <div className="sp-qr-loading">
            Generating QR code...
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
            <p className="sp-polling-help">
              Complete the payment in your wallet app. We'll automatically detect when it's done.
            </p>
          </div>
        )}
      </div>
      {qrCodeUrl && (
        <details className="sp-qr-debug">
          <summary>Debug: Show Payment URL</summary>
          <div className="sp-qr-url">
            <small>{qrCodeUrl}</small>
          </div>
          <div className="sp-troubleshoot">
            <h4>Troubleshooting Tips:</h4>
            <ul>
              <li>Make sure your wallet is connected to Devnet</li>
              <li>Ensure you have sufficient SOL for transaction fees</li>
              <li>Try refreshing the QR code if it doesn't work</li>
              <li>Some wallets may not support all Solana Pay features</li>
            </ul>
          </div>
        </details>
      )}
    </div>
  );
};