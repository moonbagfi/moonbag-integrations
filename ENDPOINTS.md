# Moonbag Public API: Endpoint Reference

**Base URL:** `https://app.moonbag.fi/api`
**Format:** JSON over HTTPS. Every response is `no-store`.
**Authentication:** none. Every endpoint is public and read-only, except the paper-mode `POST`,
which identifies a player with an httpOnly cookie and moves no funds.

The API is a window onto the contract. Round state, positions and payouts are read from
`MoonbagRounds` on every request. Fills, deposits, settlement transactions and burns come from an
indexed copy of contract events; when that copy is unavailable, responses carry `indexed: false`
and the on-chain fields still answer.

---

## Conventions

### Envelope

Success:

```json
{ "ok": true, "...": "endpoint fields" }
```

Error:

```json
{ "ok": false, "error": "round required" }
```

### Units

| Field kind | Unit | Example |
|---|---|---|
| `line`, `settlePrice`, `moonFrac`, `multiplierAtOpen` | WAD (1e18) as a decimal string | `"230370000000000000000"` |
| `shares`, `moonSold`, `cap`, `tickets` | Raw stock-token units (18 decimals) as a string | `"1000000000000000000"` |
| `premiumHeld`, `feeHeld`, `askUsdg`, `premium` | USDG, 6 decimals, as a string | `"850000"` |
| `lineUsd`, `settleUsd`, `spotUsd`, `spot`, `ask` | Plain USD numbers for display | `230.37` |
| Times (`openAt`, `settleAt`, `now`, `expiry`) | Unix seconds | `1790000000` |

A share-ticket is priced per RAW share. The stock's UI multiplier only changes what wallets
display; pools and the contract price raw units directly.

### Pre-launch

Before contract addresses are published, `live` is `false`, `rounds` is empty and `contract` is
`null`. Integrations should render a pre-launch state from that flag, never from an empty list alone.

### Rate limits

| Endpoint | Limit per client |
|---|---|
| `GET /quote` | 120 requests a minute |
| `POST /paper` | 30 requests a minute |
| Everything else | Edge limits only |

A limited request returns `429` with `{ "ok": false, "error": "slow down" }`.

### Status codes

| Code | Meaning |
|---|---|
| 200 | Success |
| 400 | Bad or missing parameter |
| 404 | No such round |
| 429 | Rate limited |
| 503 | A dependency is down (quote signer, history store). On-chain actions still work from any wallet |

---

## GET /rounds

Every round, newest first.

**Response**

| Field | Type | Description |
|---|---|---|
| `live` | boolean | Contract addresses are configured |
| `chainId` | number | `4663` on mainnet |
| `contract` | string \| null | `MoonbagRounds` address |
| `now` | number | Chain time in seconds |
| `rounds` | Round[] | See the Round object |

**Example**

```bash
curl -s https://app.moonbag.fi/api/rounds | jq '.rounds[0]'
```

```json
{
  "id": 12,
  "stock": "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC",
  "symbol": "NVDA",
  "duration": "1D",
  "source": "TWAP",
  "state": "OPEN",
  "openAt": 1790001200,
  "salesCloseAt": 1790074800,
  "settleAt": 1790078400,
  "line": "230370000000000000000",
  "lineUsd": 230.37,
  "multiplierAtOpen": "1000000000000000000",
  "cap": "160000000000000000000",
  "shares": "100000000000000000000",
  "moonSold": "62000000000000000000",
  "unsold": "38000000000000000000",
  "premiumHeld": "47430000",
  "feeHeld": "5270000",
  "settlePrice": "0",
  "settleUsd": 0,
  "moonFrac": "0",
  "fillPct": 62.5,
  "spotUsd": 225.85
}
```

*Figures are illustrative.*

### The Round object

| Field | Type | Description |
|---|---|---|
| `id` | number | Round id in the contract |
| `stock` | address | Stock token |
| `symbol` | `"SPY"` \| `"NVDA"` \| null | Known symbol |
| `duration` | `"1D"` \| `"1W"` | Derived from the source |
| `source` | `"TWAP"` \| `"CHAINLINK"` | Settlement source |
| `state` | `"OPEN"` \| `"SETTLED"` \| `"VOID"` | Lifecycle |
| `openAt`, `salesCloseAt`, `settleAt` | number | Unix seconds |
| `line`, `lineUsd` | string, number | The line |
| `multiplierAtOpen` | string | Stock multiplier recorded at creation |
| `cap`, `shares`, `moonSold`, `unsold` | string | Raw shares |
| `premiumHeld`, `feeHeld` | string | USDG held for FLOOR and for the burn |
| `settlePrice`, `settleUsd` | string, number | `0` until settled |
| `moonFrac` | string | WAD share of a share MOON takes |
| `fillPct` | number | Deposited shares as % of cap |
| `spotUsd` | number \| null | Pool spot now |

---

## GET /rounds/{id}

One round with its fills, deposits and proof.

**Parameters**

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | Yes | Round id, 0 to 999,999,999 |

**Response**

| Field | Type | Description |
|---|---|---|
| `now` | number | Chain time |
| `round` | Round | As above |
| `fills` | Fill[] | Up to 200, newest first: `buyer`, `tickets`, `ask_usdg`, `premium`, `fee`, `tx_hash`, `ts` |
| `deposits` | Deposit[] | Up to 200: `holder`, `shares`, `tx_hash`, `ts` |
| `proof` | object \| null | `created_tx`, `settled_tx`, `settle_ref`, `void_reason` |
| `indexed` | boolean | History available |

**Errors:** `400 bad id`, `404 no such round`.

---

## GET /quote

A signed MOON quote for one round, relayed unchanged from the quote signer. The web tier never
holds the signing key.

**Parameters**

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `round` | query | integer | Yes | Round id |

**Response**

```json
{
  "ok": true,
  "quote": {
    "round": "12",
    "askUsdg": "852000",
    "expiry": "1790040030",
    "signature": "0x…",
    "spot": 225.85,
    "line": 230.37,
    "ask": 0.852,
    "askPctOfShare": 0.00377,
    "probAbove": 0.22,
    "sigma": 0.5
  }
}
```

| Field | Description |
|---|---|
| `askUsdg` | USDG (6 decimals) per one full share-ticket |
| `expiry` | Unix seconds; the contract refuses expired quotes and any quote living longer than 120 s |
| `signature` | EIP-712 over `Quote(uint256 round,uint256 askUsdg,uint64 expiry)`, domain `Moonbag` v`1`, chain 4663 |
| `probAbove` | The pricing model's chance of settling above the line. Informational |

**On-chain bounds.** `buyMoon` rejects an ask below intrinsic value (spot minus line), below 0.01%
of spot or above 20% of spot, whatever the signature says.

**Errors:** `400 round required`, `429 slow down`, `503` when the quote signer is unreachable
(rounds are read-only until it returns).

**Buying.** Approve USDG to the rounds contract for `tickets × askUsdg / 1e18`, then call:

```
buyMoon(round, tickets, (round, askUsdg, expiry), signature)
```

Fetch the quote immediately before the wallet prompt. A quote is good for seconds.

---

## GET /positions

A wallet's positions, balances and allowances, read from the chain. Nothing is stored.

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `wallet` | query | address | Yes | `0x` + 40 hex |

**Response:** `live`, `contract`, `now`, `positions[]` (`round`, `floorShares`, `moonTickets`,
`moonPaid`, `floorRedeemed`, `moonRedeemed`), `balances` (USDG and each stock), `allowances`.

**Errors:** `400 wallet required`.

---

## GET /settlements

Every settled or void round with its proof: settlement price, source and, when indexed, the settle
transaction and feed reference.

**Response:** `indexed`, `settlements[]` (Round plus `proof`).

---

## GET /burns

The burn board.

**Response**

| Field | Description |
|---|---|
| `vault` | `BurnVault` address |
| `burn` | Lifetime view: `bound`, `token`, `budget`, `lastBurnAt`, `nextBurnAt`, `totalBurns`, `totalUsdgSpent`, `totalEthSpent`, `totalBurned`, `totalPaidToCallers`, `minBurn`, `tokenSupply` |
| `burns` | Up to 100 indexed burns: `tx_hash`, `ts`, `caller`, `usdg_in`, `eth_out`, `eth_spent`, `caller_paid`, `burned` |

---

## GET /board

Leaderboards from the indexed history.

| Field | Description |
|---|---|
| `best` | Top 20 fills by multiple on settled rounds. Self-fills (MOON bought on a round the same wallet deposited into) are excluded |
| `most` | Top 20 wallets by rounds played, then premium |
| `paper` | Top 20 paper players by XP |
| `burns`, `burn` | As in `/burns` |

---

## Paper mode

A ticket on a real round with pretend USDG and no wallet. Each player starts with 1,000 paper USDG.
Results settle from the round's on-chain price. Paper mode pays XP and cosmetics only, never tokens.

### GET /paper

Returns `available`, the player (`id` prefix, `xp`, `wins`, `tickets`, `name`, `balance`) and up to
100 tickets. Sets the player cookie on first visit.

### POST /paper

```json
{ "round": 12, "spend": 25 }
```

| Field | Type | Rule |
|---|---|---|
| `round` | integer | An OPEN round |
| `spend` | number | 1 to 200 paper USDG, within the player's balance |

**Response:** `{ ok, id, tickets, askUsdg, round }`.
**Errors:** `400` (bad input, round not open, balance too low), `429`, `503` (no quote or no history store).

---

## Planned

| Endpoint | Purpose |
|---|---|
| `GET /treasury` | Treasury FLOOR positions and results |
| Widget embed | A buy button beside any ticker; integrators may add their own fee of 0 to 0.5% on top, with Moonbag's fee and burn unchanged |
| Bulk history | Research exports on a flat plan |
