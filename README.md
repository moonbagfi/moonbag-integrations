<div align="center">

# moonbag-integrations

**Put a Moonbag ticket next to any ticker.**

The public API reference and a typed TypeScript client for wallets, extensions and dashboards
that want live rounds, signed quotes, settlement proofs and the burn board.

![API](https://img.shields.io/badge/API-public%20%C2%B7%20read--only-C1F741?style=flat-square&labelColor=184A4E)
![SDK](https://img.shields.io/badge/SDK-TypeScript-184A4E?style=flat-square)
![Chain](https://img.shields.io/badge/chain-Robinhood%20Chain%204663-184A4E?style=flat-square)
![Status](https://img.shields.io/badge/status-pre--launch-F3EEDC?style=flat-square&labelColor=0A0B0D)

[App](https://app.moonbag.fi) · [Docs](https://moonbag.fi/docs) · [Endpoint reference](ENDPOINTS.md) · [X](https://x.com/moonbagfi)

</div>

---

## What you can build

| Surface | Endpoints | Example |
|---|---|---|
| A ticket beside a ticker | `/rounds`, `/quote` | "NVDA 1D · line +2% · MOON $0.85 · 8.0x at +5%" |
| A settlement feed | `/settlements` | Every round's price, source and settle tx |
| A burn tracker | `/burns` | $MOONBAG burned per day, with the tx of each burn |
| A portfolio row | `/positions?wallet=` | FLOOR and MOON positions, redeemable or not |
| A leaderboard | `/board` | Best multiples, most rounds, paper XP |

## Authentication

None. The API is public and read-only. Buying and redeeming happen in the user's own wallet
against the contract; the API only supplies the round data and the signed quote.

## Quick Start

```bash
git clone https://github.com/moonbagfi/moonbag-integrations.git
cd moonbag-integrations
npm install
npm run typecheck
npm run example
```

Or straight over HTTP:

```bash
curl -s https://app.moonbag.fi/api/rounds | jq '{live, count: (.rounds | length)}'
curl -s "https://app.moonbag.fi/api/quote?round=0" | jq '.quote | {ask, line, expiry}'
```

## Using the client

```ts
import { MoonbagClient, moonMultiple, ticketsFor } from "@moonbagfi/sdk";

const moonbag = new MoonbagClient();

const [next] = await moonbag.openRounds();
const q = await moonbag.quote(next.id);

// what a $25 ticket buys, and what it returns if the stock settles 5% up
const tickets = ticketsFor(25_000_000n, BigInt(q.askUsdg));
const at5 = moonMultiple(q.spot * 1.05, q.line, q.ask);
```

### Buying MOON with viem

```ts
import { createWalletClient, custom } from "viem";
import { MoonbagClient } from "@moonbagfi/sdk";

const { contract } = await moonbag.rounds();
const q = await moonbag.quote(roundId);          // fetch right before the prompt: valid for seconds
const call = MoonbagClient.buyMoonCall(contract!, q, tickets);

// USDG must be approved to `contract` for tickets * askUsdg / 1e18 first
await wallet.writeContract({ ...call, account });
```

The contract checks the quote itself: signature, round, expiry, a lifetime of at most 120 s, and
price bounds against the pool's spot. A quote that fails any check reverts before USDG moves.

## Integration rules

- **Render pre-launch from `live: false`.** Before contract addresses are published there are no
  rounds, and an empty list alone must not look like a broken integration.
- **Treat strings as integers.** Share amounts, WAD prices and USDG values are decimal strings.
  Convert with `BigInt`, never `Number`, before math that reaches a transaction.
- **Never cache a quote.** Request one per purchase.
- **Show the maximum loss.** Every ticket display should carry "max loss: the ticket" or
  equivalent. A MOON ticket can expire worthless.
- **Link the proof.** Settlement and burn displays should link the transaction on
  [robin.etherscan.io](https://robin.etherscan.io).

## Layout

```
packages/sdk/src/
├── index.ts        public exports
├── client.ts       MoonbagClient: rounds, openRounds, round, quote, settlements, burns, positions, buyMoonCall
├── payoff.ts       ticketsFor, moonValueUsd, moonMultiple, priceForMultiple
├── abi.ts          the MoonbagRounds write functions an integrator needs
└── types.ts        Round, Quote, Fill, Deposit, Proof, Position, Burn, BurnVaultView
examples/
└── basic-usage.ts  open rounds, live asks and multiples at +1%, +3%, +5%
ENDPOINTS.md        full endpoint reference
```

## Planned

| Item | State |
|---|---|
| Embeddable buy widget with an integrator fee of 0 to 0.5% on top | Phase 4 |
| `GET /treasury` | Phase 2 |
| Bulk settlement history for research | Phase 4 |

## Reference links

| Resource | Link |
|---|---|
| Endpoint reference | [ENDPOINTS.md](ENDPOINTS.md) |
| Contracts | [moonbag-substrate](../moonbag-substrate) |
| Threat model | [moonbag-treatise/THREAT_MODEL.md](../moonbag-treatise/THREAT_MODEL.md) |
| App | [app.moonbag.fi](https://app.moonbag.fi) |

---

<div align="center">
<sub>Moonbag is experimental software on Robinhood Chain. Nothing here is financial, investment, legal or tax advice. MOON tickets can expire worthless; the most a buyer can lose is the ticket. Integrators are responsible for how they present Moonbag rounds to their own users.</sub>
</div>
