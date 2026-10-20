// The Practice Lab 4 conversation, as data.
//
// Same reasoning as Lab 3's practiceStages.ts: the question list *is* the
// design of the lab, so it lives outside the component where it can be checked
// offline (weights summing to 100, every stage having a reachable answer).
//
// The shape is different from Lab 3 though. Lab 4 is one long sequential
// derivation rather than a match, so this is a single growing transcript the
// student can scroll back through, not a sequence of self-contained turns.
//
// Voice: the attacker speaks when the question is about the attacker's
// reasoning, the defender speaks when it is about theirs. The student is
// always the defender, so answering an attacker-side question means modelling
// the opponent, which is the whole skill this lab teaches.

import {
  TRIAL_COVERAGE,
  asPercent,
  attackerEU,
  attackerLine,
  attackerPayoff,
  bestResponses,
  defenderEU,
  defenderLine,
  defenderOutcome,
  round2,
} from "./stackelberg";
import type { Player } from "./stackelberg";
import { formatLinear, linearMatches } from "./linearExpression";
import type { PracticeGame } from "./stackelberg";

export type AnswerKind =
  /** Pick one of several options. */
  | "choice"
  /** Type a linear expression, graded by meaning. */
  | "equation"
  /** Type a single number. */
  | "number"
  /** Type three percentages. */
  | "triple";

export interface StageOption {
  id: string;
  label: string;
}

export interface StageField {
  key: string;
  label: string;
  suffix?: string;
}

export interface Bubble {
  speaker: Player;
  text: string;
}

export interface Stage {
  id: string;
  /** Whose side the question bubble sits on. */
  speaker: Player;
  /** Lines spoken before the question, to set it up. */
  lead?: Bubble[];
  prompt: string;
  detail?: string;
  kind: AnswerKind;
  weight: number;
  options?: StageOption[];
  fields?: StageField[];
  /** Grades the stored answer string. */
  isCorrect: (answer: string) => boolean;
  /** The model answer, shown on the results page. */
  answerLabel: string;
  /** Renders whatever the student entered, for the transcript and results. */
  describe: (answer: string) => string;
}

// Answers are stored as plain strings so the whole attempt is one Map:
//   choice   -> option id
//   equation -> the raw text, graded by linearMatches
//   number   -> the raw text
//   triple   -> "a|b|c"
export type Answers = ReadonlyMap<string, string>;

export const TRIPLE_SEPARATOR = "|";

// ---------------------------------------------------------------------------
// Numeric grading
// ---------------------------------------------------------------------------

const toNumber = (raw: string): number | null => {
  const text = raw.trim().replace(/%/g, "").replace(/[−–]/g, "-");
  if (text === "") return null;
  // Allow a fraction, since several answers here are naturally fractional.
  const slash = text.indexOf("/");
  if (slash !== -1) {
    const top = Number(text.slice(0, slash));
    const bottom = Number(text.slice(slash + 1));
    if (!Number.isFinite(top) || !Number.isFinite(bottom) || bottom === 0) {
      return null;
    }
    return top / bottom;
  }
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
};

const numberMatches = (raw: string, expected: number, tolerance: number) => {
  const got = toNumber(raw);
  return got !== null && Math.abs(got - expected) <= tolerance;
};

/**
 * Percentages, graded to two decimal places as the question asks.
 *
 * Accepts either form: 27.27 or 0.2727. Students flip between them constantly
 * and the intent is unambiguous as long as the two readings cannot both be
 * plausible, which is why the decimal reading is only tried when the typed
 * number is at most 1.
 */
const percentMatches = (raw: string, expectedFraction: number) => {
  const got = toNumber(raw);
  if (got === null) return false;
  const asPercentPoints = expectedFraction * 100;
  if (Math.abs(got - asPercentPoints) <= 0.05) return true;
  return got <= 1 && Math.abs(got * 100 - asPercentPoints) <= 0.05;
};

// ---------------------------------------------------------------------------
// Stage list
// ---------------------------------------------------------------------------

const pct = (x: number) => asPercent(x, 2);

export const buildStages = (practice: PracticeGame): Stage[] => {
  const { game, equalizer } = practice;
  const S = game.servers;
  const covered = round2(defenderEU(game, [1, 1, 1], 0)); // same for every server
  const trialHit = bestResponses(game, TRIAL_COVERAGE)[0];
  const finalValue = round2(defenderOutcome(game, equalizer).value);

  const choice = (
    id: string,
    speaker: Player,
    prompt: string,
    weight: number,
    options: StageOption[],
    correctId: string,
    lead?: Bubble[],
    detail?: string,
  ): Stage => ({
    id,
    speaker,
    lead,
    prompt,
    detail,
    kind: "choice",
    weight,
    options,
    isCorrect: (a) => a === correctId,
    answerLabel: options.find((o) => o.id === correctId)?.label ?? "",
    describe: (a) => options.find((o) => o.id === a)?.label ?? "(no answer)",
  });

  const equation = (
    id: string,
    index: number,
    who: "attacker" | "defender",
    weight: number,
    prompt: string,
    detail: string,
  ): Stage => {
    const variable = `x${index + 1}`;
    const line = who === "attacker" ? attackerLine(game, index) : defenderLine(game, index);
    return {
      id,
      speaker: who,
      prompt,
      detail,
      kind: "equation",
      weight,
      fields: [{ key: "eq", label: `EU${who === "attacker" ? "a" : "d"}(${S[index].id})` }],
      isCorrect: (a) => linearMatches(a, variable, line),
      answerLabel: formatLinear(line, variable),
      describe: (a) => (a.trim() === "" ? "(no answer)" : a.trim()),
    };
  };

  return [
    // --- the two cases that every later formula is built from --------------
    choice(
      "covered-case",
      "attacker",
      "If I go after a server you have covered, what do I walk away with?",
      5,
      [
        {
          id: "sunk",
          label: "Nothing, but you still paid the cost of the exploit",
        },
        { id: "free", label: "Nothing, and the attempt costs you nothing" },
        {
          id: "full",
          label: "The full value; the honeypot only tells me you were there",
        },
        { id: "half", label: "Half the value" },
      ],
      "sunk",
      [
        {
          speaker: "defender",
          text: `I have one honeypot and three servers. Before I decide where it goes, I need to know what each one is actually worth to you.`,
        },
      ],
      
    ),
    ...S.map((server, i) =>
      equation(
        `eua-${server.id}`,
        i,
        "attacker",
        8,
        i === 0
          ? `Then write it out for me. ${server.id} is worth ${server.value} and costs me ${server.exploitCost} to reach. You cover it with probability x${i + 1}. What do I expect to earn there?`
          : `Same again for ${server.id}: worth ${server.value}, costs me ${server.exploitCost}, covered with probability x${i + 1}.`,
        `Covered I get ${attackerPayoff(game, i, true)}, uncovered I get ${attackerPayoff(game, i, false)}. Weigh each by how often it happens and simplify to one line in x${i + 1}.`,
      ),
    ),

    // --- the best response rule --------------------------------------------
    choice(
      "argmax",
      "attacker",
      "Three numbers, one decision. How do I choose between them?",
      5,
      [
        { id: "max", label: "You take whichever expected payoff is largest" },
        { id: "value", label: "You take the most valuable server" },
        { id: "cheap", label: "You take the server that is cheapest to reach" },
        { id: "least", label: "You take whichever server I cover least" },
      ],
      "max",
      undefined,
    ),

    choice(
      "trial-br",
      "defender",
      `Say I commit to x = (${TRIAL_COVERAGE.map((x) => asPercent(x, 0)).join(", ")}). Which server do you hit?`,
      7,
      // Deliberately bare. An earlier version printed the expected payoff
      // beside each server, which let the student pick the biggest number
      // without ever evaluating the lines they had just derived.
      S.map((server) => ({ id: server.id, label: server.id })),
      S[trialHit].id,
      [
        {
          speaker: "defender",
          text: "Good. Now I can test a commitment against you before I make it.",
        },
      ],
      "Put each coverage into the line you just derived for it.",
    ),

    // --- why equalize -------------------------------------------------------
    choice(
      "why-equalize",
      "defender",
      "I want coverage that leaves you as badly off as possible. If I leave one server strictly better than the other two, what happens?",
      6,
      [
        {
          id: "wasted",
          label:
            "You take that one, and the coverage I spent on the others bought me nothing",
        },
        { id: "spread", label: "You split your attack across all three" },
        { id: "mostcovered", label: "You take whichever server I covered most" },
        { id: "none", label: "You give up and do not attack at all" },
      ],
      "wasted",
      [
        {
          speaker: "attacker",
          text: `${asPercent(TRIAL_COVERAGE[0], 0)} on ${S[0].id} and I still clear ${round2(attackerEU(game, TRIAL_COVERAGE, trialHit))}. You are guarding the wrong things.`,
        },
      ],
    ),

    choice(
      "constraint",
      "defender",
      "So the coverage I want makes all three of your payoffs equal. That is two equations and I have three unknowns. What is the third?",
      4,
      [
        { id: "sum1", label: "x1 + x2 + x3 = 1" },
        { id: "sum0", label: "x1 + x2 + x3 = 0" },
        { id: "equal", label: "x1 = x2 = x3" },
        { id: "sumch", label: `x1 + x2 + x3 = Ch` },
      ],
      "sum1",
      undefined,
      "There is exactly one honeypot, and it has to end up somewhere.",
    ),

    // --- the solve ----------------------------------------------------------
    {
      id: "coverage",
      speaker: "defender",
      lead: [
        {
          speaker: "defender",
          text: "Three equations, three unknowns. Let me solve it.",
        },
      ],
      prompt: "What coverage should I commit to?",
      detail:
        "Set the three expected payoffs equal to a common value, write each coverage in terms of it, then use the budget to pin it down. Give each as a percentage rounded to two decimal places.",
      kind: "triple",
      weight: 15,
      fields: S.map((server, i) => ({
        key: `x${i + 1}`,
        label: `x${i + 1} (${server.id})`,
        suffix: "%",
      })),
      isCorrect: (a) => {
        const parts = a.split(TRIPLE_SEPARATOR);
        if (parts.length !== equalizer.length) return false;
        return equalizer.every((x, i) => percentMatches(parts[i] ?? "", x));
      },
      answerLabel: equalizer.map((x) => pct(x)).join(", "),
      describe: (a) => {
        const parts = a.split(TRIPLE_SEPARATOR).filter((p) => p.trim() !== "");
        return parts.length === 0
          ? "(no answer)"
          : parts.map((p) => `${p.trim()}%`).join(", ");
      },
    },

    // --- the defender's own side -------------------------------------------
    {
      id: "defender-covered",
      speaker: "defender",
      lead: [
        {
          speaker: "attacker",
          text: "Fine. But knowing where I will go is not the same as knowing what it costs you.",
        },
      ],
      prompt: "Fair. If you hit a server I have covered, what do I keep?",
      detail: `No damage is done, but the honeypot was paid for either way. The values you need are in the panel beside the network.`,
      kind: "number",
      weight: 4,
      fields: [{ key: "n", label: "Ud" }],
      isCorrect: (a) => numberMatches(a, covered, 0.01),
      answerLabel: String(covered),
      describe: (a) => (a.trim() === "" ? "(no answer)" : a.trim()),
    },

    ...S.map((server, i) =>
      equation(
        `eud-${server.id}`,
        i,
        "defender",
        7,
        `Now my expected utility at ${server.id}, as a line in x${i + 1}.`,
        `Covered I keep ${covered}, uncovered I keep ${round2(
          defenderEU(game, [0, 0, 0], i),
        )}. Same two-case weighting as before.`,
      ),
    ),

    {
      id: "final",
      speaker: "defender",
      lead: [
        {
          speaker: "defender",
          text: "Everything is in place. Let me put my own coverage into my own formula.",
        },
      ],
      prompt:
        "At the coverage I committed to, what do I actually expect to keep?",
      detail:
        "You made the attacker indifferent, so they could hit any server. Use the one that leaves you best off, which is the standard assumption for a leader who can always shift a sliver of coverage to make it so.",
      kind: "number",
      weight: 9,
      fields: [{ key: "n", label: "Ud" }],
      isCorrect: (a) => numberMatches(a, finalValue, 0.02),
      answerLabel: String(finalValue),
      describe: (a) => (a.trim() === "" ? "(no answer)" : a.trim()),
    },
  ];
};
