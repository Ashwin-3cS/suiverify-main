import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

const network =
  (process.env.NEXT_PUBLIC_SUI_NETWORK as "devnet" | "testnet" | "mainnet") ||
  "devnet";

export const suiClient = new SuiClient({
  url: process.env.NEXT_PUBLIC_FULLNODE_URL || getFullnodeUrl(network),
});

export { network };
