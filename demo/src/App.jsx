import React from 'react';
import { CheckoutWidget, WalletConnectionProvider } from 'solana-pay-widget';
import 'solana-pay-widget/dist/index.css';

function App() {
  const handleSuccess = (txId) => {
    console.log('Payment successful!', txId);
    alert(`Payment successful! Transaction ID: ${txId}`);
  };

  const handleError = (error) => {
    console.error('Payment failed:', error);
    alert(`Payment failed: ${error.message}`);
  };

  return (
    <div className="app">
      <h1>Solana Pay Checkout Example</h1>

      <WalletConnectionProvider rpcEndpoint='https://api.devnet.solana.com'>
        <CheckoutWidget
          checkoutId="demo_checkout_123"
          merchantWallet="9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
          amount={0.001}
          currency="SOL"
          productName="Premium Subscription"
          description="Monthly premium subscription with all features"
          theme="light"
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </WalletConnectionProvider>
    </div>
  );
}

export default App;