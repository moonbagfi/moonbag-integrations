/**
 * The Moonbag split, client side. Mirrors the contract's integer math closely enough for display;
 * the contract remains the source of truth for every payout.
 */

const WAD = 10n ** 18n;

/** Share-tickets bought for `spendUsdg` (6 decimals) at `askUsdg` per full ticket. */
export function ticketsFor(spendUsdg: bigint, askUsdg: bigint): bigint {
  if (askUsdg <= 0n) return 0n;
  return (spendUsdg * WAD) / askUsdg;
}

/** USD a MOON ticket on one share is worth if the round settles at `price`. */
export function moonValueUsd(price: number, line: number): number {
  return Math.max(price - line, 0);
}

/**
 * The multiple a ticket returns at a hypothetical settlement price. 0 means the ticket expires.
 *
 * @example
 * moonMultiple(105, 102, 0.38) // about 7.9
 */
export function moonMultiple(price: number, line: number, askUsd: number): number {
  if (askUsd <= 0) return 0;
  return moonValueUsd(price, line) / askUsd;
}

/** The price a round must settle above for a ticket to return `multiple` times its cost. */
export function priceForMultiple(line: number, askUsd: number, multiple: number): number {
  return line + askUsd * multiple;
}
