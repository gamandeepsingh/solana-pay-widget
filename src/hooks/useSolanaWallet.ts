import { useWallet } from '@solana/wallet-adapter-react';
import { useCallback, useState } from 'react';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';

export const useSolanaWallet = () => {
  const { publicKey, signTransaction, connected } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);

  const sendPayment = useCallback(async (
    connection: Connection,
    transaction: Transaction
  ) => {
    if (!publicKey || !signTransaction) {
      throw new Error('Wallet not connected');
    }

    setIsProcessing(true);
    try {
      // Get recent blockhash
      const { blockhash } = await connection.getRecentBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Sign transaction
      const signedTransaction = await signTransaction(transaction);
      
      // Send transaction
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize()
      );

      // Confirm transaction
      await connection.confirmTransaction(signature, 'confirmed');
      
      return signature;
    } finally {
      setIsProcessing(false);
    }
  }, [publicKey, signTransaction]);

  return {
    publicKey,
    connected,
    isProcessing,
    sendPayment,
  };
};