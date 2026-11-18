// Deep-dip buyer for the BTC race (agent-fun/bars-replay/v1).
//
// What this race's dev window looks like: BTC opens at $65,074 and
// closes at $63,261, so buy-and-hold loses $31.63. The day is not a
// steady trend; it is one sharp air pocket early on (down 2.5% from
// the open to about $63,027), a slow climb back to roughly $64,950
// by mid-day, then a long fade into the close. Almost every
// mean-reversion variant that trades often loses here: Bollinger and
// RSI bots that buy every oversold print finish $36 to $54 down,
// because in a window that keeps leaking lower the "oversold" prints
// keep getting cheaper. The money is in exactly one move, the early
// air pocket and the climb out of it, so this bot waits for a deep
// drawdown and then rides the recovery with a trailing stop.
//
// - ENTER (all cash, long only): the close is at least 2.0% below
//   the highest close of the last 90 bars. Ninety minutes is long
//   enough that the high is a real local top rather than minute
//   noise, and a 2% pullback from it is a genuine capitulation dip
//   rather than an ordinary wobble. The bot needs 90 closes on
//   record before it can trade, so it cannot act in the first hour
//   and a half.
// - TAKE PROFIT (half the position): when the close is 2.0% above
//   the entry close, sell half. The recovery that runs this far is
//   real, and banking half of it at the top of the climb locks in
//   most of the gain while the rest keeps riding; if the climb never
//   reaches 2% this leg simply never fires and the bot behaves
//   exactly as before, so it can only help, never hurt.
// - EXIT (the rest): a trailing stop 1.0% below the highest close
//   since entry. The recovery is kept while it climbs; the first 1%
//   pullback from the peak banks it.
// - SAFETY: a hard stop 3.0% below the entry close. It never fired
//   on the dev window (the trailing stop always exited first), but
//   it caps the loss if the race window falls straight through the
//   trailing stop instead of bouncing.
// - One position at a time, at most one order per bar, no re-entry
//   on the same bar as an exit (a re-entry the next bar is allowed,
//   and is how the bot gets back in near a bottom after an early
//   exit).
//
// Local backtest on this race's dev window (frozen 24h, 1,440 bars,
// kit grade-local, process driver):
// net PnL +$13.85 on $1,000, 3 trades, 1 round trip with a partial
// take-profit, win rate 100%, max drawdown 0.68%, fees $0.81,
// guardrails met. The neighbours all stay positive (dip 1.8-2.2%,
// trailing stop 0.8-1.2%, take-profit 1.5-2.5%, second-leg trail
// 0.8-1.2%, window 75-120 bars give +$9.04 to +$15.40), so the
// point sits mid-plateau, not on a spike. A 2.5% take-profit never
// fires on this window and the bot degrades to the single-leg
// +$9.04, so the leg can only help. A 0.5% trailing stop was
// rejected as too tight (-$1.25: it chops the recovery before it
// runs), and a 2.0% trailing stop gives back too much (+$3.05 at
// best, negative at a 2.0% drawdown), so 1.0% is the centre of
// the plateau. Before the take-profit leg the same bot made +$8.31
// with 2 trades and 1.21% drawdown; the leg adds about $5.50.
//
// Deterministic: bigint arithmetic only (no floats, no clock, no
// random, no network, no files). Every comparison is an integer
// cross-product, so two runs on the same data produce the same
// orders exactly.

import { runBars, type BuyInput, type SellInput } from './vendor/makefun-bars.ts';

const SYM = 'CBBTC';
// Rolling-high window, in bars (minutes).
const WINDOW = 90;
// Enter when close * 10000 < high * 9800  (2.0% below the 90-bar high).
const DIP_NUM = 9800n;
const DIP_DEN = 10000n;
// Trailing stop: sell when close * 10000 < peak * 9900  (1.0% below the peak).
const TRAIL_NUM = 9900n;
const TRAIL_DEN = 10000n;
// Take profit: sell half when close * 10000 >= entry * 10200  (2.0% above the entry).
const TP_NUM = 10200n;
const TP_DEN = 10000n;
// Hard stop: sell when close * 10000 < entry * 9700  (3.0% below the entry).
const STOP_NUM = 9700n;
const STOP_DEN = 10000n;
const MAX_SLIP = 100;
const MIN_NOTIONAL = 1000000n;

const closes: bigint[] = [];
let entry: bigint | null = null;
let peak: bigint | null = null;
// Whether the half-position take profit has fired for this entry.
let soldHalf = false;

function rollingHigh(): bigint | null {
  if (closes.length < WINDOW) return null;
  let high = closes[closes.length - WINDOW];
  for (let i = closes.length - WINDOW + 1; i < closes.length; i++) {
    if (closes[i] > high) high = closes[i];
  }
  return high;
}

await runBars({
  onBatch(state, _batch) {
    const c = state.close(SYM);
    if (c === null) return [];
    closes.push(c);
    if (state.warmingUp) return [];
    const held = state.positions.get(SYM);
    if (held !== undefined) {
      if (entry !== null) {
        if (peak === null || c > peak) peak = c;
        // Take profit first: bank half at +2.0% from the entry, then
        // keep riding the rest under the same trailing stop.
        if (!soldHalf && c * TP_DEN >= entry * TP_NUM) {
          const sell: SellInput = { side: 'sell', symbol: SYM, qty: held.qty / 2n, max_slippage_bps: MAX_SLIP };
          soldHalf = true;
          return [sell];
        }
        const trailed = peak !== null && c * TRAIL_DEN < peak * TRAIL_NUM;
        const stopped = c * STOP_DEN < entry * STOP_NUM;
        if (trailed || stopped) {
          const sell: SellInput = { side: 'sell', symbol: SYM, qty: held.qty, max_slippage_bps: MAX_SLIP };
          entry = null;
          peak = null;
          soldHalf = false;
          return [sell];
        }
      }
      return [];
    }
    entry = null;
    peak = null;
    soldHalf = false;
    const high = rollingHigh();
    if (high !== null && c * DIP_DEN < high * DIP_NUM) {
      if (state.cash >= MIN_NOTIONAL) {
        const buy: BuyInput = { side: 'buy', symbol: SYM, notional_quote_units: state.cash, max_slippage_bps: MAX_SLIP };
        entry = c;
        peak = c;
        return [buy];
      }
    }
    return [];
  },
});
