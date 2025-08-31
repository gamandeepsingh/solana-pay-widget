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

// Devnet token addresses
const DEVNET_TOKEN_ADDRESSES = {
  USDC: new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'), // Devnet USDC
  USDT: new PublicKey('BQcdHdAQW1hczDbBi9hiegXAR7A98Q9jx3X3iBBBDiq4'), // Devnet USDT
};

// Mainnet token addresses
const MAINNET_TOKEN_ADDRESSES = {
  USDC: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
  USDT: new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'),
};

const isDevnet = (connection: Connection): boolean => {
  const endpoint = connection.rpcEndpoint;
  return endpoint.includes('devnet') || endpoint.includes('127.0.0.1') || endpoint.includes('localhost');
};

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
  
  const TOKEN_ADDRESSES = isDevnetConnection ? DEVNET_TOKEN_ADDRESSES : MAINNET_TOKEN_ADDRESSES;

  try {
    if (currency === 'SOL') {
      const lamports = new BigNumber(amount).multipliedBy(LAMPORTS_PER_SOL);
      
      if (!lamports.isInteger() || lamports.isLessThanOrEqualTo(0)) {
        throw new Error('Invalid SOL amount');
      }

      const balance = await connection.getBalance(sender);
      const requiredLamports = lamports.toNumber();
      
      const estimatedFees = 10000;
      const totalRequired = requiredLamports + estimatedFees;
      
      if (balance < totalRequired) {
        const requiredSOL = totalRequired / LAMPORTS_PER_SOL;
        const availableSOL = balance / LAMPORTS_PER_SOL;
        throw new Error(
          `Insufficient SOL balance. Required: ${requiredSOL.toFixed(6)} SOL (including fees), Available: ${availableSOL.toFixed(6)} SOL. Please add at least ${(requiredSOL - availableSOL).toFixed(6)} SOL to your wallet.`
        );
      }

      if (requiredLamports < 1000) {
        throw new Error('Amount too small. Minimum payment amount is 0.000001 SOL to cover transaction costs.');
      }

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: sender,
          toPubkey: recipient,
          lamports: requiredLamports,
        })
      );
    } else {
      const mintAddress = TOKEN_ADDRESSES[currency];
      
      if (!mintAddress) {
        throw new Error(`Unsupported currency: ${currency}`);
      }
      
      const senderTokenAccount = await getAssociatedTokenAddress(
        mintAddress,
        sender,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      
      const senderAccountExists = await accountExists(connection, senderTokenAccount);
      if (!senderAccountExists) {
        throw new Error(`You don't have a ${currency} token account. Please create one first.`);
      }

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

        const recipientTokenAccount = await getAssociatedTokenAddress(
          mintAddress,
          recipient,
          false,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );

        const recipientAccountExists = await accountExists(connection, recipientTokenAccount);
        if (!recipientAccountExists) {
          transaction.add(
            createAssociatedTokenAccountInstruction(
              sender,
              recipientTokenAccount,
              recipient,
              mintAddress,
              TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID
            )
          );
        }

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

    return transaction;
  } catch (error) {
    console.error('Transaction creation failed:', error);
    throw error;
  }
};

export const generateReference = (): PublicKey => {
  const randomBytes = new Uint8Array(32);
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < 32; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }
  
  try {
    return new PublicKey(randomBytes);
  } catch {
    return new PublicKey([
      ...Array.from({ length: 32 }, () => Math.floor(Math.random() * 256))
    ]);
  }
};

export const pollForTransaction = async (
  connection: Connection,
  reference: PublicKey,
  recipient: PublicKey,
  expectedAmount: number,
  currency: string,
  onSuccess: (signature: string) => void,
  onError: (error: Error) => void,
  maxAttempts: number = 60
): Promise<void> => {
  let attempts = 0;
  const startTime = Date.now();
  
  const checkTransaction = async () => {
    try {
      
      const signatures = await connection.getSignaturesForAddress(recipient, {
        limit: 20
      });
      
      if (signatures.length > 0) {
        
        for (const signatureInfo of signatures) {
          try {
            const txTime = signatureInfo.blockTime ? signatureInfo.blockTime * 1000 : 0;
            if (txTime < startTime - 30000) { // 30 second buffer
              continue;
            }
            
            const transaction = await connection.getTransaction(signatureInfo.signature, {
              maxSupportedTransactionVersion: 0
            });
            
            if (transaction && transaction.meta) {
              if (currency === 'SOL') {
                const expectedLamports = expectedAmount * LAMPORTS_PER_SOL;
                
                const recipientIndex = transaction.transaction.message.getAccountKeys().staticAccountKeys
                  .findIndex(key => key.equals(recipient));
                
                if (recipientIndex !== -1 && 
                    transaction.meta.preBalances && 
                    transaction.meta.postBalances) {
                  
                  const balanceChange = transaction.meta.postBalances[recipientIndex] - transaction.meta.preBalances[recipientIndex];
                  
                  if (Math.abs(balanceChange - expectedLamports) < 1000) { // 1000 lamports tolerance
                    
                    if (signatureInfo.confirmationStatus === 'confirmed' || signatureInfo.confirmationStatus === 'finalized') {
                      onSuccess(signatureInfo.signature);
                      return;
                    }
                  }
                }
              }
            }
          } catch (txError) {
            console.log('Error getting transaction details:', txError);
            // Continue checking other transactions
          }
        }
      }
      
      attempts++;
      
      if (attempts >= maxAttempts) {
        onError(new Error('Transaction timeout. The payment may have completed but verification failed. Please check your wallet transaction history.'));
        return;
      }
      
      setTimeout(checkTransaction, 5000);
      
    } catch (error) {
      console.error('Error polling for transaction:', error);
      attempts++;
      
      if (attempts >= maxAttempts) {
        onError(new Error('Failed to verify transaction. Please check your wallet and try again.'));
        return;
      }
      
      setTimeout(checkTransaction, 5000);
    }
  };
  
  checkTransaction();
};

export const createSolanaPayUrl = (
  recipient: string,
  amount: number,
  currency: string,
  reference: string,
  label?: string,
  message?: string
): string => {
  try {
    const recipientKey = new PublicKey(recipient);

    let referenceKey: PublicKey;
    try {
      referenceKey = new PublicKey(reference);
    } catch {
      referenceKey = generateReference();
    }

    const baseUrl = `solana:${recipientKey.toString()}`;
    const params = new URLSearchParams();

    const formattedAmount = amount
      .toFixed(9)
      .replace(/0+$/, '')
      .replace(/\.$/, '');
    params.set('amount', formattedAmount);

    if (currency !== 'SOL') {
      const TOKEN_ADDRESSES = DEVNET_TOKEN_ADDRESSES;
      const tokenMint = TOKEN_ADDRESSES[currency as keyof typeof TOKEN_ADDRESSES];
      if (!tokenMint) throw new Error(`Unsupported token: ${currency}`);
      params.set('spl-token', tokenMint.toString());
    }

    params.set('reference', referenceKey.toString());

    if (label) params.set('label', label);
    if (message) params.set('memo', message);

    const finalUrl = `${baseUrl}?${params.toString()}`;

    if (finalUrl.length > 2048) {
      console.warn('Solana Pay URL too long for some QR scanners');
    }

    return finalUrl;
  } catch (error) {
    console.error('Failed to create Solana Pay URL:', error);
    throw new Error(`Failed to generate payment URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
