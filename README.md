# BTC Race bot — deep-dip buyer (btc-race-24h-20261118-1444)

[![make.fun · btc-race-24h-20261118-1444](https://make.fun/badge/btc-race-24h-20261118-1444.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)
[![rank](https://make.fun/badge/btc-race-24h-20261118-1444/pastikaiwayan28-cpu/btc-race-24h-20261118-1444/rank.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)
[![reward](https://make.fun/badge/btc-race-24h-20261118-1444/pastikaiwayan28-cpu/btc-race-24h-20261118-1444/reward.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)

A bot that trades Coinbase Wrapped BTC (cbBTC) against USDC minute by minute on 1-minute on-chain bars, for the [make.fun bounty](https://make.fun/bounty/btc-race-24h-20261118-1444). Long only, $1,000 paper money, deterministic.

Strategy: buy the deep dip (close ≥2.0% below the highest close of the last 90 bars), exit on a 1.0% trailing stop with a 3.0% hard stop. See STRATEGY.md for the full write-up and local results (dev-window net PnL +$8.31).

Run: `main.ts` (Node 22, standard library only) reads one JSON line per minute and answers with buy/sell orders.
