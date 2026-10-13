// Lab 4's Stackelberg security game, and everything needed to solve it.
//
// Pure TypeScript, no React, for the same reason gameTree.ts is: the maths is
// the part that has to be right, and keeping it out of a component means it can
// be exercised directly rather than only through the UI.
//
// The game, from the whiteboard:
//
//                      ( E )
//            e1=2 ╱     e2=1 │     e3=1 ╲
//            ┌────┐      ┌────┐      ┌────┐
//            │ T1 │      │ T2 │      │ T3 │
//            │  8 │      │  6 │      │  4 │
//            └────┘      └────┘      └────┘
//
// The DEFENDER is the Stackelberg leader. They commit, publicly and in advance,
// to a probability of covering each target with a honeypot. The ATTACKER is the
// follower: they see those probabilities (but not where the honeypot actually
// landed) and then pick one target to hit.

export interface Target {
  id: string;
  /** What the target is worth, and therefore the damage if it is taken. */
  value: number;
  /** What the attacker pays to reach it, win or lose. */
  exploitCost: number;
}

export interface GameSetup {
  targets: Target[];
  /** The defender's cost of deploying the honeypot, paid either way. */
  honeypotCost: number;
}

/** A defender commitment: one coverage probability per target, summing to 1. */
export type Coverage = number[];

// The instance the Example walks through, exactly as drawn on the whiteboard.
export const EXAMPLE_GAME: GameSetup = {
  targets: [
    { id: "T1", value: 8, exploitCost: 2 },
    { id: "T2", value: 6, exploitCost: 1 },
    { id: "T3", value: 4, exploitCost: 1 },
  ],
  honeypotCost: 1,
};

export const totalValue = (game: GameSetup): number =>
  game.targets.reduce((sum, target) => sum + target.value, 0);

// ---------------------------------------------------------------------------
// Payoffs for a single outcome
// ---------------------------------------------------------------------------
//
//   Ua = Di - Cei          damage taken minus the cost of the exploit
//   Ud = SUM(V) - Di - Ch  total asset value minus damage minus honeypot cost
//
// The hinge of the whole lab is that covering a target sets Di to 0 while the
// attacker still pays Cei. Protection does not refund a failed attack, which is
// why coverage can make a target unattractive without being certain.

/** Attacker's payoff at target `i`, given whether it turned out to be covered. */
export const attackerPayoff = (
  game: GameSetup,
  i: number,
  covered: boolean,
): number => {
  const target = game.targets[i];
  const damage = covered ? 0 : target.value;
  return damage - target.exploitCost;
};

/** Defender's payoff when target `i` is attacked, given whether it was covered. */
export const defenderPayoff = (
  game: GameSetup,
  i: number,
  covered: boolean,
): number => {
  const damage = covered ? 0 : game.targets[i].value;
  return totalValue(game) - damage - game.honeypotCost;
};

// ---------------------------------------------------------------------------
// Expected payoffs under a commitment
// ---------------------------------------------------------------------------
//
// Both expectations are linear in that target's own coverage, which is what
// lets them be written as a single line each:
//
//   EUa(Ti) = xi·(covered) + (1-xi)·(uncovered)  =  intercept + slope·xi
//
// For the Example that gives EUa = 6-8x1, 5-6x2, 3-4x3 and
// EUd = 9+8x1, 11+6x2, 13+4x3, matching the whiteboard.

export interface LineForm {
  /** Value when this target has zero coverage. */
  intercept: number;
  /** How much one unit of coverage moves it. Negative for the attacker. */
  slope: number;
}

export const attackerLine = (game: GameSetup, i: number): LineForm => {
  const uncovered = attackerPayoff(game, i, false);
  const covered = attackerPayoff(game, i, true);
  return { intercept: uncovered, slope: covered - uncovered };
};

export const defenderLine = (game: GameSetup, i: number): LineForm => {
  const uncovered = defenderPayoff(game, i, false);
  const covered = defenderPayoff(game, i, true);
  return { intercept: uncovered, slope: covered - uncovered };
};

export const attackerEU = (
  game: GameSetup,
  coverage: Coverage,
  i: number,
): number => {
  const line = attackerLine(game, i);
  return line.intercept + line.slope * coverage[i];
};

export const defenderEU = (
  game: GameSetup,
  coverage: Coverage,
  i: number,
): number => {
  const line = defenderLine(game, i);
  return line.intercept + line.slope * coverage[i];
};

// Floating point shows up the moment coverage stops being a round number, and
// the equalizer lands on 23/52, so comparisons need a tolerance.
const EPS = 1e-9;

/**
 * Every target the attacker is willing to hit: those whose expected payoff ties
 * for the maximum. Usually one, but at the defender's optimum it is all of
 * them, which is the point of the optimum.
 */
export const bestResponses = (
  game: GameSetup,
  coverage: Coverage,
): number[] => {
  const values = game.targets.map((_, i) => attackerEU(game, coverage, i));
  const best = Math.max(...values);
  return values
    .map((value, i) => ({ value, i }))
    .filter((entry) => entry.value > best - EPS)
    .map((entry) => entry.i);
};

/**
 * The single target the attacker takes, under the **Strong Stackelberg**
 * convention: when the follower is indifferent they break the tie in the
 * leader's favor.
 *
 * This is not a detail we can leave implicit. At the defender's optimum the
 * attacker is indifferent across every target BY CONSTRUCTION, so without a
 * stated tie-breaking rule the question "which target do they hit" has no
 * answer exactly where the lab is trying to land. The usual justification is
 * that the leader can always shift an arbitrarily small amount of coverage to
 * make the favorable target strictly best, so the favorable tie-break is the
 * limit of strategies the leader really does have.
 */
export const attackedTarget = (
  game: GameSetup,
  coverage: Coverage,
): number => {
  const candidates = bestResponses(game, coverage);
  return candidates.reduce((a, b) =>
    defenderEU(game, coverage, b) > defenderEU(game, coverage, a) ? b : a,
  );
};

/** What the defender ends up with once the attacker has responded. */
export const defenderOutcome = (
  game: GameSetup,
  coverage: Coverage,
): { target: number; value: number } => {
  const target = attackedTarget(game, coverage);
  return { target, value: defenderEU(game, coverage, target) };
};

// ---------------------------------------------------------------------------
// Solving for the defender's best commitment
// ---------------------------------------------------------------------------

/**
 * The coverage that leaves the attacker exactly indifferent between every
 * target, i.e. the solution to
 *
 *   EUa(T1) = EUa(T2) = ... = v,   SUM(xi) = 1
 *
 * Writing each xi in terms of the common value v gives
 * `xi = (intercept_i - v) / (-slope_i)`, and the constraint that they sum to 1
 * pins v down. Every xi is linear in v and decreasing in it, so the sum is
 * strictly decreasing and there is exactly one v that works; the bisection
 * below just finds it without needing the algebra written out per game size.
 *
 * Returns null when the answer is not a valid distribution, which happens when
 * a target is unattractive enough that its equalizing share comes out negative.
 * That case needs the target dropped and the rest re-solved, so callers must
 * not assume the equalizer is always the answer.
 */
export const equalizingCoverage = (
  game: GameSetup,
): { coverage: Coverage; attackerValue: number } | null => {
  const shareAt = (v: number, i: number) => {
    const line = attackerLine(game, i);
    return (line.intercept - v) / -line.slope;
  };
  const sumAt = (v: number) =>
    game.targets.reduce((sum, _, i) => sum + shareAt(v, i), 0);

  // Bracket v between "everything covered" and "nothing covered".
  let lo = Math.min(...game.targets.map((_, i) => attackerPayoff(game, i, true)));
  let hi = Math.max(
    ...game.targets.map((_, i) => attackerPayoff(game, i, false)),
  );
  for (let step = 0; step < 200; step += 1) {
    const mid = (lo + hi) / 2;
    if (sumAt(mid) > 1) lo = mid;
    else hi = mid;
  }
  const v = (lo + hi) / 2;
  const coverage = game.targets.map((_, i) => shareAt(v, i));

  if (coverage.some((x) => x < -EPS || x > 1 + EPS)) return null;
  return { coverage, attackerValue: v };
};

/**
 * The defender's genuinely optimal commitment, found properly rather than by
 * assuming the equalizer is it.
 *
 * For each target t, this asks: what is the most the defender can get while
 * making t the attacker's best response? That is a small linear program, and
 * because every constraint is linear in a single xi it can be solved directly:
 * push coverage onto t as far as possible, holding every other target at the
 * least coverage that keeps it no more attractive than t. The best answer
 * across all t is the optimum.
 *
 * Used to verify that the Example's equalizer really is optimal, and it is what
 * a Practice generator would need.
 */
export const defenderOptimum = (
  game: GameSetup,
): { coverage: Coverage; target: number; value: number } => {
  const n = game.targets.length;
  let best: { coverage: Coverage; target: number; value: number } | null = null;

  for (let t = 0; t < n; t += 1) {
    // Attacker value at t as a function of its own coverage, and for every
    // other target the coverage needed to pull it down to that same value.
    const tLine = attackerLine(game, t);
    const neededElsewhere = (vAtT: number, i: number) => {
      const line = attackerLine(game, i);
      // EUa(i) <= vAtT  =>  intercept + slope*xi <= vAtT, slope < 0
      return Math.max(0, (line.intercept - vAtT) / -line.slope);
    };

    // Raising x_t lowers vAtT, which raises what the others need. Total
    // coverage required is monotone in x_t, so bisect for the largest feasible.
    const totalNeeded = (xt: number) => {
      const vAtT = tLine.intercept + tLine.slope * xt;
      let sum = xt;
      for (let i = 0; i < n; i += 1) {
        if (i !== t) sum += neededElsewhere(vAtT, i);
      }
      return sum;
    };

    if (totalNeeded(0) > 1 + EPS) continue; // t can never be the best response

    let lo = 0;
    let hi = 1;
    for (let step = 0; step < 200; step += 1) {
      const mid = (lo + hi) / 2;
      if (totalNeeded(mid) <= 1) lo = mid;
      else hi = mid;
    }
    const xt = lo;
    const vAtT = tLine.intercept + tLine.slope * xt;
    const coverage: Coverage = [];
    for (let i = 0; i < n; i += 1) {
      coverage[i] = i === t ? xt : neededElsewhere(vAtT, i);
    }
    // Any coverage left over is slack; park it on t, which only helps.
    const slack = 1 - coverage.reduce((a, b) => a + b, 0);
    if (slack > EPS) coverage[t] += slack;

    const value = defenderEU(game, coverage, t);
    if (!best || value > best.value + EPS) {
      best = { coverage, target: t, value };
    }
  }

  if (!best) throw new Error("No feasible defender commitment found.");
  return best;
};

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

export const asPercent = (x: number, places = 1): string =>
  `${(x * 100).toFixed(places)}%`;

export const round2 = (x: number): number => Math.round(x * 100) / 100;

/**
 * A small exact fraction for a number that came out of the solver, so the
 * walkthrough can print 23/52 rather than 0.4423. Returns null when nothing
 * tidy fits, in which case callers should fall back to a decimal.
 */
export const asFraction = (
  x: number,
  maxDenominator = 200,
): { numerator: number; denominator: number } | null => {
  for (let d = 1; d <= maxDenominator; d += 1) {
    const n = Math.round(x * d);
    if (Math.abs(x - n / d) < 1e-9) {
      return { numerator: n, denominator: d };
    }
  }
  return null;
};

export const fractionText = (x: number): string => {
  const f = asFraction(x);
  return f && f.denominator !== 1
    ? `${f.numerator}/${f.denominator}`
    : String(round2(x));
};
