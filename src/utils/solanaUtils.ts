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
  getAccount
} from '@solana/spl-token';
import BigNumber from 'bignumber.js';

// Token addresses on mainnet
const TOKEN_ADDRESSES = {
  USDC: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
  USDT: new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'),
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

  if (currency === 'SOL') {
    // SOL transfer
    const lamports = new BigNumber(amount).multipliedBy(LAMPORTS_PER_SOL).toNumber();
    
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: sender,
        toPubkey: recipient,
        lamports,
      })
    );
  } else {
    // SPL Token transfer
    const mintAddress = TOKEN_ADDRESSES[currency];
    
    // Get sender's associated token account
    const senderTokenAccount = await getAssociatedTokenAddress(
      mintAddress,
      sender
    );
    
    // Get recipient's associated token account
    const recipientTokenAccount = await getAssociatedTokenAddress(
      mintAddress,
      recipient
    );

    // Get token decimals
    const tokenAccount = await getAccount(connection, senderTokenAccount);
    const decimals = currency === 'USDC' ? 6 : 6; // USDC and USDT have 6 decimals
    
    const tokenAmount = new BigNumber(amount)
      .multipliedBy(new BigNumber(10).pow(decimals))
      .toNumber();

    transaction.add(
      createTransferInstruction(
        senderTokenAccount,
        recipientTokenAccount,
        sender,
        tokenAmount,
        [],
        TOKEN_PROGRAM_ID
      )
    );
  }

  // Add reference for tracking
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: sender,
      toPubkey: reference,
      lamports: 1,
    })
  );

  return transaction;
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
  const params = new URLSearchParams({
    recipient,
    amount: amount.toString(),
    'spl-token': currency === 'SOL' ? '' : TOKEN_ADDRESSES[currency as keyof typeof TOKEN_ADDRESSES].toString(),
    reference,
    label,
    ...(message && { message }),
  });

  return `solana:${params.toString()}`;
};