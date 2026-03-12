import "dotenv/config";
import { web3 } from "@coral-xyz/anchor";
import {
  getAccount,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import * as anchor from "@coral-xyz/anchor";
import IDL from "../target/idl/movie_platform.json";
import { Connection, Transaction, PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new web3.PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!);
const connection = new Connection(
  process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8899",
  { commitment: "confirmed", confirmTransactionInitialTimeout: 120000 }
);
function getProgram() {
  const dummyWallet = {
    publicKey: PublicKey.default,
    signTransaction: async (tx: Transaction) => tx,
    signAllTransactions: async (txs: Transaction[]) => txs,
  };
  const provider = new anchor.AnchorProvider(connection, dummyWallet as any, {
    commitment: "confirmed",
  });
  return new anchor.Program(IDL as anchor.Idl, provider);
}
async function main() {
  const program = getProgram();
  const connection = new web3.Connection(
    process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8899"
  );
  const userPubKey = new PublicKey(
    "61ULLTPSJVPN9aJdrxcFNS2L1f2PXuqVgjTLq3jFC5YC"
  );
  // Derive all PDAs
  const [platformConfigPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("platform-config")],
    PROGRAM_ID
  );
  const [tokenMintPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("token-mint")],
    PROGRAM_ID
  );
  const [treasuryPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    PROGRAM_ID
  );
  const treasuryATA = await getAssociatedTokenAddress(
    tokenMintPDA,
    treasuryPDA,
    true,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const userATA = await getAssociatedTokenAddress(
    tokenMintPDA,
    userPubKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  console.log("\n=== Derived PDAs ===");
  console.log("  platformConfig:", platformConfigPDA.toBase58());
  console.log("  tokenMint:     ", tokenMintPDA.toBase58());
  console.log("  treasury:      ", treasuryPDA.toBase58());
  console.log("  treasuryATA:   ", treasuryATA.toBase58());

  // Check existence
  console.log("\n=== On-chain Status ===");
  const checks = [
    { name: "platformConfig", address: platformConfigPDA },
    { name: "tokenMint", address: tokenMintPDA },
    { name: "treasury", address: treasuryPDA },
    { name: "treasuryATA", address: treasuryATA },
  ];

  for (const { name, address } of checks) {
    const info = await connection.getAccountInfo(address);
    console.log(
      `  ${name}: ${
        info ? "✅ EXISTS" : "❌ NOT FOUND"
      } — ${address.toBase58()}`
    );
  }

  // Decode platformConfig data
  console.log("\n=== Platform Config Data ===");
  try {
    const provider = new anchor.AnchorProvider(
      connection,
      {
        publicKey: web3.PublicKey.default,
        signTransaction: async (tx: any) => tx,
        signAllTransactions: async (txs: any) => txs,
      } as any,
      {}
    );
    const program = new anchor.Program(IDL as any, provider);
    const config = await (program as any).account.platformConfig.fetch(
      platformConfigPDA
    );

    console.log("  authority:         ", config.authority.toBase58());
    console.log("  treasury:          ", config.treasury.toBase58());
    console.log("  tokenMint:         ", config.tokenMint.toBase58());
    console.log("  bronzeCollection:  ", config.bronzeCollection.toBase58());
    console.log("  silverCollection:  ", config.silverCollection.toBase58());
    console.log("  goldCollection:    ", config.goldCollection.toBase58());
    console.log("  bronzePrice:       ", config.bronzePrice.toString());
    console.log("  silverPrice:       ", config.silverPrice.toString());
    console.log("  goldPrice:         ", config.goldPrice.toString());
    console.log("  mintOpenTimestamp: ", config.mintOpenTimestamp.toString());
  } catch (e: any) {
    console.log("  ❌ Could not decode:", e.message);
  }

  // Treasury ATA balance
  console.log("\n=== Treasury ATA Balance ===");
  try {
    const ataInfo = await getAccount(connection, treasuryATA);
    console.log("  Balance:", ataInfo.amount.toString());
    console.log("  Owner:  ", ataInfo.owner.toBase58());
    console.log("  Mint:   ", ataInfo.mint.toBase58());
  } catch {
    console.log("  ❌ Treasury ATA not found or not initialized");
  }
  console.log("\n=== User ATA Balance ===");
  try {
    const ataInfo = await getAccount(connection, userATA);
    console.log("  Balance:", ataInfo.amount.toString());
    console.log("  Owner:  ", ataInfo.owner.toBase58());
    console.log("  Mint:   ", ataInfo.mint.toBase58());
  } catch {
    console.log("  ❌ User ATA not found or not initialized");
  }
  console.log("\n=== NFT USER ===");
  try {
    const [memberPassPDA] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("member_pass"), userPubKey.toBuffer()],
      PROGRAM_ID
    );
    const memberPass = await (program as any).account.memberPass.fetch(
      memberPassPDA
    );

    const tierName = ["Bronze", "Silver", "Gold"][memberPass.tier];
    const now = Math.floor(Date.now() / 1000);
    const isExpired = memberPass.expiresAt.toNumber() < now;

    console.log("✅ Member Pass EXISTS");
    console.log("  owner:     ", memberPass.owner.toBase58());
    console.log("  tier:      ", memberPass.tier, `(${tierName})`);
    console.log("  nftAsset:  ", memberPass.nftAsset.toBase58());
    console.log("  nftEdition:", memberPass.nftEdition.toString());
    console.log(
      "  mintedAt:  ",
      new Date(memberPass.mintedAt.toNumber() * 1000).toISOString()
    );
    console.log(
      "  expiresAt: ",
      new Date(memberPass.expiresAt.toNumber() * 1000).toISOString(),
      isExpired ? "❌ EXPIRED" : "✅ ACTIVE"
    );
  } catch {
    console.log("  ❌ NFT not found or not initialized");
  }
}

main().catch(console.error);
