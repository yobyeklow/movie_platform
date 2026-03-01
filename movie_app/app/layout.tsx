import type { Metadata } from "next";
import "./globals.css";
import SolanaProvider from "@/components/WalletProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
export const metadata: Metadata = {
  title: "SOL//STREAM - Decentralized Cinema Discovery",
  description:
    "Discover movies, watch trailers, and track your watchlist. A brutalist movie discovery platform powered by Solana blockchain.",
  other: {
    "Content-Security-Policy": "default-src 'self' https://www.youtube.com https://s.ytimg.com https://yt3.ggpht.com; script-src 'self' 'unsafe-inline' https://www.youtube.com https://s.ytimg.com; img-src 'self' https://www.youtube.com https://s.ytimg.com https://yt3.ggpht.com data: blob:; connect-src 'self' https://www.youtube.com https://s.ytimg.com https://yt3.ggpht.com; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com; media-src 'self' https://www.youtube.com https://s.ytimg.com https://yt3.ggpht.com;",
  },
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
          <Header></Header>
            {children}
          <Footer></Footer>
        </SolanaProvider>
      </body>
    </html>

  );
}
