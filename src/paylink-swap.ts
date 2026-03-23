import {
  BTC_LIGHTNING_INFO,
  Client,
  IdbSwapStorage,
  IdbWalletStorage,
  Signer,
  type TokenInfo,
} from "@lendasat/lendaswap-sdk-pure";
import { createPublicClient, erc20Abi, http } from "viem";
import { polygon, arbitrum, mainnet } from "viem/chains";

const DEFAULT_BASE_URL = "https://api.lendaswap.com";

let clientPromise: Promise<{ client: Client; mnemonic: string | null }> | null =
  null;

function getBaseUrl(): string {
  const fromWindow =
    typeof window !== "undefined" &&
    (window as unknown as { LENDASWAP_API_URL?: string }).LENDASWAP_API_URL;
  return fromWindow || DEFAULT_BASE_URL;
}

function getApiKey(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { LENDASWAP_API_KEY?: string })
    .LENDASWAP_API_KEY;
}

async function buildClient(): Promise<{
  client: Client;
  mnemonic: string | null;
}> {
  const walletStorage = new IdbWalletStorage();
  const swapStorage = new IdbSwapStorage();

  const apiKey = getApiKey();

  let builder = Client.builder()
    .withBaseUrl(getBaseUrl())
    .withSignerStorage(walletStorage)
    .withSwapStorage(swapStorage);

  if (apiKey) {
    builder = builder.withApiKey(apiKey);
  }

  try {
    const client = await builder.build();
    const mnemonic =
      typeof client.getMnemonic === "function" ? client.getMnemonic() : null;

    await client.getVersion();
    return { client, mnemonic };
  } catch (err) {
    const signer = Signer.generate();
    let recoveryBuilder = Client.builder()
      .withBaseUrl(getBaseUrl())
      .withSignerStorage(walletStorage)
      .withSwapStorage(swapStorage)
      .withMnemonic(signer.mnemonic);

    if (apiKey) {
      recoveryBuilder = recoveryBuilder.withApiKey(apiKey);
    }
    const client = await recoveryBuilder.build();

    await client.getVersion();
    return { client, mnemonic: signer.mnemonic };
  }
}

async function getClient(): Promise<{
  client: Client;
  mnemonic: string | null;
}> {
  if (!clientPromise) {
    clientPromise = buildClient();
  }
  return clientPromise;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  task: () => Promise<T>,
  options?: { retries?: number; baseDelayMs?: number; maxDelayMs?: number },
): Promise<T> {
  const retries = options?.retries ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 2000;
  const maxDelayMs = options?.maxDelayMs ?? 15000;

  let attempt = 0;
  while (true) {
    try {
      return await task();
    } catch (err) {
      attempt += 1;
      if (attempt > retries) {
        throw err;
      }
      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      await sleep(delay);
    }
  }
}

export async function createSwap(params: {
  sourceAsset: TokenInfo;
  targetAddress: string;
}): Promise<unknown> {
  const { client } = await getClient();
  return withRetry(
    () =>
      client.createSwap({
        sourceAsset: params.sourceAsset,
        targetAsset: BTC_LIGHTNING_INFO,
        targetAddress: params.targetAddress,
        gasless: true,
      }),
    { retries: 3 },
  );
}

export async function getSwap(swapId: string): Promise<unknown> {
  const { client } = await getClient();
  return withRetry(() => client.getSwap(swapId), { retries: 3 });
}

export async function fundSwapGasless(swapId: string): Promise<unknown> {
  const { client } = await getClient();
  return withRetry(() => client.fundSwapGasless(swapId), { retries: 3 });
}

export async function getMnemonic(): Promise<string | null> {
  const { mnemonic } = await getClient();
  return mnemonic ?? null;
}

// ── chain map for balance polling ─────────────────────────────────────

const CHAIN_MAP: Record<
  number,
  typeof mainnet | typeof polygon | typeof arbitrum
> = {
  1: mainnet,
  137: polygon,
  42161: arbitrum,
};

export async function getTokenBalance(params: {
  tokenAddress: `0x${string}`;
  walletAddress: `0x${string}`;
  chainId: number;
}): Promise<bigint> {
  const chain = CHAIN_MAP[params.chainId];
  if (!chain) throw new Error(`Unsupported chainId: ${params.chainId}`);
  const publicClient = createPublicClient({ chain, transport: http() });
  return publicClient.readContract({
    address: params.tokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [params.walletAddress],
  }) as Promise<bigint>;
}

// ── refund exports ────────────────────────────────────────────────────

export async function collabRefundEvmSwap(swapId: string): Promise<unknown> {
  const { client } = await getClient();
  return withRetry(() => client.collabRefundEvmSwap(swapId, "swap-back"), {
    retries: 2,
  });
}

export async function refundSwapTimeout(swapId: string): Promise<unknown> {
  const { client } = await getClient();
  // returns evmRefundData with { to, data, timelockExpired, timelockExpiry }
  return client.refundSwap(swapId, { mode: "swap-back", collaborative: false });
}
