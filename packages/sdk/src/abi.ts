/** The MoonbagRounds functions an integrator needs to write. Reads go through the API. */
export const moonbagRoundsAbi = [
  {
    type: "function",
    name: "buyMoon",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "uint256" },
      { name: "tickets", type: "uint256" },
      {
        name: "q",
        type: "tuple",
        components: [
          { name: "round", type: "uint256" },
          { name: "askUsdg", type: "uint256" },
          { name: "expiry", type: "uint64" },
        ],
      },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "redeemMoon",
    stateMutability: "nonpayable",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [
      { name: "sharesOut", type: "uint256" },
      { name: "refundOut", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "deposit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "uint256" },
      { name: "shares", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "redeemFloor",
    stateMutability: "nonpayable",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [
      { name: "sharesOut", type: "uint256" },
      { name: "premiumOut", type: "uint256" },
    ],
  },
] as const;
