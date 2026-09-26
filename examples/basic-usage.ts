/**
 * Print every open Moonbag round with its live ask and what a ticket returns at a few prices.
 *   npx tsx examples/basic-usage.ts
 */
import { MoonbagClient, moonMultiple, priceForMultiple } from "../packages/sdk/src/index.js";

const moonbag = new MoonbagClient();

const { live } = await moonbag.rounds();
if (!live) {
  console.log("Moonbag is in pre-launch: contracts are not published yet.");
  process.exit(0);
}

for (const r of await moonbag.openRounds()) {
  const q = await moonbag.quote(r.id);
  const closesIn = Math.max(0, r.salesCloseAt - Math.floor(Date.now() / 1000));
  console.log(`\n${r.symbol} ${r.duration} · line $${q.line.toFixed(2)} · spot $${q.spot.toFixed(2)} · sales close in ${Math.round(closesIn / 60)} min`);
  console.log(`  ask $${q.ask.toFixed(4)} per share-ticket (${(q.askPctOfShare * 100).toFixed(3)}% of a share)`);
  for (const move of [0.01, 0.03, 0.05]) {
    const price = q.spot * (1 + move);
    console.log(`  settles +${(move * 100).toFixed(0)}% → ${moonMultiple(price, q.line, q.ask).toFixed(1)}x`);
  }
  console.log(`  breaks even above $${priceForMultiple(q.line, q.ask, 1).toFixed(2)}`);
}
