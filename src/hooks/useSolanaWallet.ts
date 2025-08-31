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
    } catch (error: any) {
      console.error('Payment error details:', error);
      
      // Format specific error messages
      let formattedError = error;
      
      if (error.message) {
        // Handle simulation failed errors
        if (error.message.includes('Simulation failed') && error.message.includes('insufficient funds for rent')) {
          formattedError = new Error(
            'Insufficient funds. You need more SOL to cover transaction fees and rent. Please add at least 0.01 SOL to your wallet.'
          );
        }
        // Handle other insufficient funds errors
        else if (error.message.includes('Insufficient funds') || error.message.includes('insufficient lamports')) {
          formattedError = new Error(
            'Insufficient SOL balance. Please add more SOL to your wallet.'
          );
        }
        // Handle transaction simulation errors
        else if (error.message.includes('Transaction simulation failed')) {
          formattedError = new Error(
            'Transaction simulation failed. This usually means insufficient funds or an invalid transaction.'
          );
        }
        // Handle user rejection
        else if (error.message.includes('User rejected') || error.message.includes('rejected')) {
          formattedError = new Error('Transaction was cancelled by user.');
        }
        // Handle network errors
        else if (error.message.includes('fetch') || error.message.includes('network')) {
          formattedError = new Error('Network error. Please check your connection and try again.');
        }
      }
      
      throw formattedError;
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