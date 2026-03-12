import type { NextConfig } from "next";
import path from "path";
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_TMDB_API_KEY: process.env.NEXT_PUBLIC_TMDB_API_KEY,
    NEXT_PUBLIC_YOUTUBE_API_KEY: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
    NEXT_PUBLIC_TMDB_BASE_URL: process.env.NEXT_PUBLIC_TMDB_BASE_URL,
    NEXT_PUBLIC_TMDB_IMAGE_BASE_URL:
      process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL,

    NEXT_PUBLIC_USDC_MINT: process.env.NEXT_PUBLIC_USDC_MINT,
    NEXT_PUBLIC_PROGRAM_ID: process.env.NEXT_PUBLIC_PROGRAM_ID,
    NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
    NEXT_PUBLIC_IS_MAINNET: process.env.NEXT_PUBLIC_IS_MAINNET,
    NEXT_ADMIN_PRIVATE_KEY: process.env.NEXT_ADMIN_PRIVATE_KEY,
    NEXT_KEYPAIR: process.env.NEXT_KEYPAIR,
    INTERNAL_SECRET: process.env.INTERNAL_SECRET,
  },
};

export default nextConfig;
