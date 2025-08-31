# 🚀 Solana Pay Checkout Widget

A seamless Web3 payment solution that bridges traditional payments with Solana blockchain, specifically designed for small businesses.

## ✨ Features

- ⚡ **Quick Setup** - Get started in under 5 minutes
- 🎯 **Zero Buffer Issues** - Pre-configured to work with Vite, Next.js, and other modern bundlers
- 💰 **Multi-Payment Support** - Solana Pay + traditional fallback methods
- 📱 **Mobile-First** - QR code payments for mobile wallets
- 🔗 **Multiple Wallets** - Phantom, Backpack, Solflare support
- 💳 **Web2 Fallback** - Card/UPI payments via Stripe/Razorpay
- 🎫 **NFT Receipts** - Optional proof-of-purchase NFTs
- 🎨 **Customizable** - Light/dark themes and custom styling

## 📦 Installation

```bash
npm install @solana-pay/checkout-widget
```

### For Vite Projects

Install additional polyfills:

```bash
npm install --save-dev @esbuild-plugins/node-globals-polyfill @esbuild-plugins/node-modules-polyfill rollup-plugin-polyfill-node buffer crypto-browserify stream-browserify util
```

Add to your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
        }),
        NodeModulesPolyfillPlugin(),
      ],
    },
  },
});
```

### For Next.js Projects

Install additional polyfills:

```bash
npm install buffer crypto-browserify stream-browserify util
```

Add to your `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      buffer: require.resolve('buffer'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      util: require.resolve('util'),
    };
    
    config.plugins.push(
      new config.webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser',
      })
    );
    
    return config;
  },
};

module.exports = nextConfig;
```

## 🚀 Quick Start

### 1. Basic Usage

```tsx
import { CheckoutWidget, WalletConnectionProvider } from '@solana-pay/checkout-widget';
import '@solana-pay/checkout-widget/dist/index.css';

function App() {
  return (
    <WalletConnectionProvider>
      <CheckoutWidget
        checkoutId="checkout_123"
        merchantWallet="9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
        amount={10.99}
        currency="USDC"
        productName="Premium Subscription"
        onSuccess={(txId) => console.log('Payment successful:', txId)}
        onError={(error) => console.error('Payment failed:', error)}
      />
    </WalletConnectionProvider>
  );
}
```

### 2. Advanced Configuration

```tsx
<WalletConnectionProvider rpcEndpoint="https://api.mainnet-beta.solana.com">
  <CheckoutWidget
    checkoutId="checkout_123"
    merchantWallet="9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
    amount={25.00}
    currency="SOL"
    productName="Digital Art NFT"
    description="Exclusive limited edition artwork"
    theme="dark"
    enableNftReceipt={true}
    fallbackPayments={['stripe', 'razorpay']}
    onSuccess={(txId) => {
      console.log('Payment successful:', txId);
      // Handle success (e.g., redirect, show confirmation)
    }}
    onError={(error) => {
      console.error('Payment failed:', error);
      // Handle error (e.g., show error message)
    }}
  />
</WalletConnectionProvider>
```

### 3. Custom Styling

```tsx
<CheckoutWidget
  className="my-custom-checkout"
  // ... other props
/>
```

```css
.my-custom-checkout {
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.my-custom-checkout .sp-checkout-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

## 📋 API Reference

### CheckoutWidget Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `checkoutId` | `string` | ✅ | Unique checkout identifier |
| `merchantWallet` | `string` | ✅ | Merchant's Solana wallet address |
| `amount` | `number` | ✅ | Payment amount |
| `currency` | `'SOL' \| 'USDC' \| 'USDT'` | ✅ | Payment currency |
| `productName` | `string` | ✅ | Product/service name |
| `description` | `string` | ❌ | Product description |
| `theme` | `'light' \| 'dark' \| 'auto'` | ❌ | Widget theme |
| `enableNftReceipt` | `boolean` | ❌ | Enable NFT receipt minting |
| `webhookUrl` | `string` | ❌ | Payment webhook URL |
| `fallbackPayments` | `('stripe' \| 'razorpay')[]` | ❌ | Enabled fallback methods |
| `onSuccess` | `(txId: string) => void` | ❌ | Success callback |
| `onError` | `(error: Error) => void` | ❌ | Error callback |
| `className` | `string` | ❌ | Custom CSS class |

### WalletConnectionProvider Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `rpcEndpoint` | `string` | ❌ | Solana RPC endpoint (defaults to mainnet) |
| `children` | `ReactNode` | ✅ | Child components |

## 🎯 Payment Flow

1. **Customer visits checkout** - Widget displays product details and payment options
2. **Payment method selection**:
   - 🦊 **Solana Wallet** - Direct wallet connection (Phantom, Backpack, Solflare)
   - 📱 **QR Code** - Mobile Solana Pay for phone wallets
   - 💳 **Fallback** - Traditional card/UPI payments
3. **Transaction processing** - Secure blockchain or traditional payment processing
4. **Confirmation** - Success message with transaction ID and optional NFT receipt

## 🔧 Common Issues & Solutions

### Buffer/Polyfill Errors

This package is pre-configured to avoid common buffer/polyfill issues. However, if you encounter them:

1. **For Vite**: Follow the Vite configuration above
2. **For Next.js**: Follow the Next.js configuration above
3. **For other bundlers**: You may need to configure similar polyfills

### Wallet Connection Issues

Make sure you're wrapping your app with `WalletConnectionProvider`:

```tsx
import { WalletConnectionProvider } from '@solana-pay/checkout-widget';

function App() {
  return (
    <WalletConnectionProvider>
      {/* Your app components */}
    </WalletConnectionProvider>
  );
}
```

### CSS Not Loading

Import the CSS file in your main component:

```tsx
import '@solana-pay/checkout-widget/dist/index.css';
```

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/yourusername/solana-pay-checkout-widget.git

# Install dependencies
npm install

# Build the package
npm run build

# Run tests
npm test
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests.

## 📞 Support

- 📖 [Documentation](https://docs.solana-pay-widget.com)
- 💬 [Discord Community](https://discord.gg/solana-pay-widget)
- 🐛 [Report Issues](https://github.com/yourusername/solana-pay-checkout-widget/issues)

---

<div align="center">

**Built with ❤️ for the Solana ecosystem**

[Website](https://solana-pay-widget.com) • [Twitter](https://twitter.com/solanapaywidget) • [Discord](https://discord.gg/solana-pay-widget)

</div>