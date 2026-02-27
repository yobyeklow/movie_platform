import type { Metadata } from "next";
import "./globals.css";
import SolanaProvider from "@/components/WalletProvider";

export const metadata: Metadata = {
  title: "SOL//STREAM - Decentralized Cinema",
  description:
    "Brutalist movie streaming powered by Solana blockchain. No intermediaries. Pure cinema.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scanlines grain">
      <body>
        <SolanaProvider>
          {children}
        </SolanaProvider>
      </body>
    </html>
  );
}
