import { createPublicClient, http, parseAbiItem } from "viem";
import { mainnet, polygon, arbitrum, optimism, base } from "viem/chains";

const CHAIN_MAP = {
  1: mainnet,
  137: polygon,
  42161: arbitrum,
  10: optimism,
  8453: base,
} as const;

const TRANSFER_EVENT = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

export function watchForTransfer(params: {
  depositAddress: `0x${string}`;
  tokenAddress: `0x${string}`;
  chainId: number;
  onFound: (txHash: string, from: string) => void;
}): { stop: () => void } {
  const { depositAddress, tokenAddress, chainId, onFound } = params;
  const chain = CHAIN_MAP[chainId as keyof typeof CHAIN_MAP];
  if (!chain) throw new Error(`Unsupported chainId: ${chainId}`);

  const client = createPublicClient({ chain, transport: http() });
  let stopped = false;
  let fromBlock: bigint;
  let intervalId: ReturnType<typeof setInterval>;

  // Start: snapshot current block then begin polling
  client.getBlockNumber().then((currentBlock) => {
    if (stopped) return;
    fromBlock = currentBlock;

    intervalId = setInterval(async () => {
      if (stopped) return;
      try {
        const logs = await client.getLogs({
          address: tokenAddress,
          event: TRANSFER_EVENT,
          args: { to: depositAddress },
          fromBlock,
          toBlock: "latest",
        });

        if (logs.length > 0) {
          // Advance fromBlock to max block in results + 1
          const maxBlock = logs.reduce(
            (m, l) =>
              l.blockNumber != null && l.blockNumber > m ? l.blockNumber : m,
            fromBlock,
          );
          fromBlock = maxBlock + 1n;

          const first = logs[0];
          if (!stopped && first.transactionHash && first.args.from) {
            stopped = true;
            clearInterval(intervalId);
            onFound(first.transactionHash, first.args.from as string);
          }
        } else {
          // No logs: advance by 1 to avoid re-scanning the same block
          fromBlock = fromBlock + 1n;
        }
      } catch {
        // transient RPC error — continue polling next tick
      }
    }, 10_000);
  });

  return {
    stop() {
      stopped = true;
      if (intervalId != null) clearInterval(intervalId);
    },
  };
}

export async function getTokenBalance(params: {
  tokenAddress: `0x${string}`;
  walletAddress: `0x${string}`;
  chainId: number;
}): Promise<bigint> {
  const { tokenAddress, walletAddress, chainId } = params;
  const chain = CHAIN_MAP[chainId as keyof typeof CHAIN_MAP];
  if (!chain) throw new Error(`Unsupported chainId: ${chainId}`);
  const client = createPublicClient({ chain, transport: http() });
  return client.readContract({
    address: tokenAddress,
    abi: [parseAbiItem("function balanceOf(address) view returns (uint256)")],
    functionName: "balanceOf",
    args: [walletAddress],
  }) as Promise<bigint>;
}
