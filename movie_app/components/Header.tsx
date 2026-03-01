"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useState } from "react";
import { usePathname } from 'next/navigation';
import Link from "next/link";

const linkRefs = [
    {
        href:"/",
        title:'HOME'
    },
    {
        href:"/nft",
        title:'NFT'
    },
    {
        href:"/trending",
        title:'TRENDING'
    },
]
export default function Header(){
    const [showWalletMenu, setShowWalletMenu] = useState(false);
    const { connected, disconnect,wallet } = useWallet();
    const { setVisible } = useWalletModal();
    const searchParams = usePathname()
    const handleConnect = async () => {
        if (!connected) {
        setVisible(true);
        await wallet?.adapter.connect();
        }
    };

    const toggleWalletMenu = () => {
        setShowWalletMenu(!showWalletMenu);
    };
    
    const disconnectWallet = async () => {
        await disconnect();
        setShowWalletMenu(false);
    };

    const truncateAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };
    return(
        <nav className="fixed top-0 left-0 right-0 z-50 border-b-2 border-[#222] bg-[#050505]/90 backdrop-blur-sm flex items-center justify-center">
        <div className="max-w-[1400px] w-full px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 brutal-border bg-[#0a0a0a] flex items-center justify-center">
                <span className="font-display text-xl font-black text-[#ff6b35]">
                  S
                </span>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-display font-black text-lg tracking-tight text-white">
                  SOL//STREAM
                </h1>
                <p className="font-mono text-[10px] text-[#00d9ff] tracking-[0.2em]">
                  PLATFORM
                </p>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="hidden lg:flex items-center gap-6 font-mono text-xs">
                {linkRefs.map((item)=>{
                    return(
                        <Link
                            href={item.href}
                            key={item.href}
                            className={`text-[#e5e5e5]/60 hover:text-[#ff6b35] transition-colors tracking-wider ${item.href == searchParams?"text-[#ff6b35]":""}`}
                            >
                            {item.title}
                        </Link>
                    )
                })}
              </div>
            </div>

            <div className="relative flex justify-center items-center gap-8">
                <button
                    onClick={connected ? toggleWalletMenu : handleConnect}
                    className={`cursor-pointer px-6 py-3 font-mono text-xs font-bold ${
                    connected
                        ? "bg-[#ff6b35] text-black border-[#ff6b35]"
                        : "bg-transparent text-white border-[#222] tracking-wider brutal-border glitch-hover"
                    }`}
                >
                    {connected
                    ? `${truncateAddress(wallet?.adapter.publicKey?.toString() || "")} ▼`
                    : "CONNECT_WALLET"}
                </button>

                {connected && showWalletMenu && (
                    <div className="absolute top-full right-0 mt-2 w-[148px] bg-[#0a0a0a] border-2 border-[#222] z-50 shadow-xl">
                    <div className="px-2 py-2">
                        <button
                        onClick={async (e) => {
                            e.stopPropagation();
                            await disconnectWallet();
                        }}
                        className="w-full  font-mono text-xs font-bold bg-transparent text-[#ff6b35] border-[#222] cursor-pointer"
                        >
                        DISCONNECT
                        </button>
                    </div>
                    </div>
                )}
            </div>
          </div>
        </div>
      </nav>
    )
}