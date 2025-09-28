import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  arbitrum,
  base,
  baseSepolia,
  mainnet,
  optimism,
  polygon,
  sepolia,
  polygonAmoy,
} from "wagmi/chains";

// Temporary fallback project ID for development
const FALLBACK_PROJECT_ID = "b2a5d742444e713ccb451ae4f7e5b5fb";

export const config = getDefaultConfig({
  appName: "Genuine Trade",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || FALLBACK_PROJECT_ID,
  chains: [mainnet, polygon, optimism, arbitrum, base, baseSepolia, sepolia, polygonAmoy],
  ssr: true, // If your dApp uses server side rendering (SSR)
});
