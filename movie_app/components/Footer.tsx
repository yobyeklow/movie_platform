export default function Footer(){
    return (
        <footer className="border-t-2 border-[#222] bg-[#0a0a0a] py-12 flex items-center justify-center">
        <div className="w-full max-w-[1400px] px-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 brutal-border bg-[#050505] flex items-center justify-center">
                <span className="font-display text-lg font-black text-[#ff6b35]">
                  S
                </span>
              </div>
              <div>
                <h5 className="font-display font-black text-white">
                  SOL//STREAM
                </h5>
                <p className="font-mono text-[9px] text-[#00d9ff] tracking-[0.2em]">
                  DECENTRALIZED_CINEMA
                </p>
              </div>
            </div>

            <p className="font-mono text-[10px] text-[#e5e5e5]/40 tracking-wider text-center lg:text-left">
              © 2024 SOL//STREAM. ALL RIGHTS RESERVED. POWERED BY
              SOLANA_BLOCKCHAIN.
            </p>

            <div className="flex gap-6 font-mono text-[10px]">
              <a
                href="#"
                className="text-[#e5e5e5]/40 hover:text-[#ff6b35] transition-colors tracking-wider"
              >
                TERMS
              </a>
              <a
                href="#"
                className="text-[#e5e5e5]/40 hover:text-[#00d9ff] transition-colors tracking-wider"
              >
                PRIVACY
              </a>
              <a
                href="#"
                className="text-[#e5e5e5]/40 hover:text-[#cfff04] transition-colors tracking-wider"
              >
                SUPPORT
              </a>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-[#222]">
            <div className="font-mono text-[9px] text-[#e5e5e5]/20 tracking-wider flex flex-wrap gap-2 justify-center lg:justify-start">
              <span>[</span>
              <span className="text-[#ff6b35]">SYSTEM_STATUS:</span>
              <span>OPERATIONAL</span>
              <span>//</span>
              <span className="text-[#00d9ff]">NETWORK:</span>
              <span>SOLANA_MAINNET</span>
              <span>//</span>
              <span className="text-[#cfff04]">TPS:</span>
              <span>4,582</span>
              <span>//</span>
              <span>UPTIME:</span>
              <span>99.97%</span>
              <span>]</span>
            </div>
          </div>
        </div>
        </footer>
    )
}