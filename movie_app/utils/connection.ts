import {Connection,clusterApiUrl} from "@solana/web3.js";

export function getConnection(){
    const isMainnet = process.env.NEXT_PUBLIC_IS_MAINNET || "true";
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl("devnet");

    return new Connection(rpcUrl,{
        commitment:"confirmed",
        confirmTransactionInitialTimeout:60000,
    });
}
export const connection = getConnection();