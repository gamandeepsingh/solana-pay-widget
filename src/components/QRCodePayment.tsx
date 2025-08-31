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
          productName
        );
        
        setReference(ref.toString());
        setQrCodeUrl(payUrl);
        
        // Generate QR code as data URL
        const qrDataUrl = await QRCode.toDataURL(payUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeDataUrl(qrDataUrl);
        
        // Start polling for transaction
        const pollForTransaction = async () => {
          // This would typically call your backend API to check for the transaction
          // For now, we'll just show the QR code
        };
        
        pollForTransaction();
      } catch (error) {
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
      <p className="sp-qr-instructions">
        Scan this QR code with your Solana mobile wallet to complete payment
      </p>
    </div>
  );
};