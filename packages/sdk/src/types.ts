/** Shapes returned by https://app.moonbag.fi/api. Big numbers travel as decimal strings. */

export type Address = `0x${string}`;
export type Hex = `0x${string}`;
export type Duration = "1D" | "1W";
export type Source = "TWAP" | "CHAINLINK";
export type RoundState = "OPEN" | "SETTLED" | "VOID";

/** One round as the contract holds it, plus a few derived USD figures for display. */
export interface Round {
  id: number;
  stock: Address;
  symbol: "SPY" | "NVDA" | null;
  duration: Duration;
  source: Source;
  state: RoundState;
  openAt: number; // unix seconds
  salesCloseAt: number;
  settleAt: number;
  line: string; // WAD USD per raw share
  lineUsd: number;
  multiplierAtOpen: string;
  cap: string; // raw shares
  shares: string; // raw shares deposited by FLOOR
  moonSold: string; // raw share-tickets sold
  unsold: string;
  premiumHeld: string; // USDG, 6 decimals
  feeHeld: string;
  settlePrice: string; // WAD, "0" until settled
  settleUsd: number;
  moonFrac: string; // WAD share of a share that MOON takes
  fillPct: number;
  spotUsd: number | null;
}

/** A signed MOON quote. Pass `round`, `askUsdg`, `expiry` and `signature` to buyMoon unchanged. */
export interface Quote {
  round: string;
  askUsdg: string; // USDG (6 decimals) per one full share-ticket (1e18)
  expiry: string; // unix seconds, at most 120 s ahead
  signature: Hex;
  spot: number; // USD per raw share
  line: number;
  ask: number; // USD per share-ticket
  askPctOfShare: number;
  probAbove: number; // the model's chance of settling above the line
  sigma: number;
}

export interface Fill {
  buyer: Address;
  tickets: string;
  ask_usdg: string;
  premium: string;
  fee: string;
  tx_hash: Hex;
  ts: string;
}

export interface Deposit {
  holder: Address;
  shares: string;
  tx_hash: Hex;
  ts: string;
}

export interface Proof {
  created_tx: Hex | null;
  settled_tx: Hex | null;
  settle_ref: string | null; // feed round id (1W) or feed print time (1D breaker)
  void_reason: string | null;
}

export interface Position {
  round: Round;
  floorShares: string;
  moonTickets: string;
  moonPaid: string;
  floorRedeemed: boolean;
  moonRedeemed: boolean;
}

export interface BurnVaultView {
  bound: boolean;
  token: Address;
  budget: string;
  lastBurnAt: number;
  nextBurnAt: number;
  totalBurns: number;
  totalUsdgSpent: string;
  totalBurned: string;
  totalPaidToCallers: string;
  minBurn: string;
  tokenSupply: string | null;
}

export interface Burn {
  tx_hash: Hex;
  ts: string;
  caller: Address;
  usdg_in: string;
  eth_out: string;
  eth_spent: string;
  caller_paid: string;
  burned: string;
}

export interface ApiError {
  ok: false;
  error: string;
}
