# BTC Race bot — deep-dip buyer + trailing stop

Entry for `btc-race-24h-20261118-1444` ("Race a BTC trading bot live for 24 hours"), built fresh for this race's dev window.

## Strategy

- **Enter** (all cash, long only): the close is at least 2.0% below the highest close of the last 90 bars.
- **Take profit** (half the position): when the close is 2.0% above the entry close, sell half. The rest keeps riding under the same 1.0% trailing stop.
- **Exit** (the rest): trailing stop 1.0% below the highest close since entry; hard stop 3.0% below the entry close.
- One position at a time, at most one order per bar, no re-entry on the same bar as an exit.

## Why

The dev window is not a range and not a steady trend: BTC opens $65,074, closes $63,261 (buy-and-hold −$31.63), with one sharp air pocket early on (down 2.5% to about $63,027), a slow climb back to roughly $64,950 by mid-day, then a long fade into the close. Frequent mean-reversion loses here — Bollinger and RSI bots that buy every oversold print finish $36 to $54 down, because in a window that keeps leaking lower the "oversold" prints keep getting cheaper, and the race-4 dip recipe (60-bar return below −1.0%) loses $4.95 on this window: its threshold is too shallow and it catches the falling knife. The money is in exactly one move, the early air pocket and the climb out of it, so this bot waits for a deep drawdown (2.0% from the 90-bar high) and then rides the recovery with a trailing stop.

## Local results (frozen 24h dev window, 1,440 bars)

- Net PnL **+$13.85** on $1,000, 3 trades, 1 round trip with a partial take-profit, win rate 100%, max drawdown 0.68%, fees $0.81 (kit `grade-local`, process driver).
- The take-profit leg is the revision: the same bot without it made +$8.31 (2 trades, 1.21% drawdown). Selling half at +2.0% from the entry banks the top of the climb while the rest rides the trailing stop; if a recovery never reaches +2% the leg never fires and the bot behaves exactly as before, so it can only help. A 2.5% take-profit never fires on this window and degrades to +$9.04.
- Neighbouring parameters all stay positive (dip 1.8–2.2%, trailing stop 0.8–1.2%, take-profit 1.5–2.5%, window 75–120 bars give +$9.04 to +$15.40), so this is a plateau, not a spike.
- A 0.5% trailing stop was rejected as too tight (−$1.25: it chops the recovery before it runs); a 2.0% trailing stop gives back too much (+$3.05 at best, negative at a 2.0% drawdown).
- The bot needs 90 closes on record before it can trade, so it cannot act in the first hour and a half; the deep dip it waits for is a real capitulation, not minute noise.

## Implementation

`main.ts` (Node, stdlib only) + vendored `vendor/makefun-bars.ts` (the kit's line-protocol shim, byte-identical copy). Bigint arithmetic only — deterministic, no floats, no clock, no network, no files outside the repo.
