// The questions Practice Lab 5 asks, and the scenarios they are asked about.
//
// Kept out of the component for the same reason Lab 3's and Lab 4's stage
// lists are: the question list *is* the design of the lab, and it has to be
// readable as a body of writing rather than hunted for inside JSX.
//
// THE STUDENT IS ALWAYS THE DEFENDER. The attacker is played by the machine.
// The only question that looks at the attacker's side at all is "name their
// strategy", which is a reading exercise, not a turn.
//
// Every scenario below is produced by the engine and checked by the gates in
// practiceScenarios.ts at module load. Nothing is a hardcoded table of moves,
// so the questions cannot drift away from the simulator the Example let the
// student play with. Several of these scenarios were chosen *because* the
// gate rejected the obvious alternative:
//
//   - Section 3's "name the attacker" needs seven rounds, not six. At six
//     the history is equally consistent with Reactive Best Response.
//   - Section 3's execute question lands on a value-weighted tie-break:
//     the attack counts are 2 and 2, so counting hits gives no answer and
//     only weighting by server value does.
//   - The counter questions use the horizons where one defense wins clearly.
//     Against a Frequency attacker at delta 0.8 the top two are separated by
//     0.001, which would mark a student wrong for a distinction nothing on
//     screen could reveal.

import type { AttackerStrategyId, DefenderStrategyId, Round } from "./repeated";
import { ATTACKER_STRATEGIES, DEFENDER_STRATEGIES } from "./repeated";
import {
  DEFENDERS,
  G,
  describeUnusableCounter,
  describeUnusableExecute,
  describeUnusableIdentify,
  makeCounter,
  makeExecute,
  makeIdentify,
  playScenario,
  strategyName,
} from "./practiceScenarios";

// ---------------------------------------------------------------------------
// Question shape
// ---------------------------------------------------------------------------

export type AnswerKind = "server" | "strategy" | "choice" | "number";

export interface Option {
  id: string;
  label: string;
}

export interface Question {
  id: string;
  kind: AnswerKind;
  points: number;
  /** The question itself. */
  prompt: string;
  /** Smaller text under it: what to take into account, never the answer. */
  detail?: string;
  /** How many rounds are on screen when this is asked. */
  revealTo: number;
  /** For "strategy": whose list to offer. */
  side?: "attacker" | "defender";
  /** For "choice". */
  options?: Option[];
  /** For "number": what to put after the field. */
  suffix?: string;
  /**
   * Accepted answers. A list rather than one value because ties are real:
   * three defenses score identically against a rotating attacker, and
   * marking a student wrong for picking the "other" optimal one would be a
   * lie about the game.
   */
  correct: string[];
  /** Absolute tolerance for "number". */
  tolerance?: number;
  /** Shown on the review screen, after everything is locked in. */
  explain: string;
}

export interface Block {
  id: string;
  /** Shown as the heading while this block is on screen. */
  title: string;
  /**
   * Setup prose, for a block with no rounds to show. A block that has a
   * section composes its own line in the component instead, so the strategy
   * name can be marked up rather than buried in a string.
   */
  blurb?: string;
  /** The played-out rounds, absent for the theory block. */
  section?: {
    attacker: AttackerStrategyId;
    defender: DefenderStrategyId;
    startServer: number;
    rounds: Round[];
    /** What the student is told they are running. */
    runningName: string;
  };
  questions: Question[];
}

// ---------------------------------------------------------------------------
// Scenario construction, with the gates asserted at load
// ---------------------------------------------------------------------------
//
// Failing loudly here is deliberate. These are fixed teaching scenarios, not
// generated ones, so a gate failure means someone retuned the game or a
// strategy and one of these questions quietly lost its answer. That should
// stop the lab from loading, not reach a student.

const gate = (why: string | null, where: string) => {
  if (why !== null) {
    throw new Error(`Practice Lab 5 scenario "${where}" is unusable: ${why}`);
  }
};

const S = G.servers;
const serverId = (i: number) => S[i].id;

// -- Section 1: greedy attacker, trigger defense, parked on S2 -----------
const E1_START = 1;
const E1_ROUNDS = 8;
const e1 = playScenario("greedy", "trigger", E1_START, E1_ROUNDS);
const e1Execute = makeExecute("greedy", "trigger", "trigger", E1_START, 2);
const e1Identify = makeIdentify("attacker", "greedy", "trigger", E1_START, 6);
gate(describeUnusableExecute(e1Execute), "E1 execute");
gate(describeUnusableIdentify(e1Identify), "E1 identify");

// -- Section 2: rotating attacker, the same trigger strategy -----------------
const E2_START = 1;
const E2_ROUNDS = 8;
const e2 = playScenario("rotation", "trigger", E2_START, E2_ROUNDS);
const e2Execute = makeExecute("rotation", "trigger", "trigger", E2_START, 3);
const e2Identify = makeIdentify("attacker", "rotation", "trigger", E2_START, 6);
const e2Counter = makeCounter("rotation", E2_START, 0.8, DEFENDERS);
gate(describeUnusableExecute(e2Execute), "E2 execute");
gate(describeUnusableIdentify(e2Identify), "E2 identify");
gate(describeUnusableCounter(e2Counter), "E2 counter");

// -- Section 3: a learning attacker, and counting back ------------------
const E3_START = 2;
const E3_ROUNDS = 9;
const e3 = playScenario("frequency", "frequency", E3_START, E3_ROUNDS);
const e3Execute = makeExecute(
  "frequency",
  "frequency",
  "frequency",
  E3_START,
  4,
);
// Seven rounds, not six: at six this history is equally consistent with
// Reactive Best Response, and the gate says so.
const e3Identify = makeIdentify(
  "attacker",
  "frequency",
  "frequency",
  E3_START,
  7,
);
const e3Counter = makeCounter("frequency", E3_START, 0.9, DEFENDERS);
gate(describeUnusableExecute(e3Execute), "E3 execute");
gate(describeUnusableIdentify(e3Identify), "E3 identify");
gate(describeUnusableCounter(e3Counter), "E3 counter");

// ---------------------------------------------------------------------------
// Option lists
// ---------------------------------------------------------------------------

export const ATTACKER_OPTIONS: Option[] = ATTACKER_STRATEGIES.map((s) => ({
  id: s.id,
  label: s.name,
}));

export const DEFENDER_OPTIONS: Option[] = DEFENDER_STRATEGIES.filter(
  (d) => d.id !== "manual",
).map((d) => ({ id: d.id, label: d.name }));

/** How many rounds each attack landed on, for the prose that needs it. */
const attackCounts = (rounds: Round[]) =>
  S.map((_, i) => rounds.filter((r) => r.attacked === i).length);

// ---------------------------------------------------------------------------
// The blocks
// ---------------------------------------------------------------------------

const e3CountsAt4 = attackCounts(e3.rounds.slice(0, 4));

/** Rounds in the visible window where the attacker walked into the honeypot.
 *  Counted rather than written out: the first draft of E1's hint said three
 *  and the real answer is four, which is exactly the kind of detail that goes
 *  stale the moment a scenario is retuned. */
const caughtWithin = (rounds: Round[], upTo: number) =>
  rounds.slice(0, upTo).filter((r) => r.caught).length;

export const BLOCKS: Block[] = [
  // =========================================================== ENGAGEMENT 1
  {
    id: "e1",
    title: "Section 1",

    section: {
      attacker: "greedy",
      defender: "trigger",
      startServer: E1_START,
      rounds: e1.rounds,
      runningName: "Trigger Defense",
    },
    questions: [
      {
        id: "e1-execute",
        kind: "server",
        points: 6,
        revealTo: 2,
        prompt: `Two rounds in. Where does your honeypot go in round 3?`,
        detail:
          "Apply your own strategy to the history above. Do not guess where you would like it to be.",
        correct: [serverId(e1Execute.answer)],
        explain:
          `${serverId(0)} was hit in both rounds, so the strategy fires and the ` +
          `honeypot moves to ${serverId(e1Execute.answer)}. This is the easy ` +
          "case: the condition is satisfied and the strategy says move.",
      },
      {
        id: "e1-identify",
        kind: "strategy",
        side: "attacker",
        points: 8,
        revealTo: 6,
        prompt: "What strategy is the attacker running?",
        detail: `You can see six rounds of their behaviour, including ${caughtWithin(e1.rounds, 6)} where the honeypot was sitting on top of them.`,
        options: ATTACKER_OPTIONS,
        correct: [e1Identify.answer],
        explain:
          `Greedy Attack. They took ${serverId(0)} every round, which is the ` +
          "best payoff on the board, and kept taking it even after the " +
          "honeypot landed there. A strategy that does not react to being " +
          "caught is not reading you at all.",
      },
      {
        id: "e1-cost",
        kind: "choice",
        points: 6,
        revealTo: 8,
        prompt:
          `Rounds 1 and 2 scored ${e1.rounds[0].ud} each before the strategy ` +
          `locked on at ${e1.rounds[2].ud}. What decides whether those two ` +
          "rounds actually cost you anything?",
        options: [
          { id: "delta", label: "The discount factor" },
          {
            id: "ch",
            label: "The honeypot cost, since it is paid every round",
          },
          { id: "none", label: "Nothing. Two bad rounds is two bad rounds" },
          { id: "n", label: "The number of servers on the network" },
        ],
        correct: ["delta"],
        explain:
          "The discount factor. Over a short horizon those two rounds are " +
          "most of the game and the strategy barely pays for itself. Over a long " +
          "one they are rounding error. The rounds are the same either way; " +
          "what changes is how much of the game they represent.",
      },
    ],
  },

  // =========================================================== ENGAGEMENT 2
  {
    id: "e2",
    title: "Section 2",

    section: {
      attacker: "rotation",
      defender: "trigger",
      startServer: E2_START,
      rounds: e2.rounds,
      runningName: "Trigger Defense",
    },
    questions: [
      {
        id: "e2-execute",
        kind: "server",
        points: 8,
        revealTo: 3,
        prompt: "Three rounds in. Where does your honeypot go in round 4?",
        detail:
          "Check the strategy's condition before you move. It is more specific than it first looks.",
        correct: [serverId(e2Execute.answer)],
        explain:
          `${serverId(e2Execute.answer)}, which is where it already is. The ` +
          "strategy fires only when the same server is hit twice *in a row*, and " +
          `the attacks went ${e2.rounds
            .slice(0, 3)
            .map((r) => serverId(r.attacked))
            .join(", ")}. No repeat, so no trigger, so hold. Chasing the ` +
          "last attack is the most common mistake here, and it is a " +
          "different strategy from the one you were given.",
      },
      {
        id: "e2-identify",
        kind: "strategy",
        side: "attacker",
        points: 8,
        revealTo: 6,
        prompt: "What strategy is the attacker running?",
        options: ATTACKER_OPTIONS,
        correct: [e2Identify.answer],
        explain:
          "Target Rotation. They cycle through a fixed list, which is the " +
          "cheapest possible way to stay unpredictable to a strategy that only " +
          "looks one round back.",
      },
      {
        id: "e2-why",
        kind: "choice",
        points: 7,
        revealTo: 8,
        prompt: "Your honeypot never moved the whole section. Why not?",
        options: [
          {
            id: "norepeat",
            label:
              "The strategy waits for the same server twice in a row, and this attacker never does that",
          },
          {
            id: "wrongstart",
            label: "The honeypot started on the wrong server",
          },
          {
            id: "random",
            label:
              "The attacker was picking at random, so there was no pattern to find",
          },
          {
            id: "short",
            label: "Eight rounds was not long enough for the strategy to react",
          },
        ],
        correct: ["norepeat"],
        explain:
          "There was a pattern, and it was an obvious one. Your strategy just " +
          "could not see it, because it only ever compares the last two " +
          "rounds. Any pattern longer than a strategy's memory is invisible to " +
          "it, and the attacker did not have to be clever to find that out.",
      },
      {
        id: "e2-counter",
        kind: "strategy",
        side: "defender",
        points: 9,
        revealTo: 8,
        prompt:
          "Against this same attacker, which defense would have done best over many rounds?",
        detail:
          "Assume a long horizon. One of these is clearly ahead of the rest.",
        options: DEFENDER_OPTIONS,
        correct: e2Counter.best,
        explain:
          `${strategyName("defender", e2Counter.best[0])}. It ignores the ` +
          "order of the attacks and only counts where they land, so a " +
          "rotation cannot hide from it. Note that Static, Trigger and " +
          `Reactive all score exactly ${e2Counter.options
            .find((o) => o.id === "static")!
            .total.toFixed(
              2,
            )} here: against this attacker a strategy that never ` +
          "fires and a strategy that is always one step behind are both just " +
          "standing still.",
      },
    ],
  },

  // =========================================================== ENGAGEMENT 3
  {
    id: "e3",
    title: "Section 3",

    section: {
      attacker: "frequency",
      defender: "frequency",
      startServer: E3_START,
      rounds: e3.rounds,
      runningName: "Frequency Response",
    },
    questions: [
      {
        id: "e3-execute",
        kind: "server",
        points: 9,
        revealTo: 4,
        prompt: "Four rounds in. Where does your honeypot go in round 5?",
        detail:
          "Counting the hits is not enough on its own. Your strategy is about what the attacks are costing you.",
        correct: [serverId(e3Execute.answer)],
        explain:
          `${serverId(e3Execute.answer)}, and it stays put. The attacks split ` +
          `${e3CountsAt4.filter((c) => c > 0).join(" and ")}, so a bare count ` +
          `ties. Weighting by what each server is worth breaks it: ` +
          `${serverId(0)} has cost you ${e3CountsAt4[0]} x ${S[0].value} = ` +
          `${e3CountsAt4[0] * S[0].value}, ${serverId(1)} only ` +
          `${e3CountsAt4[1]} x ${S[1].value} = ${e3CountsAt4[1] * S[1].value}.`,
      },
      {
        id: "e3-identify",
        kind: "strategy",
        side: "attacker",
        points: 8,
        revealTo: 7,
        prompt: "What strategy is the attacker running?",
        detail:
          "Watch what they do in the rounds right after your honeypot moves.",
        options: ATTACKER_OPTIONS,
        correct: [e3Identify.answer],
        explain:
          "Frequency Avoidance. They are keeping the same kind of running " +
          "count you are, but pointed the other way: the more often you " +
          "guard a server, the less it is worth attacking. Both of you are " +
          "learning, and each of you is chasing a target the other is moving.",
      },
      {
        id: "e3-counter",
        kind: "strategy",
        side: "defender",
        points: 9,
        revealTo: 9,
        prompt:
          "Against this learning attacker, which defense scores highest over many rounds?",
        detail: "Assume a long horizon.",
        options: DEFENDER_OPTIONS,
        correct: e3Counter.best,
        explain:
          `${strategyName("defender", e3Counter.best[0])}, at ` +
          `${e3Counter.options[0].total.toFixed(2)}. This one is worth ` +
          "sitting with, because the tempting answer is wrong: Randomized " +
          `Defense scores ${e3Counter.options
            .find((o) => o.id === "randomized")!
            .total.toFixed(2)} and loses. Being unreadable protects you from ` +
          "being exploited, but it also means you never exploit anybody, and " +
          "this attacker is predictable enough to be worth exploiting.",
      },
    ],
  },

  // ================================================================ THEORY
  {
    id: "horizon",
    title: "Section 4",
    blurb:
      "No rounds to read for these three. They are about what the first " +
      "three sections were showing you.",
    questions: [
      {
        id: "t-when",
        kind: "choice",
        points: 7,
        revealTo: 0,
        prompt: "When is adapting to a pattern NOT worth it?",
        options: [
          {
            id: "short",
            label:
              "When the horizon is short, because the rounds spent learning are most of the game",
          },
          { id: "predictable", label: "When the attacker is predictable" },
          { id: "ch", label: "When the honeypot is expensive to run" },
          {
            id: "never",
            label:
              "Never. Adapting is always at least as good as standing still",
          },
        ],
        correct: ["short"],
        explain:
          "A short horizon is one answer. There is a second one this lab " +
          "showed you: adapting also fails against an opponent who is " +
          "reading you back, because every deterministic strategy is itself a " +
          "pattern. That is why 'never' is wrong.",
      },
      {
        id: "t-short",
        kind: "choice",
        points: 7,
        revealTo: 0,
        prompt:
          "Your delta is close to 0: this run could end after almost any round. How should that change the way you defend?",
        options: [
          {
            id: "now",
            label:
              "Take the best payoff available right now, because there may be no future to spend on learning",
          },
          {
            id: "probe",
            label:
              "Spend the early rounds probing, so you can exploit them later",
          },
          {
            id: "random",
            label: "Randomize, since you cannot be read in a single round",
          },
          {
            id: "nothing",
            label: "It changes nothing. Delta only affects the attacker",
          },
        ],
        correct: ["now"],
        explain:
          "A low delta means it is nearly over. Anything that pays off " +
          "later, including every strategy that has to watch a few rounds " +
          "before it acts, is buying something you will probably never " +
          "collect. Probing is exactly the wrong answer here, and exactly " +
          "the right one when delta is high. That reversal is what the " +
          "number is for.",
      },
      {
        id: "t-probe",
        kind: "choice",
        points: 8,
        revealTo: 0,
        prompt:
          "Six rounds against a defense that never moves tell you much less about an attacker than six rounds against one that does. Why?",
        options: [
          {
            id: "noreact",
            label:
              "An attacker who reacts to your moves has nothing to react to, so several different strategies look identical",
          },
          {
            id: "worse",
            label:
              "A defense that never moves scores worse, so its data is less reliable",
          },
          {
            id: "fewer",
            label:
              "Attackers strike less often when the honeypot is not moving",
          },
          { id: "same", label: "They do not. Six rounds is six rounds" },
        ],
        correct: ["noreact"],
        explain:
          "Greedy Attack, Reactive Best Response and Frequency Avoidance all " +
          "behave identically against a defense that holds still, because " +
          "two of them are reacting to a signal that is not there. Moving " +
          "the honeypot is not only a defense, it is a question, and the " +
          "answer is what lets you tell those three apart.",
      },
    ],
  },
];

export const ALL_QUESTIONS: Question[] = BLOCKS.flatMap((b) => b.questions);

export const TOTAL_POINTS = ALL_QUESTIONS.reduce((n, q) => n + q.points, 0);

// The lab is advertised as being out of 100 and LabLayout scores it that way,
// so a stage list that does not add up is a bug rather than a preference.
if (TOTAL_POINTS !== 100) {
  throw new Error(
    `Practice Lab 5 questions total ${TOTAL_POINTS} points, expected 100.`,
  );
}

// ---------------------------------------------------------------------------
// Grading
// ---------------------------------------------------------------------------

/** True when `answer` is one of the accepted answers for `q`. */
export const isCorrect = (q: Question, answer: string | null): boolean => {
  if (answer === null || answer.trim() === "") return false;
  if (q.kind === "number") {
    const got = Number.parseFloat(answer.replace(/,/g, "").trim());
    if (!Number.isFinite(got)) return false;
    return q.correct.some(
      (c) => Math.abs(got - Number.parseFloat(c)) <= (q.tolerance ?? 0.001),
    );
  }
  return q.correct.includes(answer.trim());
};

export const scoreAnswers = (answers: Record<string, string | null>): number =>
  ALL_QUESTIONS.reduce(
    (sum, q) => sum + (isCorrect(q, answers[q.id] ?? null) ? q.points : 0),
    0,
  );

/** The label to print for a stored answer, which differs by kind. */
export const answerLabel = (q: Question, answer: string | null): string => {
  if (answer === null || answer.trim() === "") return "no answer";
  if (q.kind === "strategy" || q.kind === "choice") {
    const opts = q.options ?? [];
    return opts.find((o) => o.id === answer)?.label ?? answer;
  }
  return answer;
};
