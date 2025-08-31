import { 
  Connection, 
  PublicKey, 
  SystemProgram, 
  Transaction, 
  LAMPORTS_PER_SOL 
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID, 
  getAssociatedTokenAddress, 
  createTransferInstruction,
  getAccount,
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import BigNumber from 'bignumber.js';

// Devnet token addresses (use these for testing)
const DEVNET_TOKEN_ADDRESSES = {
  USDC: new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'), // Devnet USDC
  USDT: new PublicKey('BQcdHdAQW1hczDbBi9hiegXAR7A98Q9jx3X3iBBBDiq4'), // Devnet USDT
};

// Mainnet token addresses
const MAINNET_TOKEN_ADDRESSES = {
  USDC: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
  USDT: new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'),
};

// Helper function to determine if we're on devnet
const isDevnet = (connection: Connection): boolean => {
  const endpoint = connection.rpcEndpoint;
  return endpoint.includes('devnet') || endpoint.includes('127.0.0.1') || endpoint.includes('localhost');
};

// Helper function to check if account exists
const accountExists = async (connection: Connection, address: PublicKey): Promise<boolean> => {
  try {
    const accountInfo = await connection.getAccountInfo(address);
    return accountInfo !== null;
  } catch {
    return false;
  }
};

export const createSolanaPayTransaction = async (
  connection: Connection,
  recipient: PublicKey,
  sender: PublicKey,
  amount: number,
  currency: 'SOL' | 'USDC' | 'USDT',
  reference: PublicKey
): Promise<Transaction> => {
  const transaction = new Transaction();
  const isDevnetConnection = isDevnet(connection);
  
  // Use appropriate token addresses based on network
  const TOKEN_ADDRESSES = isDevnetConnection ? DEVNET_TOKEN_ADDRESSES : MAINNET_TOKEN_ADDRESSES;

  try {
    if (currency === 'SOL') {
      // SOL transfer
      const lamports = new BigNumber(amount).multipliedBy(LAMPORTS_PER_SOL);
      
      if (!lamports.isInteger() || lamports.isLessThanOrEqualTo(0)) {
        throw new Error('Invalid SOL amount');
      }

      // Check sender SOL balance
      const balance = await connection.getBalance(sender);
      const requiredLamports = lamports.toNumber();
      
      if (balance < requiredLamports) {
        throw new Error(`Insufficient SOL balance. Required: ${amount} SOL, Available: ${balance / LAMPORTS_PER_SOL} SOL`);
      }

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: sender,
          toPubkey: recipient,
          lamports: requiredLamports,
        })
      );
    } else {
      // SPL Token transfer
      const mintAddress = TOKEN_ADDRESSES[currency];
      
      if (!mintAddress) {
        throw new Error(`Unsupported currency: ${currency}`);
      }
      
      // Get sender's associated token account
      const senderTokenAccount = await getAssociatedTokenAddress(
        mintAddress,
        sender,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      
      // Check if sender token account exists
      const senderAccountExists = await accountExists(connection, senderTokenAccount);
      if (!senderAccountExists) {
        throw new Error(`You don't have a ${currency} token account. Please create one first.`);
      }

      // Get sender's token balance
      try {
        const senderAccount = await getAccount(connection, senderTokenAccount);
        const decimals = currency === 'USDC' ? 6 : 6; // Both USDC and USDT have 6 decimals
        
        const tokenAmount = new BigNumber(amount)
          .multipliedBy(new BigNumber(10).pow(decimals));
          
        if (!tokenAmount.isInteger() || tokenAmount.isLessThanOrEqualTo(0)) {
          throw new Error(`Invalid ${currency} amount`);
        }

        const requiredTokens = tokenAmount.toNumber();
        
        if (Number(senderAccount.amount) < requiredTokens) {
          const availableBalance = new BigNumber(senderAccount.amount.toString())
            .dividedBy(new BigNumber(10).pow(decimals))
            .toFixed();
          throw new Error(`Insufficient ${currency} balance. Required: ${amount} ${currency}, Available: ${availableBalance} ${currency}`);
        }

        // Get recipient's associated token account
        const recipientTokenAccount = await getAssociatedTokenAddress(
          mintAddress,
          recipient,
          false,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );

        // Check if recipient token account exists, create if it doesn't
        const recipientAccountExists = await accountExists(connection, recipientTokenAccount);
        if (!recipientAccountExists) {
          transaction.add(
            createAssociatedTokenAccountInstruction(
              sender, // payer
              recipientTokenAccount,
              recipient,
              mintAddress,
              TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID
            )
          );
        }

        // Add transfer instruction
        transaction.add(
          createTransferInstruction(
            senderTokenAccount,
            recipientTokenAccount,
            sender,
            requiredTokens,
            [],
            TOKEN_PROGRAM_ID
          )
        );
      } catch (error) {
        if (error instanceof Error && error.message.includes('could not find account')) {
          throw new Error(`${currency} token account not found. Please ensure you have ${currency} tokens.`);
        }
        throw error;
      }
    }

    // Add reference for tracking (smaller amount to avoid fees)
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: sender,
        toPubkey: reference,
        lamports: 1,
      })
    );

    return transaction;
    
  } catch (error) {
    console.error('Transaction creation failed:', error);
    throw error;
  }
};

export const generateReference = (): PublicKey => {
  return PublicKey.unique();
};

export const createSolanaPayUrl = (
  recipient: string,
  amount: number,
  currency: string,
  reference: string,
  label: string,
  message?: string
): string => {
  try {
    const params = new URLSearchParams({
      recipient,
      amount: amount.toString(),
      reference,
      label,
      ...(message && { message }),
    });

    // Only add spl-token parameter for token payments
    if (currency !== 'SOL') {
      const TOKEN_ADDRESSES = DEVNET_TOKEN_ADDRESSES; // Use devnet for testing
      const tokenMint = TOKEN_ADDRESSES[currency as keyof typeof TOKEN_ADDRESSES];
      if (tokenMint) {
        params.set('spl-token', tokenMint.toString());
      }
    }

    return `solana:${params.toString()}`;
  } catch (error) {
    console.error('Failed to create Solana Pay URL:', error);
    throw new Error('Failed to generate payment URL');
  }
};