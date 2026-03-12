"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import NFTCard from "@/components/nft/NFTCard";
import Image from "next/image";

const NFT_TIERS = [
  {
    id: "bronze" as const,
    name: "Movie Bronze Pass",
    symbol: "BRONZE",
    description: "30-day Bronze membership - Watch movies",
    image:
      "https://cyan-practical-spoonbill-100.mypinata.cloud/ipfs/bafybeibjlxyjfp722me5gcjafo4be4si6z43bsxxsfkaldztw2f5f4hi3e",
    price: "5",
  },
  {
    id: "silver" as const,
    name: "Movie Silver Pass",
    symbol: "SILVER",
    description: "30-day Silver membership - Watch movies",
    image:
      "https://cyan-practical-spoonbill-100.mypinata.cloud/ipfs/bafybeiew3qggjumdoer6tibn2wfqtdwjfz2w2csrgookmqpyse5huyyyee",
    price: "10",
  },
  {
    id: "gold" as const,
    name: "Movie Gold Pass",
    symbol: "GOLD",
    description: "30-day Gold membership - Watch movies",
    image:
      "https://cyan-practical-spoonbill-100.mypinata.cloud/ipfs/bafybeiftnbg3zmhq5nxse2psgw5oyn64kb7bmo7xawyzj75n757z7k6kmq",
    price: "15",
  },
];

export default function NFTPage() {
  const { connected, publicKey, signTransaction } = useWallet();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "connecting" | "minting" | "success" | "error"
  >("idle");
  const [txSignature, setTxSignature] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const handleMint = async () => {
    // ─── Pre-flight checks ─────────────────────────────────────────────
    if (!connected || !publicKey) {
      setErrorMessage("Please connect your wallet first");
      setStatus("error");
      return;
    }

    if (!signTransaction) {
      setErrorMessage("Wallet does not support signing");
      setStatus("error");
      return;
    }

    const tierMap: Record<string, number> = { bronze: 0, silver: 1, gold: 2 };
    const tier = tierMap[selectedTier ?? ""];
    if (tier === undefined) {
      setErrorMessage("Please select a tier first");
      setStatus("error");
      return;
    }

    try {
      setLoading(true);
      setStatus("minting");
      setErrorMessage("");

      // ─── Step 1: Request transaction from backend ────────────────────
      // create-mint-transaction builds the tx, generates asset keypair,
      // partially signs with asset keypair, returns base64 tx

      const createRes = await fetch("/api/create-mint-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          userPublicKey: publicKey.toBase58(),
        }),
      });

      const createData = await createRes.json();

      if (!createData.success) {
        throw new Error(createData.message || "Failed to create transaction");
      }

      // ─── Step 2: Deserialize transaction (has asset sig already) ────
      // DO NOT rebuild from scratch — asset's partial signature is inside

      const tx = Transaction.from(
        Buffer.from(createData.transaction, "base64")
      );
      // ─── Step 3: User signs ──────────────────────────────────────────
      // Adds user's signature alongside asset's existing signature

      const signedTx = await signTransaction(tx);

      // Verify both signatures are present before sending
      const sigCheck = signedTx.signatures.map((s) => ({
        key: s.publicKey.toBase58(),
        signed: !!s.signature,
      }));

      const allSigned = sigCheck.every((s) => s.signed);
      if (!allSigned) {
        const missing = sigCheck.filter((s) => !s.signed).map((s) => s.key);
        throw new Error(`Missing signatures for: ${missing.join(", ")}`);
      }

      // ─── Step 4: Send signed transaction to complete-mint ───────────
      // complete-mint validates accounts + discriminator, then broadcasts
      const serialized = Buffer.from(signedTx.serialize()).toString("base64");

      const completeRes = await fetch("/api/complete-mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction: serialized }),
      });

      const completeData = await completeRes.json();

      if (!completeData.success) {
        throw new Error(completeData.message || "Failed to complete mint");
      }

      console.log("✅ MINT SUCCESSFUL!");
      console.log("  Signature:", completeData.signature);
      console.log("  Tier:", completeData.tierName);

      setStatus("success");
      setTxSignature(completeData.signature);
    } catch (error: any) {
      console.error("❌ Mint failed:", error.message);

      const message = error.message?.includes("User rejected")
        ? "Transaction cancelled"
        : error.message?.includes("insufficient funds") ||
          error.message?.includes("Insufficient")
        ? "Not enough tokens to mint this pass"
        : error.message?.includes("already in use") ||
          error.message?.includes("already exists")
        ? "You already have a member pass"
        : error.message?.includes("expired") ||
          error.message?.includes("blockhash")
        ? "Transaction expired, please try again"
        : error.message?.includes("Minting is not open")
        ? "Minting is not open yet"
        : error.message?.includes("Missing signatures")
        ? "Transaction signing incomplete"
        : error.message || "Something went wrong, please try again";

      setErrorMessage(message);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pt-32 pb-24">
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Header Section */}
        <section className="mb-16 brutal-border bg-[#0a0a0a] p-8 lg:p-12 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-24 h-24 border-l-2 border-b-2 border-[#cfff04]" />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 border-r-2 border-t-2 border-[#ff6b35]" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display font-black text-4xl lg:text-5xl text-white mb-6 tracking-tight">
                MEMBERSHIP PASSES
              </h2>
              <p className="font-mono text-sm text-[#e5e5e5]/80 leading-relaxed max-w-md mb-6">
                Unlock exclusive movie access with our tiered NFT membership
                passes. Each pass grants 30 days of unlimited movie streaming
                access on the decentralized SOL//STREAM platform.
              </p>
              <div className="flex items-center gap-4">
                <span className="font-mono text-[10px] text-[#e5e5e5]/40">
                  SMART_CONTRACT
                </span>
              </div>
              <div className="brutal-border bg-[#050505] p-4 mt-4 max-w-md">
                <p className="font-mono text-xs text-[#00d9ff] break-all">
                  {"8dAUqhQqmm1tySTUhcVbud7yyJ6q5GzxH3hikkFa6atx"}
                </p>
              </div>
            </div>

            <div className="relative h-64 lg:h-80 overflow-hidden brutal-border">
              <Image
                src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0"
                alt="NFT Collection"
                width={800}
                height={600}
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 img-noise"
              ></Image>

              <div className="absolute inset-0 bg-linear-to-t from-[#050505] to-transparent" />
            </div>
          </div>
        </section>

        {/* Status Messages */}
        {status !== "idle" && (
          <section className="mb-12">
            {status === "minting" && (
              <div className="p-4 bg-[#ff6b35]/10 border-l-2 border-[#ff6b35] brutal-border">
                <div className="flex items-center gap-3">
                  <span className="text-2xl animate-pulse">⏳</span>
                  <span className="font-mono text-sm text-[#ff6b35]">
                    Minting your NFT pass. This may take a few moments...
                  </span>
                </div>
              </div>
            )}

            {status === "success" && (
              <div className="p-4 bg-[#cfff04]/10 border-l-2 border-[#cfff04] brutal-border">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✓</span>
                  <span className="font-mono text-sm text-[#cfff04]">
                    Success! Your NFT pass has been minted.
                  </span>
                </div>
                {txSignature && (
                  <div className="mt-3 brutal-border bg-[#050505] p-3">
                    <p className="font-mono text-[10px] text-[#e5e5e5]/40 mb-1">
                      TRANSACTION_SIGNATURE
                    </p>
                    <p className="font-mono text-xs text-[#00d9ff] break-all">
                      {txSignature}
                    </p>
                    <a
                      href={`https://solscan.io/tx/${txSignature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[10px] text-[#ff6b35] hover:text-[#cfff04] transition-colors mt-2 inline-block"
                    >
                      View on Solscan →
                    </a>
                  </div>
                )}
              </div>
            )}

            {status === "error" && (
              <div className="p-4 bg-[#e5e5e5]/10 border-l-2 border-[#e5e5e5] brutal-border">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✕</span>
                  <span className="font-mono text-sm text-[#e5e5e5]">
                    An error occurred during minting. Please try again.
                  </span>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Tier Selection */}
        <section className="mb-16">
          <h3 className="font-display font-black text-2xl text-white mb-8 tracking-tight">
            SELECT TIER
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {NFT_TIERS.map((tier) => (
              <NFTCard
                key={tier.id}
                tier={tier.id}
                name={tier.name}
                symbol={tier.symbol}
                description={tier.description}
                image={tier.image}
                price={tier.price}
                selected={selectedTier === tier.id}
                onSelect={() => setSelectedTier(tier.id)}
                disabled={loading}
              />
            ))}
          </div>
        </section>

        {/* Mint Button */}
        {selectedTier !== null && (
          <section className="mb-16">
            <div className="max-w-md mx-auto">
              <button
                onClick={handleMint}
                disabled={!connected || loading}
                className={`
                    w-full px-8 py-6 font-mono text-sm font-bold brutal-border border-2 transition-all relative overflow-hidden
                    ${
                      loading || !connected
                        ? "bg-[#222] text-[#e5e5e5]/40 cursor-not-allowed border-[#222]"
                        : "bg-[#ff6b35] text-black hover:bg-[#e55a2a] hover:border-[#e55a2a] cursor-pointer border-[#ff6b35]"
                    }
                  `}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-[#e5e5e5] border-t-transparent border-r-transparent"></span>
                    <span className="tracking-wider">MINTING...</span>
                  </span>
                ) : !connected ? (
                  <span className="tracking-wider">CONNECT WALLET FIRST</span>
                ) : (
                  <span className="tracking-wider">
                    MINT PASS -{" "}
                    {NFT_TIERS.find((t) => t.id === selectedTier)?.symbol}
                  </span>
                )}
              </button>
            </div>
          </section>
        )}

        {/* Benefits Section */}
        <section className="mb-16">
          <h3 className="font-display font-black text-2xl text-white mb-8 tracking-tight">
            MEMBERSHIP BENEFITS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="brutal-border bg-[#0a0a0a] p-6 hover:border-[#00d9ff] transition-colors group">
              <div className="text-3xl mb-4">🎬</div>
              <h4 className="font-display font-bold text-lg mb-2 text-white">
                UNLIMITED ACCESS
              </h4>
              <p className="font-mono text-[10px] text-[#e5e5e5]/60 leading-relaxed">
                Watch any movie in our catalog without limits. No ads, no
                restrictions, pure streaming.
              </p>
            </div>

            <div className="brutal-border bg-[#0a0a0a] p-6 hover:border-[#cfff04] transition-colors group">
              <div className="text-3xl mb-4">4K</div>
              <h4 className="font-display font-bold text-lg mb-2 text-white">
                PREMIUM QUALITY
              </h4>
              <p className="font-mono text-[10px] text-[#e5e5e5]/60 leading-relaxed">
                Stream in 4K HDR with Dolby Atmos audio. The best possible
                viewing experience.
              </p>
            </div>

            <div className="brutal-border bg-[#0a0a0a] p-6 hover:border-[#ff6b35] transition-colors group">
              <div className="text-3xl mb-4">⚡</div>
              <h4 className="font-display font-bold text-lg mb-2 text-white">
                INSTANT ACCESS
              </h4>
              <p className="font-mono text-[10px] text-[#e5e5e5]/60 leading-relaxed">
                Zero confirmation transactions. Start watching immediately after
                minting.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
