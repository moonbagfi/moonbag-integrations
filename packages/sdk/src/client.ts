import type { Address, ApiError, Burn, BurnVaultView, Deposit, Fill, Position, Proof, Quote, Round } from "./types.js";
import { moonbagRoundsAbi } from "./abi.js";

export const DEFAULT_BASE_URL = "https://app.moonbag.fi/api";

export interface MoonbagClientConfig {
  /** Defaults to the production API. */
  baseUrl?: string;
  /** Bring your own fetch (tests, edge runtimes). Defaults to globalThis.fetch. */
  fetch?: typeof fetch;
  /** Per-request timeout in milliseconds. Default 10 000. */
  timeoutMs?: number;
}

/** Thrown for any `{ ok: false }` response or non-2xx status. */
export class MoonbagApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "MoonbagApiError";
  }
}

/**
 * Read-only client for the Moonbag public API. No key is needed: every endpoint is public, and
 * every value that matters (round state, positions, payouts) is read from the contract.
 */
export class MoonbagClient {
  private readonly base: string;
  private readonly fetcher: typeof fetch;
  private readonly timeoutMs: number;

  constructor(config: MoonbagClientConfig = {}) {
    this.base = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.fetcher = config.fetch ?? globalThis.fetch.bind(globalThis);
    this.timeoutMs = config.timeoutMs ?? 10_000;
  }

  /** Every round, newest first. `live` is false before contract addresses are published. */
  rounds() {
    return this.get<{ live: boolean; chainId: number; contract: Address | null; now: number; rounds: Round[] }>("/rounds");
  }

  /** Open rounds whose sales have not closed yet, soonest settlement first. */
  async openRounds(): Promise<Round[]> {
    const { rounds, now } = await this.rounds();
    return rounds.filter((r) => r.state === "OPEN" && r.salesCloseAt > now).sort((a, b) => a.settleAt - b.settleAt);
  }

  /** One round with its fills, deposits and settlement proof. */
  round(id: number) {
    return this.get<{ now: number; round: Round; fills: Fill[]; deposits: Deposit[]; proof: Proof | null; indexed: boolean }>(`/rounds/${id}`);
  }

  /** A signed quote for one round. Valid for seconds; fetch it right before the wallet prompt. */
  async quote(round: number): Promise<Quote> {
    const res = await this.get<{ quote: Quote }>(`/quote?round=${round}`);
    return res.quote;
  }

  /** Every settled or void round with its proof. */
  settlements() {
    return this.get<{ indexed: boolean; settlements: (Round & { proof: Proof | null })[] }>("/settlements");
  }

  /** Burn vault totals from the chain and every indexed burn. */
  burns() {
    return this.get<{ vault: Address | null; burn: BurnVaultView | null; burns: Burn[]; indexed: boolean }>("/burns");
  }

  /** A wallet's positions, balances and allowances, read from the chain. */
  positions(wallet: Address) {
    return this.get<{ live: boolean; contract?: Address; now?: number; positions: Position[]; balances: Record<string, string>; allowances: Record<string, string> }>(
      `/positions?wallet=${wallet}`,
    );
  }

  /**
   * Arguments for viem's `writeContract` to buy MOON with a fresh quote. The caller must have
   * approved USDG to the rounds contract for at least the premium.
   */
  static buyMoonCall(contract: Address, quote: Quote, tickets: bigint) {
    return {
      address: contract,
      abi: moonbagRoundsAbi,
      functionName: "buyMoon" as const,
      args: [
        BigInt(quote.round),
        tickets,
        { round: BigInt(quote.round), askUsdg: BigInt(quote.askUsdg), expiry: BigInt(quote.expiry) },
        quote.signature,
      ] as const,
    };
  }

  private async get<T>(path: string): Promise<T> {
    const res = await this.fetcher(this.base + path, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    const body = (await res.json().catch(() => ({ ok: false, error: "invalid JSON" }))) as ({ ok: true } & T) | ApiError;
    if (!res.ok || body.ok === false) {
      throw new MoonbagApiError(body.ok === false ? body.error : `HTTP ${res.status}`, res.status);
    }
    return body as T;
  }
}
