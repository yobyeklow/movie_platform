"use client";
import React, { useMemo, useEffect } from "react";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";

import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

import "@solana/wallet-adapter-react-ui/styles.css";

function WalletSessionSync() {
  const { publicKey, connected, disconnecting } = useWallet();

  useEffect(() => {
    if (connected && publicKey) {
      // Set cookie when wallet connects — expires in 24 hours
      document.cookie = [
        `wallet_address=${publicKey.toBase58()}`,
        "path=/",
        "max-age=86400",
        "SameSite=Strict",
      ].join("; ");
      console.log("✅ Wallet session set:", publicKey.toBase58());
    }
  }, [connected, publicKey]);

  useEffect(() => {
    if (disconnecting) {
      // Clear cookie when wallet disconnects
      document.cookie = "wallet_address=; path=/; max-age=0; SameSite=Strict";
      console.log("🔌 Wallet session cleared");
    }
  }, [disconnecting]);

  return null;
}

export default function SolanaProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const endpoint = useMemo(
    () => process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8899",
    []
  );

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  console.log("🔗 WalletProvider initialized with endpoint:", endpoint);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletSessionSync /> {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
