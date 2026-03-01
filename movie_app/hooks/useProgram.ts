import { Program, AnchorProvider, setProvider, web3 } from "@coral-xyz/anchor";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import IDL from "@/app/idl/movie_platform.json";

const RPC_URL = 'https://api.apr.dev'
const PROGRAM = new web3.PublicKey(IDL.address);
export function useProgram(){
    const { connection } = useConnection();
    const wallet = useWallet();
    
    const provider = new AnchorProvider(connection, wallet as any, {});
    setProvider(provider);
    const program = new Program<any>(IDL,provider);
    return program;
}
