/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  env: {
    ARC_CHAIN_ID: process.env.ARC_CHAIN_ID || "5042002",
    ARC_RPC_URL: process.env.ARC_RPC_URL || "https://rpc.testnet.arc.network",
    ARC_USDC_ADDRESS: process.env.ARC_USDC_ADDRESS || "0x3600000000000000000000000000000000000000",
    ARC_GATEWAY_ADDRESS: process.env.ARC_GATEWAY_ADDRESS || "0x0077777d7EBA4688BDeF3E311b846F25870A19B9",
    ARC_EXPLORER: process.env.ARC_EXPLORER || "https://testnet.arcscan.io/tx/",
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

module.exports = nextConfig;
