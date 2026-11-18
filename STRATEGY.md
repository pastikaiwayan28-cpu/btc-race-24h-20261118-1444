# BTC Race bot — deep-dip buyer + trailing stop

Entry for `btc-race-24h-20261118-1444` ("Race a BTC trading bot live for 24 hours"), built fresh for this race's dev window.

## Strategy

- **Enter** (all cash, long only): the close is at least 2.0% below the highest close of the last 90 bars.
- **Exit**: trailing stop 1.0% below the highest close since entry; hard stop 3.0% below the entry close.
- One position at a time, at most one order per bar, no re-entry on the same bar as an exit.

## Why

The dev window is not a range and not a steady trend: BTC opens $65,074, closes $63,261 (buy-and-hold −$31.63), with one sharp air pocket early on (down 2.5% to about $63,027), a slow climb back to roughly $64,950 by mid-day, then a long fade into the close. Frequent mean-reversion loses here — Bollinger and RSI bots that buy every oversold print finish $36 to $54 down, because in a window that keeps leaking lower the "oversold" prints keep getting cheaper, and the race-4 dip recipe (60-bar return below −1.0%) loses $4.95 on this window: its threshold is too shallow and it catches the falling knife. The money is in exactly one move, the early air pocket and the climb out of it, so this bot waits for a deep drawdown (2.0% from the 90-bar high) and then rides the recovery with a trailing stop.

## Local results (frozen 24h dev window, 1,440 bars)

- Net PnL **+$8.31** on $1,000, 2 trades, 1 round trip, win rate 100%, max drawdown 1.21%, fees $0.80 (kit `grade-local`, process driver).
- Neighbouring parameters all stay positive (drawdown 1.8–2.2% with trailing stop 0.8–1.2% give +$6.13 to +$11.59; window 90 and 120 bars give the same +$8.31 to +$8.40), so this is a plateau, not a spike.
- A 0.5% trailing stop was rejected as too tight (−$1.25: it chops the recovery before it runs); a 2.0% trailing stop gives back too much (+$3.05 at best, negative at a 2.0% drawdown).
- The bot needs 90 closes on record before it can trade, so it cannot act in the first hour and a half; the deep dip it waits for is a real capitulation, not minute noise.

## Implementation

`main.ts` (Node, stdlib only) + vendored `vendor/makefun-bars.ts` (the kit's line-protocol shim, byte-identical copy). Bigint arithmetic only — deterministic, no floats, no clock, no network, no files outside the repo.
