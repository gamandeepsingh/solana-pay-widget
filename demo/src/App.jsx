import React, { useState } from 'react';
import { CheckoutWidget, WalletConnectionProvider } from 'solana-pay-widget';
import { toast, ToastContainer } from 'react-toastify';
import 'solana-pay-widget/dist/index.css';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastTxId, setLastTxId] = useState(null);

  const handleSuccess = (txId) => {
    console.log('Payment successful!', txId);
    setIsModalOpen(false);
    setLastTxId(txId);

    toast.success(
      <div className="flex items-center gap-2">
        <span>Payment successful! TX: {txId.slice(0, 8)}...</span>
      </div>,
      {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      }
    );
  };

  const handleError = (error) => {
    console.error('Payment failed:', error);
    setIsModalOpen(false);

    toast.error(
      <div className="flex items-center gap-2">
        <span>Payment failed: {error.message}</span>
      </div>,
      {
        position: "top-right",
        autoClose: 6000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      }
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-zinc-950 mb-2 tracking-tight">
            Solana Pay Widget Demo
          </h1>
          <p className="text-base text-zinc-500">
            Experience fast, secure Solana payments
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm mb-6 transition-all duration-200">
          {/* Product Header */}
          <div className="flex items-center mb-6 pb-4 border-b border-zinc-100">
            <div className="w-12 h-12 bg-zinc-950 rounded-lg flex items-center justify-center mr-3 text-xl">
              <img src="/solana.svg" alt="Solana Logo" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-zinc-950 mb-1">
                Premium Subscription
              </h3>
              <p className="text-zinc-500 text-sm">
                Monthly subscription with all features
              </p>
            </div>
          </div>
          <p className='text-zinc-500 text-sm text-right mb-1 cursor-pointer'
            onClick={() => {
              navigator.clipboard.writeText("4rbzcZsLxEefKdyho3U2dc5tfKUMdSM4vyRQhAkL4EHX");
              toast.success("Copied to clipboard");
            }}
          >
            Paying to: 4rb...EHX
          </p>

          {/* Pricing Details */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-700 text-sm font-medium">
                Subscription
              </span>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-xs font-semibold text-white">
                  $
                </div>
                <span className="text-lg font-semibold text-zinc-950">
                  0.01 SOL
                </span>
              </div>
            </div>

            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Network Fee</span>
              <span>~$0.000008</span>
            </div>

            <div className="h-px bg-gray-300 my-3" />

            <div className="flex justify-between text-base font-semibold text-zinc-950">
              <span>Total</span>
              <span>0.01 SOL</span>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-zinc-950 text-zinc-50 border-0 py-3 px-6 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 h-11 hover:bg-zinc-800"
          >
            Continue to Payment
          </button>

          {/* Transaction Link */}
          {lastTxId && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    ✓
                  </div>
                  <span className="text-sm font-medium text-green-800">
                    Payment Successful
                  </span>
                </div>
                <a
                  href={`https://explorer.solana.com/tx/${lastTxId}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-green-700 hover:text-green-900 font-medium transition-colors duration-200"
                >
                  View on Explorer
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
              <div className="mt-2 text-xs text-green-600 font-mono break-all">
                TX: {lastTxId}
              </div>
            </div>
          )}
        </div>
      </div>

      <WalletConnectionProvider rpcEndpoint='https://api.devnet.solana.com'>
        <CheckoutWidget
          checkoutId="demo_checkout_123"
          merchantWallet="4rbzcZsLxEefKdyho3U2dc5tfKUMdSM4vyRQhAkL4EHX"
          amount={0.01}
          currency="SOL"
          productName="Premium Subscription"
          description="Monthly premium subscription with all features"
          theme="dark"
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </WalletConnectionProvider>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}

export default App;