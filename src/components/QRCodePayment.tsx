import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { createSolanaPayUrl, generateReference } from '../utils/solanaUtils';

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
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [reference, setReference] = useState<string>('');

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
        const pollForTransaction = async () => {
          // make a api call to check whether the txn is completed or not with time interval of 5 seconds
          console.log('Waiting for transaction with reference:', ref.toString());
        };
        
        pollForTransaction();
      } catch (error) {
        console.error('QR Code generation failed:', error);
        onError(error as Error);
      }
    };

    generateQRCode();
  }, [recipient, amount, currency, productName, onError]);

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