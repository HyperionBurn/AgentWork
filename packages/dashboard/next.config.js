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
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
          { key: "Access-Control-Allow-Credentials", value: "true" },
        ]
      }
    ]
  }
};

module.exports = nextConfig;
