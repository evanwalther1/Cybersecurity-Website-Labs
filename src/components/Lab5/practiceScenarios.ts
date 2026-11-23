// Scenario generation for Practice Lab 5, and the gates that keep the
// generated questions answerable.
//
// Pure TypeScript, no React, like repeated.ts. The gates are the reason this
// file exists: a question built from a randomly drawn matchup is very often
// unanswerable, and the only way to know is to simulate every candidate and
// check. Same discipline as Lab 2's analyzeGame and Lab 3's describeUnusable.
//
// WHAT THE GATES ARE FOR, measured rather than guessed
//
// Over every deterministic matchup at three history lengths, asking "name the
// strategy pair behind this history" has a unique answer only 25 times out of
// 34, and showing more rounds does not help: 8, 12 and 15 rounds score 23, 25
// and 25. Once a matchup settles into its cycle, further rounds carry no new
// information at all.
//
// The collisions are structural:
//
//   greedy/static == greedy/trigger == greedy/reactive == greedy/frequency
//   rotation/static == rotation/trigger == rotation/frequency
//   reactive/static == frequency/static
//
// The first is the start-server case: park the honeypot where a greedy
// attacker was going anyway and every defense sits still forever. The second
// is a trigger rule whose condition never fires, which is indistinguishable
// from never having a rule. The third is the one worth teaching: against a
// defense that never moves, three different attackers behave identically,
// because two of them are reacting to a signal that is not there.
//
// So questions ask about ONE side, and `identifies` is the gate.

import type { GameSetup } from "../Lab4/stackelberg";
import type { AttackerStrategyId, DefenderStrategyId, Round } from "./repeated";
import {
  ATTACKER_STRATEGIES,
  DEFAULT_ROTATION,
  DEFENDER_STRATEGIES,
  EXAMPLE_GAME,
  contextFor,
  nextMove,
  simulateMatch,
  valueMatch,
} from "./repeated";

export const G = EXAMPLE_GAME;

/** Every strategy that can be simulated. "manual" has nobody to play it. */
export const ATTACKERS = ATTACKER_STRATEGIES.map(
  (s) => s.id,
) as AttackerStrategyId[];
export const DEFENDERS = DEFENDER_STRATEGIES.filter(
  (d) => d.id !== "manual",
).map((d) => d.id) as DefenderStrategyId[];

/** Strategies with no randomness, which are the only ones a history can pin
 *  down. A random player's history is consistent with nothing in particular. */
export const DET_ATTACKERS = ATTACKERS.filter((a) => a !== "random");
export const DET_DEFENDERS = DEFENDERS.filter((d) => d !== "randomized");

export const strategyName = (
  side: "attacker" | "defender",
  id: string,
): string =>
  (side === "attacker" ? ATTACKER_STRATEGIES : DEFENDER_STRATEGIES).find(
    (s) => s.id === id,
  )!.name;

// ---------------------------------------------------------------------------
// Identifiability
// ---------------------------------------------------------------------------

/** A history reduced to the pair of moves per round, which is all a student
 *  can see and therefore all an answer may depend on. */
const fingerprint = (rounds: Round[]): string =>
  rounds.map((r) => `${r.attacked}${r.defended}`).join(",");

export interface Consistent {
  attackers: AttackerStrategyId[];
  defenders: DefenderStrategyId[];
}

/**
 * Every deterministic strategy pair that reproduces this exact history from
 * this start server, collapsed to the distinct strategies on each side.
 *
 * The student is shown moves, not rules, so two rules that produce the same
 * moves are the same answer as far as the question is concerned.
 */
export const consistentWith = (
  game: GameSetup,
  rounds: Round[],
  startServer: number,
  rotation: number[] = DEFAULT_ROTATION,
): Consistent => {
  const target = fingerprint(rounds);
  const attackers = new Set<AttackerStrategyId>();
  const defenders = new Set<DefenderStrategyId>();
  for (const a of DET_ATTACKERS) {
    for (const d of DET_DEFENDERS) {
      const sim = simulateMatch({
        game,
        attacker: a,
        defender: d,
        startServer,
        rounds: rounds.length,
        seed: 1,
        rotation,
      });
      if (fingerprint(sim.rounds) === target) {
        attackers.add(a);
        defenders.add(d);
      }
    }
  }
  return { attackers: [...attackers], defenders: [...defenders] };
};

/** True when the history pins down exactly one strategy on the asked side. */
export const identifies = (
  side: "attacker" | "defender",
  c: Consistent,
): boolean => (side === "attacker" ? c.attackers : c.defenders).length === 1;

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

/** A played-out situation a question can be asked about. */
export interface Scenario {
  attacker: AttackerStrategyId;
  defender: DefenderStrategyId;
  startServer: number;
  rotation: number[];
  rounds: Round[];
}

export const playScenario = (
  attacker: AttackerStrategyId,
  defender: DefenderStrategyId,
  startServer: number,
  n: number,
  rotation: number[] = DEFAULT_ROTATION,
  seed = 1,
): Scenario => ({
  attacker,
  defender,
  startServer,
  rotation,
  rounds: simulateMatch({
    game: G,
    attacker,
    defender,
    startServer,
    rounds: n,
    seed,
    rotation,
  }).rounds,
});

/** What the named defense says to do on the round after this history. */
export const defenseWouldPlay = (
  defender: DefenderStrategyId,
  scenario: Scenario,
): number =>
  nextMove(
    "defender",
    defender,
    contextFor(G, scenario.rounds, scenario.startServer, scenario.rotation),
  );

/** What the named attacker does next. Used to mark "predict their move". */
export const attackWouldPlay = (
  attacker: AttackerStrategyId,
  scenario: Scenario,
): number =>
  nextMove(
    "attacker",
    attacker,
    contextFor(G, scenario.rounds, scenario.startServer, scenario.rotation),
  );

// ---------------------------------------------------------------------------
// "Execute the rule" scenarios
// ---------------------------------------------------------------------------
//
// The student is told which defense they are running and asked for the next
// placement. The interesting half of these are the ones where the rule says
// HOLD: a trigger rule that has not fired is the single most common thing to
// get wrong, because chasing the last attack feels like doing your job.

export interface ExecuteScenario extends Scenario {
  /** The rule the student is running. */
  running: DefenderStrategyId;
  answer: number;
  /** True when the rule says to move off the current position. */
  moves: boolean;
}

const lastDefended = (s: Scenario): number =>
  s.rounds.length === 0
    ? s.startServer
    : s.rounds[s.rounds.length - 1].defended;

/**
 * Why this execute scenario is unusable, or null.
 *
 * The rule must be unambiguous (no two servers tie for the answer) and the
 * history must be long enough for the rule to have something to read.
 */
export const describeUnusableExecute = (s: ExecuteScenario): string | null => {
  if (s.rounds.length < 2) return "history too short to read";
  // The history has to be the one this rule would actually have produced.
  //
  // Generating the rounds with one defense and then telling the student they
  // are running another produces incoherent questions: "you are running
  // Static Defense" above a table showing the honeypot moving every round.
  // The student is right to be confused, and the answer (go back to the
  // start server) is not something the table supports. A rule and its own
  // history, then one more round.
  if (s.defender !== s.running)
    return "history was produced by a different rule";
  if (s.answer < 0 || s.answer >= G.servers.length) return "answer off board";
  // A question whose answer is "the server you are already on" is fine and
  // in fact valuable, but it must not ALSO be the server they just attacked,
  // or "hold" and "chase" give the same answer and the question tests
  // nothing.
  const chased = s.rounds[s.rounds.length - 1].attacked;
  const held = lastDefended(s);
  if (chased === held) return "hold and chase agree";
  return null;
};

export const makeExecute = (
  attacker: AttackerStrategyId,
  defender: DefenderStrategyId,
  running: DefenderStrategyId,
  startServer: number,
  n: number,
  rotation: number[] = DEFAULT_ROTATION,
): ExecuteScenario => {
  const s = playScenario(attacker, defender, startServer, n, rotation);
  const answer = defenseWouldPlay(running, s);
  return { ...s, running, answer, moves: answer !== lastDefended(s) };
};

// ---------------------------------------------------------------------------
// "Pick the counter" scenarios
// ---------------------------------------------------------------------------
//
// Given an attacker, which defense is best? Ties are common and real: against
// a greedy attacker, Trigger, Reactive and Frequency all settle at 17.00. So
// this returns every tied-optimal answer rather than one, and grading accepts
// any of them, the way Lab 3 does.

export interface CounterOption {
  id: DefenderStrategyId;
  /** Discounted total over the whole game at the stated horizon. */
  total: number;
}

export interface CounterScenario {
  attacker: AttackerStrategyId;
  startServer: number;
  delta: number;
  options: CounterOption[];
  /** Every defense within EPS of the best. */
  best: DefenderStrategyId[];
  /** How far clear the best is of the next distinct answer. */
  margin: number;
}

const TIE_EPS = 1e-6;

export const makeCounter = (
  attacker: AttackerStrategyId,
  startServer: number,
  delta: number,
  pool: DefenderStrategyId[] = DEFENDERS,
): CounterScenario => {
  const options = pool
    .map((id) => ({
      id,
      total: valueMatch(
        simulateMatch({
          game: G,
          attacker,
          defender: id,
          startServer,
          rounds: 200,
          seed: 20250101,
        }),
        delta,
      ).total,
    }))
    .sort((a, b) => b.total - a.total);

  const top = options[0].total;
  const best = options.filter((o) => o.total > top - TIE_EPS).map((o) => o.id);
  const next = options.find((o) => o.total <= top - TIE_EPS);
  return {
    attacker,
    startServer,
    delta,
    options,
    best,
    margin: next ? top - next.total : top,
  };
};

/**
 * Why this counter question is unusable, or null.
 *
 * A near-tie is worse than an exact tie: an exact tie can be accepted as
 * multiple correct answers, but a gap of 0.2 out of 70 marks a student wrong
 * for a distinction nothing on screen could have revealed.
 */
export const describeUnusableCounter = (
  c: CounterScenario,
  minMargin = 1.5,
): string | null => {
  if (c.best.length === c.options.length) return "every defense ties";
  if (c.margin < minMargin) return `margin too thin (${c.margin.toFixed(3)})`;
  return null;
};

// ---------------------------------------------------------------------------
// "Identify the opponent" scenarios
// ---------------------------------------------------------------------------

export interface IdentifyScenario extends Scenario {
  side: "attacker" | "defender";
  answer: string;
  /** Strategies the history is also consistent with. Must be empty to use. */
  alsoFits: string[];
}

export const makeIdentify = (
  side: "attacker" | "defender",
  attacker: AttackerStrategyId,
  defender: DefenderStrategyId,
  startServer: number,
  n: number,
  rotation: number[] = DEFAULT_ROTATION,
): IdentifyScenario => {
  const s = playScenario(attacker, defender, startServer, n, rotation);
  const c = consistentWith(G, s.rounds, startServer, rotation);
  const fits: string[] = side === "attacker" ? c.attackers : c.defenders;
  const answer = side === "attacker" ? attacker : defender;
  return { ...s, side, answer, alsoFits: fits.filter((f) => f !== answer) };
};

export const describeUnusableIdentify = (
  s: IdentifyScenario,
): string | null => {
  if (s.alsoFits.length > 0) return `also fits ${s.alsoFits.join(", ")}`;
  // A history where nothing ever moves teaches nothing and reads as a bug.
  const atkMoves = new Set(s.rounds.map((r) => r.attacked)).size;
  const defMoves = new Set(s.rounds.map((r) => r.defended)).size;
  if (s.side === "attacker" && atkMoves === 1 && s.rounds.length > 4) {
    // Allowed, but only for Greedy, where "never varies" IS the signature.
    if (s.attacker !== "greedy") return "attacker never varies";
  }
  if (s.side === "defender" && defMoves === 1 && s.defender !== "static") {
    return "defense never moved, indistinguishable from static";
  }
  return null;
};
