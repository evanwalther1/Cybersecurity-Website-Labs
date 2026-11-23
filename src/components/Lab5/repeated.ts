// Lab 5's repeated security game: the strategies, the simulator, and the
// discounted valuation.
//
// Pure TypeScript, no React, for the same reason gameTree.ts and
// stackelberg.ts are. The behaviour of eleven strategies against each other is
// the part that has to be right, and keeping it out of a component means all
// thirty matchups can be run offline rather than only by clicking.
//
// WHY THIS IMPORTS FROM LAB 4
//
// Lab 3 and Lab 4 deliberately declared their own types so the labs stayed
// independent. Lab 5 does the opposite on purpose: it is the *same game as
// Lab 4*, played over and over. The capstone of the lab is that Lab 4's
// optimal mix is exactly the defense a learning attacker cannot read, and that
// claim is only true if it is literally the same numbers. Re-declaring the
// game here would let the two drift apart and quietly break the punchline.

import type { Coverage, GameSetup } from "../Lab4/stackelberg";
import {
  EXAMPLE_GAME,
  attackerPayoff,
  defenderPayoff,
  equalizingCoverage,
  defenderOptimum,
} from "../Lab4/stackelberg";

export { EXAMPLE_GAME };

// ---------------------------------------------------------------------------
// One round
// ---------------------------------------------------------------------------
//
// Each round the defender places one honeypot on exactly one server and the
// attacker hits exactly one server. There is no mixing *within* a round: the
// defender commits to a position. Randomized Defense mixes across rounds by
// drawing a fresh position each time, which is a different thing and worth
// keeping straight.

export interface Round {
  /** Index of the server the attacker hit. */
  attacked: number;
  /** Index of the server the defender honeypotted. */
  defended: number;
  /** True when those are the same server. */
  caught: boolean;
  /** Damage the defender took: the server's value, or 0 if caught. */
  damage: number;
  /** Attacker's payoff this round, `Di - Cei`. */
  ua: number;
  /** Defender's payoff this round, `SUM(V) - Di - Ch`. */
  ud: number;
}

const playRound = (
  game: GameSetup,
  attacked: number,
  defended: number,
): Round => {
  const caught = attacked === defended;
  return {
    attacked,
    defended,
    caught,
    damage: caught ? 0 : game.servers[attacked].value,
    ua: attackerPayoff(game, attacked, caught),
    ud: defenderPayoff(game, attacked, caught),
  };
};

// ---------------------------------------------------------------------------
// Tie-breaking
// ---------------------------------------------------------------------------
//
// Every strategy below is an argmax, and ties are common (two servers with the
// same value, a frequency count that has not separated yet). An unresolved tie
// would make a matchup non-deterministic and therefore ungradeable and
// unreproducible, so there is exactly one rule, used everywhere:
//
//   ties go to the LOWEST server index.
//
// It is arbitrary but it is stated, consistent, and it means a seed replays
// identically. Where a tie would hide something a student should see, the
// generator rejects the game rather than the strategy papering over it.

const EPS = 1e-9;

/** argmax with the lowest-index tie-break stated above. */
const argmax = (scores: number[]): number => {
  let best = 0;
  for (let i = 1; i < scores.length; i += 1) {
    if (scores[i] > scores[best] + EPS) best = i;
  }
  return best;
};

// ---------------------------------------------------------------------------
// Seeded randomness
// ---------------------------------------------------------------------------
//
// Random Attack and Randomized Defense need randomness, but a match the
// student cannot replay is a match they cannot learn from: "run it again" has
// to mean the same thing twice, and the debrief text has to describe the match
// actually on screen. mulberry32 is a small, well-known PRNG; any seeded
// generator would do.

export const makeRng = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Draw an index from a probability vector. */
const sampleFrom = (weights: number[], rng: () => number): number => {
  const roll = rng();
  let acc = 0;
  for (let i = 0; i < weights.length; i += 1) {
    acc += weights[i];
    if (roll < acc) return i;
  }
  return weights.length - 1;
};

// ---------------------------------------------------------------------------
// Strategies
// ---------------------------------------------------------------------------

export type AttackerStrategyId =
  "greedy" | "rotation" | "reactive" | "frequency" | "random";

export type DefenderStrategyId =
  "static" | "trigger" | "reactive" | "frequency" | "randomized" | "manual";

/** Everything a strategy needs to choose. History is every completed round. */
export interface DecisionContext {
  game: GameSetup;
  history: Round[];
  rng: () => number;
  /** The server the student parked the defense on before round 1. */
  startServer: number;
  /** Which servers Target Rotation cycles through, in order. */
  rotation: number[];
  /** Randomized Defense draws from this; it is Lab 4's optimal mix. */
  mix: Coverage;
}

/** The attacker's raw one-shot payoff at each server, ignoring any defense. */
const rawPayoffs = (game: GameSetup): number[] =>
  game.servers.map((s) => s.value - s.exploitCost);

// -- attacker ---------------------------------------------------------------

const attackerDecide: Record<
  AttackerStrategyId,
  (ctx: DecisionContext) => number
> = {
  // Always hit whatever pays most in a single round, ignoring the defense
  // entirely. Note this is argmax(V - C), not argmax(V): the exploit cost is
  // part of the payoff. On the Example game both readings give S1, but raise
  // S1's cost to 4 and they diverge, so the distinction has to be in the code
  // rather than in a comment on the whiteboard.
  greedy: ({ game }) => argmax(rawPayoffs(game)),

  // A fixed cycle, round-robin. Carries no memory of the defense at all; it is
  // the simplest pattern that defeats a trigger rule, because a trigger that
  // watches for a repeat never sees one.
  rotation: ({ history, rotation }) =>
    rotation[history.length % rotation.length],

  // Assume the defender stays where they were last round, then take the best
  // server that is not that one. One round of memory, used to predict rather
  // than to react, which is what makes it able to exploit a trigger rule.
  reactive: ({ game, history }) => {
    if (history.length === 0) return argmax(rawPayoffs(game));
    const predicted = history[history.length - 1].defended;
    return argmax(
      game.servers.map((_, i) => attackerPayoff(game, i, i === predicted)),
    );
  },

  // Count how often each server has been defended and discount its value by
  // that rate: expected payoff is (1 - f_i)*V_i - C_i.
  //
  // This is the most important attacker in the lab. That expression is
  // algebraically identical to Lab 4's EUa(Si) = (Vi - Ci) - Vi*xi, with the
  // observed frequency standing in for the committed probability. So this
  // attacker is literally running Lab 4's best-response calculation from data
  // instead of from an announcement, which is why Lab 4's mix neutralizes it.
  frequency: ({ game, history }) => {
    if (history.length === 0) return argmax(rawPayoffs(game));
    const seen = game.servers.map(
      (_, i) => history.filter((r) => r.defended === i).length / history.length,
    );
    return argmax(
      game.servers.map((s, i) => (1 - seen[i]) * s.value - s.exploitCost),
    );
  },

  // Uniform. Leaves value on the table (it hits the cheap servers as often as
  // the valuable one) but presents no pattern at all, which is exactly what
  // makes every adaptive defense useless against it.
  random: ({ game, rng }) => Math.floor(rng() * game.servers.length),
};

// -- defender ---------------------------------------------------------------

const defenderDecide: Record<
  DefenderStrategyId,
  (ctx: DecisionContext) => number
> = {
  // Park on one server forever. The student chooses which, and that choice is
  // the whole lesson: static on the right server is a perfect game against a
  // greedy attacker, static on the wrong one is the worst row in the grid.
  static: ({ startServer }) => startServer,

  // The whiteboard's rule: if the same server is attacked twice in a row,
  // protect it next round; otherwise hold position.
  //
  // "Hold position" matters. The defender does not reset to the start server,
  // they stay where the last trigger put them, which is what produces the
  // 9, 9, 17, 17, 17... ladder rather than an oscillation.
  trigger: ({ history, startServer }) => {
    const held =
      history.length === 0 ? startServer : history[history.length - 1].defended;
    if (history.length < 2) return held;
    const a = history[history.length - 1].attacked;
    const b = history[history.length - 2].attacked;
    return a === b ? a : held;
  },

  // Protect wherever they hit last round. Strong against anything that repeats
  // and catastrophic against anything that alternates: against a clean
  // rotation it is perfectly anti-correlated and catches them zero percent of
  // the time, forever.
  reactive: ({ history, startServer }) =>
    history.length === 0 ? startServer : history[history.length - 1].attacked,

  // Protect the server with the highest expected damage, f_i * V_i, where f_i
  // is how often it has been hit. Value-weighted rather than a bare count,
  // because preventing one hit on an 8 beats preventing one hit on a 4.
  frequency: ({ game, history, startServer }) => {
    if (history.length === 0) return startServer;
    const hit = game.servers.map(
      (_, i) => history.filter((r) => r.attacked === i).length / history.length,
    );
    return argmax(game.servers.map((s, i) => hit[i] * s.value));
  },

  // Draw a fresh position each round from Lab 4's optimal commitment.
  //
  // This is the floor the rest of the lab is measured against: it reads
  // nothing, learns nothing, and cannot be read or learned in return.
  randomized: ({ mix, rng }) => sampleFrom(mix, rng),

  // The student plays. The simulator cannot choose for them, so this is only
  // ever reached if a manual match is run without supplying moves; falling
  // back to the start server keeps it total rather than throwing mid-match.
  manual: ({ startServer }) => startServer,
};

// ---------------------------------------------------------------------------
// Strategy metadata, for the cards
// ---------------------------------------------------------------------------

export interface StrategyInfo {
  id: string;
  name: string;
  /** One line, on the card. */
  blurb: string;
  /** What it is actually doing, shown once it has been picked. */
  rule: string;
  /** Does it look at the opponent at all? Drives the "adaptive" tag. */
  adaptive: boolean;
}

export const ATTACKER_STRATEGIES: (StrategyInfo & {
  id: AttackerStrategyId;
})[] = [
  {
    id: "greedy",
    name: "Greedy Attack",
    blurb: "Always take the biggest payoff. Never looks up.",
    rule: "Every round, work out which server pays best after paying to break into it, and hit that one. Never looks at the defense and never changes its mind.",
    adaptive: false,
  },
  {
    id: "rotation",
    name: "Target Rotation",
    blurb: "Cycle through servers on a fixed schedule.",
    rule: "Work through a fixed list of servers in order, then start over. Pays no attention to the defense, but never sits still either.",
    adaptive: false,
  },
  {
    id: "reactive",
    name: "Reactive Best Response",
    blurb: "Assume the defender stays put, then dodge.",
    rule: "Assume the honeypot stays where it was last round, then take the most profitable server that is not that one. One round of memory, used to guess the next move rather than the last.",
    adaptive: true,
  },
  {
    id: "frequency",
    name: "Frequency Avoidance",
    blurb: "Learn where the honeypot lives, and go elsewhere.",
    rule: "Keep a running count of how often each server gets guarded, and treat a server that is guarded a lot as worth less. Then take whichever one still looks most profitable.",
    adaptive: true,
  },
  {
    id: "random",
    name: "Randomized Attack",
    blurb: "Pure coin flip. No pattern to find.",
    rule: "Pick a server at random every round, with every server equally likely. Leaves money on the table, but there is nothing in it for anyone to learn.",
    adaptive: false,
  },
];

export const DEFENDER_STRATEGIES: (StrategyInfo & {
  id: DefenderStrategyId;
})[] = [
  {
    id: "static",
    name: "Static Defense",
    blurb: "Pick one server and never move.",
    rule: "Put the honeypot on one server and leave it there for the whole match, whichever one you start on.",
    adaptive: false,
  },
  {
    id: "trigger",
    name: "Trigger Defense",
    blurb: "Hit twice in the same place and I move there.",
    rule: "Watch for the same server being hit twice in a row. When that happens, move the honeypot there. Otherwise stay exactly where you are.",
    adaptive: true,
  },
  {
    id: "reactive",
    name: "Reactive Best Response",
    blurb: "Guard wherever they struck last.",
    rule: "Move the honeypot to wherever they struck last round, every round, on the assumption they will come back.",
    adaptive: true,
  },
  {
    id: "frequency",
    name: "Frequency Response",
    blurb: "Guard whatever they keep coming back to.",
    rule: "Keep a running count of where the attacks land, and guard whichever server is costing you the most over time. A valuable server hit now and then can outrank a cheap one hit constantly.",
    adaptive: true,
  },
  {
    id: "randomized",
    name: "Randomized Defense",
    blurb: "Lab 4's mix. Unreadable, and it never reads you.",
    rule: "Roll the dice fresh every round, using the exact odds Lab 4 solved for. Never reads the attacker, and gives them nothing to read either.",
    adaptive: false,
  },
  {
    id: "manual",
    name: "Play It Yourself",
    blurb: "You place the honeypot, round by round.",
    rule: "You choose where the honeypot goes each round, with the full history in front of you.",
    adaptive: true,
  },
];

// ---------------------------------------------------------------------------
// Running a match
// ---------------------------------------------------------------------------

export interface MatchConfig {
  game: GameSetup;
  attacker: AttackerStrategyId;
  defender: DefenderStrategyId;
  /** Where Static and Trigger begin, and the fallback for every defense in
   *  round 1 before there is any history to read. */
  startServer: number;
  rounds: number;
  seed: number;
  /** Target Rotation's cycle. Defaults to the whiteboard's S1/S3. */
  rotation?: number[];
  /** Supplies the moves when `defender` is "manual". */
  manualMoves?: number[];
}

export interface Match {
  config: MatchConfig;
  rounds: Round[];
  /** Lab 4's optimal mix for this game, used by Randomized Defense and as the
   *  baseline every matchup is compared against. */
  mix: Coverage;
}

export const DEFAULT_ROTATION = [0, 2];

/**
 * How many rounds to simulate, and how many to put on screen.
 *
 * These differ on purpose. The adaptive-versus-adaptive matchups settle into
 * cycles as long as six or seven rounds, and `detectCycle` needs to see a
 * period repeat three times before it will believe it. Twelve rounds is a
 * comfortable table to read but is far too short to recognise a six-round
 * cycle, so a match valued on twelve rounds alone falls back to estimating its
 * own tail and comes out slightly wrong. Measured: reactive vs trigger at
 * delta 0.9 was off by 0.99 against a 3000-round brute force.
 *
 * So the engine always runs SIM_ROUNDS and the table shows the first
 * DISPLAY_ROUNDS. The student sees a readable history; the total they are
 * reading is computed from enough rounds to be exact.
 *
 * 200 rather than 60 because of the stochastic matchups, where no cycle exists
 * and the tail is an expectation rather than an exact sum. At the top of the
 * slider (delta 0.95) a 60-round tail is still 46% of the whole total, so
 * sampling noise in one playthrough showed up as a ~2% error against a
 * 4000-round brute force. At 200 rounds the tail is 0.07% of the total and
 * the error disappears. 200 rounds of three-way argmax costs nothing.
 */
export const SIM_ROUNDS = 200;
export const DISPLAY_ROUNDS = 12;

/** The slider's range. Capped below 1 because the geometric series does not
 *  converge at 1, and capped at 0.95 because beyond that the tail outruns any
 *  finite simulation. */
export const DELTA_MIN = 0.05;
export const DELTA_MAX = 0.95;

/** Lab 4's optimal commitment, which is the equalizer whenever it is feasible
 *  and the properly solved optimum when it is not. */
export const optimalMix = (game: GameSetup): Coverage =>
  equalizingCoverage(game)?.coverage ?? defenderOptimum(game).coverage;

export const simulateMatch = (config: MatchConfig): Match => {
  const { game, rounds: n, startServer } = config;
  const rotation = config.rotation ?? DEFAULT_ROTATION;
  const mix = optimalMix(game);

  // Two independent streams. If both players drew from one generator, adding a
  // random attacker would silently change every defender draw too, and two
  // matchups that should be comparable would not be.
  const attackerRng = makeRng(config.seed);
  const defenderRng = makeRng(config.seed ^ 0x9e3779b9);

  const history: Round[] = [];
  for (let t = 0; t < n; t += 1) {
    const ctx: DecisionContext = {
      game,
      history,
      rng: attackerRng,
      startServer,
      rotation,
      mix,
    };
    const attacked = attackerDecide[config.attacker](ctx);
    const defended =
      config.defender === "manual" && config.manualMoves
        ? (config.manualMoves[t] ?? startServer)
        : defenderDecide[config.defender]({ ...ctx, rng: defenderRng });
    history.push(playRound(game, attacked, defended));
  }

  return { config, rounds: history, mix };
};

/**
 * What a strategy would do on the next round, given everything so far.
 *
 * `simulateMatch` plays a whole match; Practice needs to stop one move short
 * and ask the student to supply it, then mark their answer against what the
 * rule actually says. Exposing the decision functions one round at a time is
 * the difference between "watch this play out" and "you are running this
 * rule, now run it".
 */
export const nextMove = (
  side: "attacker" | "defender",
  strategy: AttackerStrategyId | DefenderStrategyId,
  ctx: DecisionContext,
): number =>
  side === "attacker"
    ? attackerDecide[strategy as AttackerStrategyId](ctx)
    : defenderDecide[strategy as DefenderStrategyId](ctx);

/** A DecisionContext for a history, with the defaults the lab uses. */
export const contextFor = (
  game: GameSetup,
  history: Round[],
  startServer: number,
  rotation: number[] = DEFAULT_ROTATION,
  seed = 1,
): DecisionContext => ({
  game,
  history,
  rng: makeRng(seed),
  startServer,
  rotation,
  mix: optimalMix(game),
});

// ---------------------------------------------------------------------------
// Valuing a match: the discount factor
// ---------------------------------------------------------------------------
//
//   Ud = Ud1 + d*Ud2 + d^2*Ud3 + ...
//
// straight off the whiteboard, where d is delta in 0..1. Near 0 only this
// round matters; near 1 the future dominates.
//
// The series is infinite but a match on screen is not, so the tail has to come
// from somewhere. Truncating it would be wrong in a way students would notice:
// at delta = 0.8 a twelve-round truncation throws away about 7% of the total,
// and the whole point of step 5 is comparing totals.
//
// Every deterministic matchup here settles into a repeating cycle within a few
// rounds, so the honest answer is to find that cycle and sum it in closed
// form, exactly as the whiteboard sums 17*d^2/(1-d). Where no cycle exists
// (anything with a random player) the tail falls back to the mean of the
// settled portion, which is the right expectation even though no single
// playthrough equals it.

export interface Valuation {
  /** Sum of d^t * ud_t over the rounds actually simulated. */
  visible: number;
  /** The infinite tail beyond them. */
  tail: number;
  /** visible + tail. */
  total: number;
  /** Undiscounted mean per round over the settled portion. */
  perRound: number;
  /** Period of the detected cycle, or null when none was found. */
  cycle: number | null;
  /** True when the tail is an expectation rather than an exact sum. */
  estimated: boolean;
}

/**
 * Smallest period L for which the last `reps` repetitions of the (attacked,
 * defended) pair sequence agree. Detecting on the moves rather than on the
 * payoffs avoids a false positive where two different rounds happen to pay the
 * same, which is common here because every catch pays 17.
 */
const detectCycle = (
  rounds: Round[],
  reps = 3,
  maxPeriod = 12,
): number | null => {
  const key = (r: Round) => r.attacked * 10 + r.defended;
  for (let L = 1; L <= maxPeriod; L += 1) {
    if (rounds.length < L * reps) break;
    let ok = true;
    for (
      let i = rounds.length - L * reps;
      i < rounds.length - L && ok;
      i += 1
    ) {
      if (key(rounds[i]) !== key(rounds[i + L])) ok = false;
    }
    if (ok) return L;
  }
  return null;
};

export const valueMatch = (match: Match, delta: number): Valuation => {
  const { rounds } = match;
  const n = rounds.length;

  let visible = 0;
  for (let t = 0; t < n; t += 1) visible += delta ** t * rounds[t].ud;

  const cycle = detectCycle(rounds);

  // delta = 1 has no convergent tail. The UI clamps below 1, but a stray value
  // must not produce Infinity in a number a student is reading.
  if (delta >= 1 - EPS) {
    const perRound = rounds.reduce((s, r) => s + r.ud, 0) / n;
    return {
      visible,
      tail: Infinity,
      total: Infinity,
      perRound,
      cycle,
      estimated: true,
    };
  }

  if (cycle !== null) {
    // The cycle occupies the last `cycle` rounds, so the tail repeats it from
    // round n onward:  d^n * (sum of one period, discounted) / (1 - d^L).
    const period = rounds.slice(n - cycle);
    let block = 0;
    for (let j = 0; j < cycle; j += 1) block += delta ** j * period[j].ud;
    const tail = (delta ** n * block) / (1 - delta ** cycle);
    const perRound = period.reduce((s, r) => s + r.ud, 0) / cycle;
    return {
      visible,
      tail,
      total: visible + tail,
      perRound,
      cycle,
      estimated: false,
    };
  }

  // No cycle: use the mean of the second half, which has had time to settle.
  const settled = rounds.slice(Math.floor(n / 2));
  const perRound = settled.reduce((s, r) => s + r.ud, 0) / settled.length;
  const tail = (delta ** n * perRound) / (1 - delta);
  return {
    visible,
    tail,
    total: visible + tail,
    perRound,
    cycle: null,
    estimated: true,
  };
};

// ---------------------------------------------------------------------------
// The baseline every matchup is read against
// ---------------------------------------------------------------------------
//
// Lab 4's mix is not just another defender in the list, it is the yardstick.
// It guarantees a floor no attacker can push the defender below, and it also
// caps what the defender can ever win, because it never exploits anything.
// Showing the matchup's per-round result beside that floor is what turns
// thirty cells into one argument.

export interface MixBaseline {
  /** Defender's expected per-round payoff if they randomized instead, holding
   *  the attacker's observed behaviour fixed. */
  expected: number;
  /** The worst the mix can ever do, over every possible attacker behaviour. */
  floor: number;
  /** The best it can ever do. */
  ceiling: number;
}

/** Defender's expected payoff under the mix when server `i` is attacked. */
const mixPayoffAt = (game: GameSetup, mix: Coverage, i: number): number =>
  mix[i] * defenderPayoff(game, i, true) +
  (1 - mix[i]) * defenderPayoff(game, i, false);

export const mixBaseline = (match: Match): MixBaseline => {
  const { config, rounds, mix } = match;
  const { game } = config;
  const per = game.servers.map((_, i) => mixPayoffAt(game, mix, i));

  // Weight by how often the attacker actually went to each server in this
  // match, so the comparison answers "what if I had randomized against THIS
  // attacker" rather than against a hypothetical one.
  const freq = game.servers.map(
    (_, i) => rounds.filter((r) => r.attacked === i).length / rounds.length,
  );
  return {
    expected: per.reduce((s, p, i) => s + p * freq[i], 0),
    floor: Math.min(...per),
    ceiling: Math.max(...per),
  };
};

// ---------------------------------------------------------------------------
// Reading a match back
// ---------------------------------------------------------------------------

export interface MatchSummary {
  caught: number;
  catchRate: number;
  perRound: number;
  /** perRound minus what randomizing would have paid against this attacker. */
  versusMix: number;
  /** The best per-round the defender could have managed with hindsight: catch
   *  every round. Not achievable in general, it is the ceiling of the game. */
  best: number;
  /** The worst: never catch anything, and have them take the biggest server. */
  worst: number;
}

export const summarize = (match: Match, value: Valuation): MatchSummary => {
  const { rounds, config } = match;
  const caught = rounds.filter((r) => r.caught).length;
  const base = mixBaseline(match);
  const values = config.game.servers.map((s) => s.value);
  return {
    caught,
    catchRate: caught / rounds.length,
    perRound: value.perRound,
    versusMix: value.perRound - base.expected,
    best: defenderPayoff(config.game, 0, true),
    worst: defenderPayoff(
      config.game,
      values.indexOf(Math.max(...values)),
      false,
    ),
  };
};
