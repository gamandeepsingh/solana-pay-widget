# 🚀 Solana Pay Checkout Widget

A seamless Web3 payment solution that bridges traditional payments with Solana blockchain, specifically designed for businesses.

## ✨ Features

- ⚡ **Quick Setup** - Get started in under 5 minutes
- 🎯 **Zero Buffer Issues** - Pre-configured to work with Vite, Next.js, and other modern bundlers
- 💰 **Multi-Payment Support** - Solana Pay
- 📱 **Mobile-First** - QR code payments for mobile wallets
- 🔗 **Multiple Wallets** - Phantom, Backpack, Solflare support
- 🎨 **Customizable** - Light/dark themes and custom styling

## 📦 Installation

```bash
npm install solana-pay-widget
```

### For Vite Projects

Install additional polyfills:
```bash
npm install --save-dev @esbuild-plugins/node-globals-polyfill @esbuild-plugins/node-modules-polyfill rollup-plugin-polyfill-node buffer crypto-browserify stream-browserify util
```

Add to your `vite.config.ts`:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import nodePolyfills from 'rollup-plugin-polyfill-node';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['buffer', 'process'],
    esbuildOptions: {
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
          process: true,
        }),
        NodeModulesPolyfillPlugin(),
      ],
    },
  },
  resolve: {
    alias: {
      buffer: 'buffer/',
      process: 'process/browser',
    },
  },
  build: {
    rollupOptions: {
      plugins: [
        nodePolyfills(),
      ],
    },
  },
});

```

### For Next.js Projects

Install additional polyfills:

```bash
npm install node-polyfill-webpack-plugin buffer crypto-browserify stream-browserify util
```

Add to your `next.config.js`:

```typescript
// next.config.ts
import type { NextConfig } from 'next';
import NodePolyfillPlugin from 'node-polyfill-webpack-plugin';
import webpack from 'webpack';

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Polyfills like alias in Vite
      config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: require.resolve('buffer/'),
        process: require.resolve('process/browser'),
        stream: require.resolve('stream-browserify'),
        util: require.resolve('util/'),
        crypto: require.resolve('crypto-browserify'),
      };
    }

    // Inject global polyfills
    config.plugins.push(
      new NodePolyfillPlugin(),
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: ['process'],
      }),
      new webpack.DefinePlugin({
        global: 'globalThis',
      })
    );

    return config;
  },
};

export default nextConfig;
```

## 🚀 Quick Start

### 1. Basic Usage

```tsx
import React from 'react';
import { CheckoutWidget, WalletConnectionProvider } from 'solana-pay-widget';
import 'solana-pay-widget/dist/index.css';

function App() {
  const [isModalOpen, setIsModalOpen] = React.useState(true);

  const handleClose = () => setIsModalOpen(false);
  const handleSuccess = (txId: string) => {
    console.log('Payment successful:', txId);
    setIsModalOpen(false);
  };
  const handleError = (error: Error) => {
    console.error('Payment failed:', error);
    setIsModalOpen(false);
  };

  return (
    <WalletConnectionProvider rpcEndpoint='https://api.devnet.solana.com'> 
        <CheckoutWidget
          checkoutId="demo_checkout_123"
          merchantWallet="4rbzcZsLxEefKdyho3U2dc5tfKUMdSM4vyRQhAkL4EHX"
          amount={0.001}
          currency="SOL"
          productName="Premium Subscription"
          description="Monthly premium subscription with all features"
          isOpen={isModalOpen}
          onClose={handleClose}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </WalletConnectionProvider>
  );
}
```

### 2. Advanced Configuration

```tsx
<WalletConnectionProvider rpcEndpoint='https://api.devnet.solana.com'>
  <CheckoutWidget
    checkoutId="demo_checkout_123"
    merchantWallet="9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
    amount={0.001}
    currency="SOL"
    productName="Premium Subscription"
    description="Monthly premium subscription with all features"
    theme="dark"
    isOpen={true}
    onClose={() => {}}
    onSuccess={() => {}}
    onError={() => {}}
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
| `onSuccess` | `(txId: string) => void` | ❌ | Success callback |
| `onError` | `(error: Error) => void` | ❌ | Error callback |
| `className` | `string` | ❌ | Custom CSS class |
| `isOpen` | `boolean` | ✅ | Controls modal visibility |
| `onClose` | `() => void` | ✅ | Callback when modal is closed |

### WalletConnectionProvider Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `rpcEndpoint` | `string` | ❌ | Solana RPC endpoint (defaults to devnet) |
| `children` | `ReactNode` | ✅ | Child components |

## 🎯 Payment Flow

**⚠️ Network Configuration Note:**
By default, the widget uses **devnet** for testing. For production, explicitly set the RPC endpoint to mainnet:

```tsx
<WalletConnectionProvider rpcEndpoint='https://api.mainnet-beta.solana.com'>
  {/* Your CheckoutWidget */}
</WalletConnectionProvider>
```

**Payment Flow Steps:**

1. **Customer visits checkout** - Widget displays product details and payment options
2. **Payment method selection**:
   - 🦊 **Solana Wallet** - Direct wallet connection (Phantom, Backpack, Solflare)
   - 📱 **QR Code** - Mobile Solana Pay for phone wallets
3. **Transaction processing** - Secure blockchain or traditional payment processing
4. **Confirmation** - Success message with transaction ID

## 🔧 Common Issues & Solutions

### Buffer/Polyfill Errors

This package is pre-configured to avoid common buffer/polyfill issues. However, if you encounter them:

1. **For Vite**: Follow the Vite configuration above
2. **For Next.js**: Follow the Next.js configuration above
3. **For other bundlers**: You may need to configure similar polyfills

### Wallet Connection Issues

Make sure you're wrapping your app with `WalletConnectionProvider`:

```tsx
import { WalletConnectionProvider } from 'solana-pay-widget';

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
import 'solana-pay-widget/dist/index.css';
```

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/gamandeepsingh/solana-pay-widget.git

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

- 🐛 [Report Issues](https://github.com/gamandeepsingh/solana-pay-widget/issues)
-  Twitter: [@solanapaywidget](https://x.com/GamandeepSingh4)

---
<div align="center">
**Built with ❤️ for the Solana ecosystem**
</div>