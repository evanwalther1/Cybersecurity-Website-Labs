import { useEffect, useMemo, useState } from "react";
import { CButton } from "@coreui/react";
import CIcon from "@coreui/icons-react";
import {
  cilArrowLeft,
  cilArrowRight,
  cilCheckCircle,
  cilLightbulb,
} from "@coreui/icons";
import "../../styles/PayoffMatrix.css";
import "../../styles/PayoffMatrix3x3.css";
import "../../styles/LabPanel.css";
import "../../styles/ExampleLab1.css";
import "../../styles/ExampleLab2.css";
import { Slider } from "@mui/material";

const LAB2_ACCENT = "#20c997";
const asPercent = (value: number): string => `${(value * 100).toFixed(1)}%`;
const roundTo2 = (value: number): number => Math.round(value * 100) / 100;
interface LabValues {
  s1: number;
  s2: number;
  ch: number;
  ce: number;
}
const PRIMARY_VALUES: LabValues = { s1: 45, s2: 30, ch: 4, ce: 7 };
const PURE_NE_ALT_VALUES: LabValues = { s1: 8, s2: 6, ch: 3, ce: 10 };
const MIXED3_ALT_VALUES: LabValues = { s1: 20, s2: 10, ch: 4, ce: 8 };


const solveTwoByTwo = (
  a1: number,
  b1: number,
  c1: number,
  a2: number,
  b2: number,
  c2: number,
): { x1: number; x2: number; x3: number } => {
  const determinant = a1 * b2 - a2 * b1;
  const x1 = (c1 * b2 - c2 * b1) / determinant;
  const x2 = (a1 * c2 - a2 * c1) / determinant;
  return { x1, x2, x3: 1 - x1 - x2 };
};

const solveDefenderMix3 = (matrix: Payoff3x3[][]) => {
  const ra = (row: number, col: number) => matrix[row][col].attacker ?? 0;
  const { x1, x2, x3 } = solveTwoByTwo(
    ra(0, 0) - ra(2, 0),
    ra(1, 0) - ra(2, 0),
    -ra(2, 0),
    ra(0, 1) - ra(2, 1),
    ra(1, 1) - ra(2, 1),
    -ra(2, 1),
  );
  return { p1: x1, p2: x2, p3: x3 };
};

const solveAttackerMix3 = (matrix: Payoff3x3[][]) => {
  const rd = (row: number, col: number) => matrix[row][col].defender ?? 0;
  const u = rd(0, 2) - rd(1, 2);
  const v = rd(0, 2) - rd(2, 2);
  const { x1, x2, x3 } = solveTwoByTwo(
    rd(0, 0) - rd(1, 0) - u,
    rd(0, 1) - rd(1, 1) - u,
    -u,
    rd(0, 0) - rd(2, 0) - v,
    rd(0, 1) - rd(2, 1) - v,
    -v,
  );
  return { q1: x1, q2: x2, q3: x3 };
};

const lab2SliderSx = {
  color: LAB2_ACCENT,
  height: 8,
  "& .MuiSlider-thumb": {
    height: 22,
    width: 22,
    backgroundColor: "#fff",
    border: `3px solid ${LAB2_ACCENT}`,
  },
  "& .MuiSlider-track": {
    height: 8,
    border: "none",
    backgroundColor: LAB2_ACCENT,
  },
  "& .MuiSlider-rail": {
    height: 8,
    opacity: 0.3,
  },
  "& .MuiSlider-valueLabel": {
    backgroundColor: LAB2_ACCENT,
  },
  "&.Mui-disabled": {
    color: LAB2_ACCENT,
  },
  "&.Mui-disabled .MuiSlider-thumb": {
    height: 22,
    width: 22,
    backgroundColor: "#fff",
    border: `3px solid ${LAB2_ACCENT}`,
  },
  "&.Mui-disabled .MuiSlider-track": {
    backgroundColor: LAB2_ACCENT,
  },
};

interface StepAlternate {
  label: string;
  values: LabValues;
  response: (matrix: Payoff3x3[][]) => React.ReactNode[];
  highlightCell?: { row: number; col: number };
  highlightServer?: { player: "defender" | "attacker"; server: 1 | 2 | 3 };
}

interface Step {
  question: string[];
  response: (matrix: Payoff3x3[][]) => React.ReactNode[];
  alternate?: StepAlternate;
  highlightCell?: { row: number; col: number };
  // server 3 = "No Action", alongside the two real servers.
  highlightServer?: { player: "defender" | "attacker"; server: 1 | 2 | 3 };
}

interface Page {
  topic: string;
  definition: string[];
  steps: Step[];
}

const generatePages = (): Page[] => [
  {
    topic: "Best Response",
    definition: [
      "In a non-zero-sum game, a player's Best Response is the strategy (or mix of strategies) that produces the highest possible individual payoff, given the specific strategies selected by the other players. " +
        "Unlike a zero-sum game where a opponent's loss perfectly mirrors your gain, the best response in a non-zero-sum form must independently balance maximizing your own gains against fixed system variables like server baselines and operational costs.",
    ],
    steps: [
      {
        question: [
          "What is the Defender's Best Response if the Attacker chooses to play No-Action?",
        ],
        response: (matrix) => {
          const sz = PRIMARY_VALUES.s1 + PRIMARY_VALUES.s2;
          const defendS1 = matrix[0][2].defender;
          const defendS2 = matrix[1][2].defender;
          const noAction = matrix[2][2].defender;
          return [
            "Look at the column where the Attacker plays No Action - nothing is being attacked, so damage (D) is 0 no matter which strategy the Defender picks. Compare the Defender's payoff across all three of their own strategies in that column.",
            `Defend Server 1: Rd = Sz - D - Ch = ${sz} - 0 - ${PRIMARY_VALUES.ch} = ${defendS1}.`,
            `Defend Server 2: Rd = Sz - D - Ch = ${sz} - 0 - ${PRIMARY_VALUES.ch} = ${defendS2}.`,
            `No Action: Rd = Sz - D - Ch = ${sz} - 0 - 0 = ${noAction}.`,
            <>
              The highest payoff is{" "}
              <strong className="dynamic-highlight">{noAction}</strong>, so the
              Defender's{" "}
              <strong className="dynamic-highlight">
                Best Response is No Action
              </strong>
              . Since the Attacker isn't attacking anything, running a honeypot
              on either server only costs Ch = {PRIMARY_VALUES.ch} for nothing
              in return - there's no reason to pay for defense that will never
              catch anything.
            </>,
          ];
        },
        highlightCell: { row: 2, col: 2 },
        highlightServer: { player: "defender", server: 3 },
      },
      {
        question: [
          "What is the Attacker's Best Response if the Defender randomizes their strategy, choosing Defend S1 with 70% probability and Defend S2 with 30% probability?",
        ],
        response: (matrix) => {
          const p1 = 0.7;
          const p2 = 0.3;
          const attackS1vsDefendS1 = matrix[0][0].attacker ?? 0;
          const attackS1vsDefendS2 = matrix[1][0].attacker ?? 0;
          const attackS2vsDefendS1 = matrix[0][1].attacker ?? 0;
          const attackS2vsDefendS2 = matrix[1][1].attacker ?? 0;
          const noActionVsDefendS1 = matrix[0][2].attacker ?? 0;
          const noActionVsDefendS2 = matrix[1][2].attacker ?? 0;

          const evAttackS1 = roundTo2(
            p1 * attackS1vsDefendS1 + p2 * attackS1vsDefendS2,
          );
          const evAttackS2 = roundTo2(
            p1 * attackS2vsDefendS1 + p2 * attackS2vsDefendS2,
          );
          const evNoAction = roundTo2(
            p1 * noActionVsDefendS1 + p2 * noActionVsDefendS2,
          );

          return [
            "Since the Defender is mixing between two strategies, the Attacker's Best Response is whichever pure strategy gives the highest expected payoff against that mix, found by multiplying each matchup's payoff by the probability of the Defender playing that strategy, then adding them up.",
            `Attack Server 1: E[Ra] = (0.7)(${attackS1vsDefendS1}) + (0.3)(${attackS1vsDefendS2}) = ${roundTo2(p1 * attackS1vsDefendS1)} + ${roundTo2(p2 * attackS1vsDefendS2)} = ${evAttackS1}.`,
            `Attack Server 2: E[Ra] = (0.7)(${attackS2vsDefendS1}) + (0.3)(${attackS2vsDefendS2}) = ${roundTo2(p1 * attackS2vsDefendS1)} + ${roundTo2(p2 * attackS2vsDefendS2)} = ${evAttackS2}.`,
            `No Action: E[Ra] = (0.7)(${noActionVsDefendS1}) + (0.3)(${noActionVsDefendS2}) = ${evNoAction}.`,
            <>
              The highest expected payoff is{" "}
              <strong className="dynamic-highlight">{evAttackS2}</strong>, so
              the Attacker's{" "}
              <strong className="dynamic-highlight">
                Best Response is to attack Server 2
              </strong>
              . Attacking Server 1 outright wins big on the 30% of the time the
              Defender happens to guess Server 2 (30%), but the Defender is
              defending Server 1 too often (70%) for that to pay off on average
              , therefore Server 2 is the safer bet against this particular mix.
            </>,
          ];
        },
        highlightServer: { player: "attacker", server: 2 },
      },
    ],
  },
  {
    topic: "Pure Nash Equilibrium",
    definition: [
      "A Pure Nash Equilibrium is a stable outcome where both players commit to one specific strategy, and neither player can improve their own payoff by unilaterally switching to a different strategy, given what the other player is doing.",
      "Unlike Lab 1's zero-sum game where a Pure Nash Equilibrium never exists, no matter the payoff values whether one exists here depends on the specific values chosen for S1, S2, Ch, and Ce. It isn't guaranteed to be absent (or present), it has to be checked for each configuration.",
    ],
    steps: [
      {
        question: ["Is there a Pure Nash Equilibrium in this game?"],
        response: (matrix) => {
          const rd = (row: number, col: number) =>
            matrix[row][col].defender ?? 0;
          const ra = (row: number, col: number) =>
            matrix[row][col].attacker ?? 0;

          return [
            "To check for a Pure Nash Equilibrium, look for one cell where neither player wants to switch strategies, a cell that's simultaneously the Defender's best response to the Attacker's column AND the Attacker's best response to the Defender's row.",
            `First, find the Defender's best response to each of the Attacker's three strategies (the highest Rd in each column): against Attack S1, the best is Defend S1 (${rd(0, 0)} beats ${rd(1, 0)} and ${rd(2, 0)}); against Attack S2, the best is Defend S2 (${rd(1, 1)} beats ${rd(0, 1)} and ${rd(2, 1)}); against No Action, the best is No Action (${rd(2, 2)} beats ${rd(0, 2)} and ${rd(1, 2)}).`,
            `Now check whether the Attacker is also happy with their choice in each of those three candidate cells (the highest Ra in that row): at (Defend S1, Attack S1) the Attacker earns ${ra(0, 0)}, but attacking Server 2 instead would earn ${ra(0, 1)} better, so this cell isn't stable. At (Defend S2, Attack S2) the Attacker earns ${ra(1, 1)}, but attacking Server 1 instead would earn ${ra(1, 0)} also better, so this isn't stable either. At (No Action, No Action) the Attacker earns ${ra(2, 2)}, but attacking Server 1 instead would earn ${ra(2, 0)} again better, so this isn't stable.`,
            <>
              None of the three candidate cells survive both checks, so{" "}
              <strong className="dynamic-highlight">
                there is no Pure Nash Equilibrium
              </strong>{" "}
              for these particular values of S1, S2, Ch, and Ce. A different
              set of values can produce a game that does have one, use the
              button below to run the same procedure on a set that does.
            </>,
          ];
        },
        alternate: {
          label: "See a version that has a Pure Nash Equilibrium",
          values: PURE_NE_ALT_VALUES,
          highlightCell: { row: 2, col: 2 },
          response: (matrix) => {
            const rd = (row: number, col: number) =>
              matrix[row][col].defender ?? 0;
            const ra = (row: number, col: number) =>
              matrix[row][col].attacker ?? 0;
            const { s1, s2, ch, ce } = PURE_NE_ALT_VALUES;

            return [
              `Same procedure, different numbers. The matrix on the left has been rebuilt with S1 = ${s1}, S2 = ${s2}, Ch = ${ch}, and Ce = ${ce}. The key change is that the exploit now costs ${ce}, which is more than either server is worth.`,
              `Start the same way, the Defender's best response to each Attacker column (the highest Rd in that column): against Attack S1 it's Defend S1 (${rd(0, 0)} beats ${rd(1, 0)} and ${rd(2, 0)}); against Attack S2 it's Defend S2 (${rd(1, 1)} beats ${rd(0, 1)} and ${rd(2, 1)}); against No Action it's No Action (${rd(2, 2)} beats ${rd(0, 2)} and ${rd(1, 2)}).`,
              `Now check the Attacker in each candidate cell. At (Defend S1, Attack S1) the Attacker earns ${ra(0, 0)}, and standing down would earn ${ra(0, 2)} instead, so they'd switch and this cell isn't stable. At (Defend S2, Attack S2) the Attacker earns ${ra(1, 1)} against ${ra(1, 2)} for No Action, so that one isn't stable either.`,
              `The third candidate is different. At (No Action, No Action) the Attacker earns ${ra(2, 2)}, and their alternatives are ${ra(2, 0)} for attacking Server 1 and ${ra(2, 1)} for attacking Server 2. Both are worse, so the Attacker stays put, and the Defender already prefers No Action in that column.`,
              <>
                Neither player wants to move, so this game{" "}
                <strong className="dynamic-highlight">
                  does have a Pure Nash Equilibrium
                </strong>
                , at (No Action, No Action), with payoffs of{" "}
                <strong className="dynamic-highlight">{rd(2, 2)}</strong> for
                the Defender and{" "}
                <strong className="dynamic-highlight">{ra(2, 2)}</strong> for
                the Attacker.
              </>,
              `In practical terms: the exploit costs ${ce} but the biggest prize on the network is only worth ${s1}, so attacking is a guaranteed loss no matter what the Defender does. A rational Attacker walks away, and once the Attacker is never going to attack, the Defender has no reason to pay ${ch} for a honeypot that will never catch anything. Both sides doing nothing is the stable outcome. That cost-versus-reward question is what Lab 1's zero-sum game never had, which is why a Pure Nash Equilibrium was impossible there but possible here.`,
            ];
          },
        },
      },
    ],
  },
  {
    topic: "Mixed Nash Equilibrium",
    definition: [
      "A Mixed Nash Equilibrium is an equilibrium where a player randomizes between two or more strategies according to specific probabilities, rather than committing to one, useful when no Pure Nash Equilibrium exists. Each player picks probabilities that make the other player indifferent between their own choices.",
      "With three strategies available (Server 1, Server 2, No Action), a player's mix needs two free variables (e.x: p1 and p2 for the first two strategies, with the third being 1 - (p1 + p2)) since all three probabilities must add up to 1. Before assuming all three strategies are actually used, that three-variable system has to be solved and checked: if it produces a negative probability, that strategy isn't part of the equilibrium, and the problem reduces to two strategies instead.",
      "Both outcomes are worth seeing, so each step below shows the same procedure twice: once on the values this lab started with, where the check fails and the mix collapses to two strategies, and once on a second set of values where the check passes and all three strategies stay in play.",
    ],
    steps: [
      {
        question: [
          "What is the Mixed-Strategy Nash Equilibrium probability for the Attacker?",
        ],
        response: (matrix) => {
          const raDS1_AS1 = matrix[0][0].attacker ?? 0;
          const raDS2_AS1 = matrix[1][0].attacker ?? 0;
          const raNoneD_AS1 = matrix[2][0].attacker ?? 0;
          const raDS1_AS2 = matrix[0][1].attacker ?? 0;
          const raDS2_AS2 = matrix[1][1].attacker ?? 0;
          const raNoneD_AS2 = matrix[2][1].attacker ?? 0;

          const A1 = raDS1_AS1 - raNoneD_AS1;
          const B1 = raDS2_AS1 - raNoneD_AS1;
          const C1 = -raNoneD_AS1;
          const A2 = raDS1_AS2 - raNoneD_AS2;
          const B2 = raDS2_AS2 - raNoneD_AS2;
          const C2 = -raNoneD_AS2;
          const determinant = A1 * B2 - A2 * B1;
          const d1 = (C1 * B2 - C2 * B1) / determinant;
          const d2 = (A1 * C2 - A2 * C1) / determinant;
          const d3 = 1 - d1 - d2;

          const a = matrix[0][0].defender ?? 0; // Defend S1, Attack S1
          const b = matrix[0][1].defender ?? 0; // Defend S1, Attack S2
          const c = matrix[1][0].defender ?? 0; // Defend S2, Attack S1
          const d = matrix[1][1].defender ?? 0; // Defend S2, Attack S2
          const q = (d - b) / (a - b - c + d);

          return [
            "Before restricting to two strategies, check whether the Attacker could rationally use all three (Attack S1, Attack S2, No Action) at once. That requires some Defender strategy: d1 = P(Defend S1), d2 = P(Defend S2), d3 = 1 - (d1 + d2) = P(No Action), that leaves the Attacker exactly indifferent between all three of their own options.",
            `Setting the Attacker's expected payoff from each strategy equal to their No Action payoff, which is always 0: ${raDS1_AS1}d1 + ${raDS2_AS1}d2 + ${raNoneD_AS1}d3 = 0 (from Attack S1), and ${raDS1_AS2}d1 + ${raDS2_AS2}d2 + ${raNoneD_AS2}d3 = 0 (from Attack S2).`,
            `Substituting d3 = 1 - d1 - d2 and solving both equations together gives d1 = ${d1.toFixed(3)} and d2 = ${d2.toFixed(3)}.`,
            <>
              Checking feasibility: d3 = 1 - d1 - d2 ={" "}
              <strong className="dynamic-highlight">{d3.toFixed(3)}</strong>.
              Since d3 is negative, no such Defender strategy exists, the
              probability p<sub>i</sub> &ge; 0 is violated. The Attacker can
              never actually be made indifferent across all three of their own
              strategies, so their equilibrium mix always concentrates on at
              most two.
            </>,
            "Restricting to Attack S1 vs. Attack S2 (Lab 1's exact method): find the value of q (the probability of attacking Server 1, with (1-q) for Server 2) that makes the Defender indifferent between defending Server 1 and defending Server 2.",
            `Expected payoff if the Defender defends Server 1: ${a}q + ${b}(1 - q)`,
            `Expected payoff if the Defender defends Server 2: ${c}q + ${d}(1 - q)`,
            `Set them equal: ${a}q + ${b}(1 - q) = ${c}q + ${d}(1 - q)`,
            `Simplify: ${a - b}q + ${b} = ${c - d}q + ${d}`,
            `Solve for q: ${a - b - (c - d)}q = ${d - b}`,
            <>
              q = <strong className="dynamic-highlight">{asPercent(q)}</strong>.
              The Attacker should attack Server 1 with probability{" "}
              {asPercent(q)} and Server 2 with probability {asPercent(1 - q)}.
            </>,
            "That feasibility check is the part worth remembering, it's what decides whether you're solving a three-strategy problem or a two-strategy one. Use the button below to run the same setup on a value set where the third strategy survives.",
          ];
        },
        alternate: {
          label: "See the three-strategy version",
          values: MIXED3_ALT_VALUES,
          response: (matrix) => {
            const rd = (row: number, col: number) =>
              matrix[row][col].defender ?? 0;
            const { s1, s2, ch, ce } = MIXED3_ALT_VALUES;
            const { q1, q2, q3 } = solveAttackerMix3(matrix);
            const indifferentValue = roundTo2(
              q1 * rd(0, 0) + q2 * rd(0, 1) + q3 * rd(0, 2),
            );

            return [
              `The matrix has been rebuilt with S1 = ${s1}, S2 = ${s2}, Ch = ${ch}, and Ce = ${ce}. Nothing about the method changes, only the numbers it's run on.`,
              "The Attacker's mix needs three probabilities: q1 = P(Attack S1), q2 = P(Attack S2), and q3 = 1 - (q1 + q2) = P(No Action). For the Attacker to be willing to spread across all three, the Defender has to be left indifferent between all three of the Defender's own strategies, so write out the Defender's expected payoff for each one.",
              `Defend Server 1: E[Rd] = ${rd(0, 0)}q1 + ${rd(0, 1)}q2 + ${rd(0, 2)}q3`,
              `Defend Server 2: E[Rd] = ${rd(1, 0)}q1 + ${rd(1, 1)}q2 + ${rd(1, 2)}q3`,
              `No Action: E[Rd] = ${rd(2, 0)}q1 + ${rd(2, 1)}q2 + ${rd(2, 2)}q3`,
              `Setting all three equal to each other and substituting q3 = 1 - q1 - q2 gives q1 = ${q1.toFixed(3)} and q2 = ${q2.toFixed(3)}.`,
              <>
                Now the feasibility check that failed last time: q3 = 1 - q1 -
                q2 ={" "}
                <strong className="dynamic-highlight">{q3.toFixed(3)}</strong>.
                This time it's positive, so all three probabilities are valid
                and the third strategy stays in the mix. No reduction to two
                strategies is needed.
              </>,
              <>
                The Attacker's Mixed Nash Equilibrium is a genuine three-way
                split:{" "}
                <strong className="dynamic-highlight">
                  {asPercent(q1)} Attack Server 1
                </strong>
                ,{" "}
                <strong className="dynamic-highlight">
                  {asPercent(q2)} Attack Server 2
                </strong>
                , and{" "}
                <strong className="dynamic-highlight">
                  {asPercent(q3)} No Action
                </strong>
                .
              </>,
              ];
          },
        },
      },
      {
        question: [
          "What is the Mixed-Strategy Nash Equilibrium probability for the Defender?",
        ],
        response: (matrix) => {
          const e = matrix[0][0].attacker ?? 0; // Defend S1, Attack S1
          const f = matrix[1][0].attacker ?? 0; // Defend S2, Attack S1
          const g = matrix[0][1].attacker ?? 0; // Defend S1, Attack S2
          const h = matrix[1][1].attacker ?? 0; // Defend S2, Attack S2
          const p = (h - f) / (e - f - g + h);

          return [
            "Since the Attacker can never spread across all three of their strategies (shown in the previous step), there's no Attacker strategy capable of making the Defender indifferent across all three Defender strategies either, so the Defender's mix also reduces to two variables.",
            "The same method applies to the Defender's mixing probability, p (the probability of defending Server 1, with (1-p) for Server 2), this time make the Attacker indifferent between attacking Server 1 and attacking Server 2.",
            `Expected payoff if the Attacker attacks Server 1: ${e}p + ${f}(1 - p)`,
            `Expected payoff if the Attacker attacks Server 2: ${g}p + ${h}(1 - p)`,
            `Set them equal: ${e}p + ${f}(1 - p) = ${g}p + ${h}(1 - p)`,
            `Simplify: ${e - f}p + ${f} = ${g - h}p + ${h}`,
            `Solve for p: ${e - f - (g - h)}p = ${h - f}`,
            <>
              p = <strong className="dynamic-highlight">{asPercent(p)}</strong>.
              The Defender should defend Server 1 with probability{" "}
              {asPercent(p)} and Server 2 with probability {asPercent(1 - p)}.
            </>,
            "As with the Attacker, this two-strategy answer is a consequence of these particular values. The button below runs the Defender's side on the same alternate value set from the previous step.",
          ];
        },
        alternate: {
          label: "See the three-strategy version",
          values: MIXED3_ALT_VALUES,
          response: (matrix) => {
            const ra = (row: number, col: number) =>
              matrix[row][col].attacker ?? 0;
            const { s1, s2, ch, ce } = MIXED3_ALT_VALUES;
            const { p1, p2, p3 } = solveDefenderMix3(matrix);
            const indifferentValue = roundTo2(
              p1 * ra(0, 0) + p2 * ra(1, 0) + p3 * ra(2, 0),
            );

            return [
              `Same alternate values as the previous step: S1 = ${s1}, S2 = ${s2}, Ch = ${ch}, Ce = ${ce}.`,
              "The Defender's mix needs three probabilities too: p1 = P(Defend S1), p2 = P(Defend S2), and p3 = 1 - (p1 + p2) = P(No Action). For the Attacker to be willing to spread across all three of their strategies, the Defender's mix has to leave the Attacker indifferent between Attack S1, Attack S2, and No Action.",
              "This is the exact same system that came out infeasible with the original values, the one that forced everything down to two strategies. The Attacker's No Action payoff is always 0, so both equations are set equal to 0.",
              `From Attack S1: ${ra(0, 0)}p1 + ${ra(1, 0)}p2 + ${ra(2, 0)}p3 = 0`,
              `From Attack S2: ${ra(0, 1)}p1 + ${ra(1, 1)}p2 + ${ra(2, 1)}p3 = 0`,
              `Substituting p3 = 1 - p1 - p2 and solving the two equations together gives p1 = ${p1.toFixed(3)} and p2 = ${p2.toFixed(3)}.`,
              <>
                Feasibility check: p3 = 1 - p1 - p2 ={" "}
                <strong className="dynamic-highlight">{p3.toFixed(3)}</strong>.
                Positive this time, so the Defender's three-way mix is valid
                too. With the original values this same number came out
                negative, which is what ruled the third strategy out.
              </>,
              <>
                The Defender's Mixed Nash Equilibrium is also a three-way
                split:{" "}
                <strong className="dynamic-highlight">
                  {asPercent(p1)} Defend Server 1
                </strong>
                ,{" "}
                <strong className="dynamic-highlight">
                  {asPercent(p2)} Defend Server 2
                </strong>
                , and{" "}
                <strong className="dynamic-highlight">
                  {asPercent(p3)} No Action
                </strong>
                .
              </>,
              ];
          },
        },
      },
    ],
  },
  {
    topic: "Maxmin",
    definition: [
      "The Maxmin Strategy is a plan of action where a player chooses the option that maximizes their own minimum possible payoff. It addresses the cautious, worst-case scenario, for each strategy a player could choose, look at the worst possible outcome it could lead to, then pick whichever strategy makes that worst-case outcome as good as possible.",
      "With three strategies (Server 1, Server 2, No Action) instead of Lab 1's two, the worst case for each strategy is now the minimum across all three of the opponent's responses, not just two.",
    ],
    steps: [
      {
        question: ["What is the Maxmin value for the Defender?"],
        response: (matrix) => {
          const rd = (row: number, col: number) =>
            matrix[row][col].defender ?? 0;
          const minDefendS1 = Math.min(rd(0, 0), rd(0, 1), rd(0, 2));
          const minDefendS2 = Math.min(rd(1, 0), rd(1, 1), rd(1, 2));
          const minNoAction = Math.min(rd(2, 0), rd(2, 1), rd(2, 2));
          const maxmin = Math.max(minDefendS1, minDefendS2, minNoAction);
          const bestStrategy =
            maxmin === minDefendS1
              ? "Defend Server 1"
              : maxmin === minDefendS2
                ? "Defend Server 2"
                : "No Action";

          return [
            "To find the Maxmin value for the Defender, look at the worst-case payoff (the minimum across all three Attacker responses) for each of the Defender's own three strategies, then pick whichever strategy makes that worst case as good as possible.",
            `Defend Server 1: worst case is min(${rd(0, 0)}, ${rd(0, 1)}, ${rd(0, 2)}) = ${minDefendS1}.`,
            `Defend Server 2: worst case is min(${rd(1, 0)}, ${rd(1, 1)}, ${rd(1, 2)}) = ${minDefendS2}.`,
            `No Action: worst case is min(${rd(2, 0)}, ${rd(2, 1)}, ${rd(2, 2)}) = ${minNoAction}.`,
            <>
              The best of these worst cases is{" "}
              <strong className="dynamic-highlight">{maxmin}</strong>, this is
              the Maxmin value. The maxmin strategy would therefore be to{" "}
              <strong className="dynamic-highlight">{bestStrategy}</strong>,
              guaranteeing at least this payoff no matter what the Attacker
              does.
            </>,
          ];
        },
      },
      {
        question: ["What is the Maxmin value for the Attacker?"],
        response: (matrix) => {
          const ra = (row: number, col: number) =>
            matrix[row][col].attacker ?? 0;
          const minAttackS1 = Math.min(ra(0, 0), ra(1, 0), ra(2, 0));
          const minAttackS2 = Math.min(ra(0, 1), ra(1, 1), ra(2, 1));
          const minNoAction = Math.min(ra(0, 2), ra(1, 2), ra(2, 2));
          const maxmin = Math.max(minAttackS1, minAttackS2, minNoAction);
          const bestStrategy =
            maxmin === minAttackS1
              ? "Attack Server 1"
              : maxmin === minAttackS2
                ? "Attack Server 2"
                : "No Action";

          return [
            "The same method applies to the Attacker, using the Attacker's own payoffs against all three of the Defender's possible responses.",
            `Attack Server 1: worst case is min(${ra(0, 0)}, ${ra(1, 0)}, ${ra(2, 0)}) = ${minAttackS1}.`,
            `Attack Server 2: worst case is min(${ra(0, 1)}, ${ra(1, 1)}, ${ra(2, 1)}) = ${minAttackS2}.`,
            `No Action: worst case is min(${ra(0, 2)}, ${ra(1, 2)}, ${ra(2, 2)}) = ${minNoAction}.`,
            <>
              The best of these worst cases is{" "}
              <strong className="dynamic-highlight">{maxmin}</strong>, this is
              the Maxmin value. The maxmin strategy would therefore be to{" "}
              <strong className="dynamic-highlight">{bestStrategy}</strong>,
              guaranteeing at least this payoff no matter what the Defender
              does.
            </>,
          ];
        },
      },
    ],
  },
  {
    topic: "Minmax",
    definition: [
      "The Minmax Strategy is the opposite of maxmin, it's a plan of action that minimizes the maximum possible payoff of an opponent. This strategy effectively limits how much the opponent can gain no matter how they respond.",
      "As with Maxmin, this now compares across all three of the opponent's strategies instead of two, and this is a different question from the Mixed Nash Equilibrium's optimal randomized strategy, it assumes a single fixed choice with no randomizing.",
    ],
    steps: [
      {
        question: ["What is the Minmax value for the Defender?"],
        response: (matrix) => {
          const ra = (row: number, col: number) =>
            matrix[row][col].attacker ?? 0;
          const maxDefendS1 = Math.max(ra(0, 0), ra(0, 1), ra(0, 2));
          const maxDefendS2 = Math.max(ra(1, 0), ra(1, 1), ra(1, 2));
          const maxNoAction = Math.max(ra(2, 0), ra(2, 1), ra(2, 2));
          const minmax = Math.min(maxDefendS1, maxDefendS2, maxNoAction);
          const bestStrategy =
            minmax === maxDefendS1
              ? "Defend Server 1"
              : minmax === maxDefendS2
                ? "Defend Server 2"
                : "No Action";

          return [
            "To find the Minmax value for the Defender, look at the best payoff the Attacker could get in response to each of the Defender's three strategies, then choose whichever Defender strategy keeps that as small as possible.",
            `If the Defender defends Server 1, the Attacker's best possible payoff is max(${ra(0, 0)}, ${ra(0, 1)}, ${ra(0, 2)}) = ${maxDefendS1}.`,
            `If the Defender defends Server 2, the Attacker's best possible payoff is max(${ra(1, 0)}, ${ra(1, 1)}, ${ra(1, 2)}) = ${maxDefendS2}.`,
            `If the Defender takes No Action, the Attacker's best possible payoff is max(${ra(2, 0)}, ${ra(2, 1)}, ${ra(2, 2)}) = ${maxNoAction}.`,
            <>
              The minimum of these is{" "}
              <strong className="dynamic-highlight">{minmax}</strong>, this is
              the Minmax value, therefore the Defender's Minmax strategy is{" "}
              <strong className="dynamic-highlight">{bestStrategy}</strong>,
              limiting the Attacker to at most this payoff.
            </>,
          ];
        },
      },
      {
        question: ["What is the Minmax value for the Attacker?"],
        response: (matrix) => {
          const rd = (row: number, col: number) =>
            matrix[row][col].defender ?? 0;
          const maxAttackS1 = Math.max(rd(0, 0), rd(1, 0), rd(2, 0));
          const maxAttackS2 = Math.max(rd(0, 1), rd(1, 1), rd(2, 1));
          const maxNoAction = Math.max(rd(0, 2), rd(1, 2), rd(2, 2));
          const minmax = Math.min(maxAttackS1, maxAttackS2, maxNoAction);
          const bestStrategy =
            minmax === maxAttackS1
              ? "Attack Server 1"
              : minmax === maxAttackS2
                ? "Attack Server 2"
                : "No Action";

          return [
            "The same method applies to the Attacker, look at the best payoff the Defender could get in response to each of the Attacker's three strategies, then choose whichever Attacker strategy keeps that as small as possible.",
            `If the Attacker attacks Server 1, the Defender's best possible payoff is max(${rd(0, 0)}, ${rd(1, 0)}, ${rd(2, 0)}) = ${maxAttackS1}.`,
            `If the Attacker attacks Server 2, the Defender's best possible payoff is max(${rd(0, 1)}, ${rd(1, 1)}, ${rd(2, 1)}) = ${maxAttackS2}.`,
            `If the Attacker takes No Action, the Defender's best possible payoff is max(${rd(0, 2)}, ${rd(1, 2)}, ${rd(2, 2)}) = ${maxNoAction}.`,
            <>
              The minimum of these is{" "}
              <strong className="dynamic-highlight">{minmax}</strong>, this is
              the Minmax value, therefore the Attacker's Minmax strategy is{" "}
              <strong className="dynamic-highlight">{bestStrategy}</strong>,
              limiting the Defender to at most this payoff.
            </>,
          ];
        },
      },
    ],
  },
];

interface Payoff3x3 {
  defender: number | null;
  attacker: number | null;
}

interface ClickedCell {
  row: number;
  col: number;
}

interface HighlightedServer {
  player: "defender" | "attacker";
  server: 1 | 2 | 3;
}

const calculateLab2Matrix = (
  s1: number,
  s2: number,
  ch: number,
  ce: number,
): Payoff3x3[][] => {
  const totalValue = s1 + s2;
  const serverValues = [s1, s2];

  const cellFor = (
    defenderAction: 0 | 1 | 2,
    attackerAction: 0 | 1 | 2,
  ): Payoff3x3 => {
    const defenderActed = defenderAction !== 2;
    const attackerActed = attackerAction !== 2;

    let damage = 0;
    if (attackerActed) {
      const targetedServerValue = serverValues[attackerAction];
      const attackWasCaught = defenderAction === attackerAction;
      damage = attackWasCaught ? 0 : targetedServerValue;
    }

    const honeypotCost = defenderActed ? ch : 0;
    const exploitCost = attackerActed ? ce : 0;

    return {
      defender: totalValue - damage - honeypotCost,
      attacker: damage - exploitCost,
    };
  };

  return [
    [cellFor(0, 0), cellFor(0, 1), cellFor(0, 2)],
    [cellFor(1, 0), cellFor(1, 1), cellFor(1, 2)],
    [cellFor(2, 0), cellFor(2, 1), cellFor(2, 2)],
  ];
};
const ServerMarks = [
  {
    value: 0,
  },
  { value: 10 },
  { value: 20 },
  { value: 30 },
  { value: 40 },
  { value: 50 },
];

const NonServerMarks = [
  {
    value: 0,
  },
  { value: 2 },
  { value: 4 },
  { value: 6 },
  { value: 8 },
  { value: 10 },
];

const blankPayoff = (): Payoff3x3 => ({ defender: null, attacker: null });

const generateBlankMatrix = (): Payoff3x3[][] => [
  [blankPayoff(), blankPayoff(), blankPayoff()],
  [blankPayoff(), blankPayoff(), blankPayoff()],
  [blankPayoff(), blankPayoff(), blankPayoff()],
];

export const ExampleLab2 = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [hasBegun, setHasBegun] = useState(false);
  const [showAlternate, setShowAlternate] = useState(false);
  const [clickedCell, setClickedCell] = useState<ClickedCell | null>(null);
  const [highlightedServer, setHighlightedServer] =
    useState<HighlightedServer | null>(null);

  const [pages] = useState<Page[]>(generatePages);
  const [pageIndex, setPageIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [revealedSteps, setRevealedSteps] = useState<Set<string>>(new Set());
  const [isComplete, setIsComplete] = useState(false);

  const currentPage = pages[pageIndex];
  const currentStep = currentPage?.steps[stepIndex];
  const currentStepKey = `${pageIndex}-${stepIndex}`;
  const isRevealed = revealedSteps.has(currentStepKey);
  const isLastStepInPage = stepIndex === currentPage.steps.length - 1;
  const isLastPage = pageIndex === pages.length - 1;
  const alternate = currentStep?.alternate;
  const isAlternateActive = showAlternate && alternate !== undefined;
  const activeValues =
    showAlternate && alternate ? alternate.values : PRIMARY_VALUES;

  const matrix = useMemo(
    () =>
      hasBegun
        ? calculateLab2Matrix(
            activeValues.s1,
            activeValues.s2,
            activeValues.ch,
            activeValues.ce,
          )
        : generateBlankMatrix(),
    [hasBegun, activeValues],
  );

  const activeHighlightCell =
    showAlternate && alternate
      ? alternate.highlightCell
      : currentStep?.highlightCell;
  const activeHighlightServer =
    showAlternate && alternate
      ? alternate.highlightServer
      : currentStep?.highlightServer;

  const isMixedNEPage = currentPage.topic === "Mixed Nash Equilibrium";
  const showAttackerMix = isRevealed && isMixedNEPage && stepIndex === 0;
  const showDefenderMix = isRevealed && isMixedNEPage && stepIndex === 1;
  const showThreeWayMix = isAlternateActive && isMixedNEPage && isRevealed;
  const attackerMix3 = solveAttackerMix3(matrix);
  const defenderMix3 = solveDefenderMix3(matrix);
  const mixedDefenderA = matrix[0][0].defender ?? 0; // Defend S1, Attack S1
  const mixedDefenderB = matrix[0][1].defender ?? 0; // Defend S1, Attack S2
  const mixedDefenderC = matrix[1][0].defender ?? 0; // Defend S2, Attack S1
  const mixedDefenderD = matrix[1][1].defender ?? 0; // Defend S2, Attack S2
  const mixedQ =
    (mixedDefenderD - mixedDefenderB) /
    (mixedDefenderA - mixedDefenderB - mixedDefenderC + mixedDefenderD);
  const mixedAttackerE = matrix[0][0].attacker ?? 0; // Defend S1, Attack S1
  const mixedAttackerF = matrix[1][0].attacker ?? 0; // Defend S2, Attack S1
  const mixedAttackerG = matrix[0][1].attacker ?? 0; // Defend S1, Attack S2
  const mixedAttackerH = matrix[1][1].attacker ?? 0; // Defend S2, Attack S2
  const mixedP =
    (mixedAttackerH - mixedAttackerF) /
    (mixedAttackerE - mixedAttackerF - mixedAttackerG + mixedAttackerH);

  const isCellSelected = (row: number, col: number) =>
    clickedCell?.row === row && clickedCell?.col === col;

  const isServerHighlighted = (
    player: "defender" | "attacker",
    server: 1 | 2 | 3,
  ) =>
    highlightedServer?.player === player &&
    highlightedServer?.server === server;

  const highlightServer = (
    player: "defender" | "attacker",
    server: 1 | 2 | 3,
  ) => {
    setHighlightedServer({ player, server });
  };

  const handleCellClick = (row: number, col: number) => {
    setClickedCell({ row, col });
  };

  const clearSelection = () => {
    setClickedCell(null);
    setHighlightedServer(null);
  };

  const handleBeginWalkthrough = () => {
    setHasBegun(true);
    setShowIntro(false);
  };

  const handleReveal = () => {
    setRevealedSteps((prev) => new Set(prev).add(currentStepKey));
  };


  useEffect(() => {
    setShowAlternate(false);
  }, [pageIndex, stepIndex, showIntro]);

  useEffect(() => {
    if (showIntro) {
      return;
    }
    clearSelection();
    if (!isRevealed) {
      return;
    }
    if (activeHighlightCell) {
      handleCellClick(activeHighlightCell.row, activeHighlightCell.col);
    }
    if (activeHighlightServer) {
      highlightServer(
        activeHighlightServer.player,
        activeHighlightServer.server,
      );
    }
  }, [pageIndex, stepIndex, showIntro, showAlternate, isRevealed]);

  const handleNextQuestion = () => {
    if (showIntro) {
      handleBeginWalkthrough();
      return;
    }
    if (isLastStepInPage && isLastPage) {
      setIsComplete(true);
      return;
    }
    if (isLastStepInPage) {
      setPageIndex((index) => index + 1);
      setStepIndex(0);
    } else {
      setStepIndex((index) => index + 1);
    }
    clearSelection();
  };

  const handleGoBack = () => {
    if (isComplete) {
      setIsComplete(false);
      return;
    }
    if (pageIndex === 0 && stepIndex === 0) {
      clearSelection();
      setShowIntro(true);
      return;
    }
    if (stepIndex === 0) {
      const previousPage = pages[pageIndex - 1];
      setStepIndex(previousPage.steps.length - 1);
      setPageIndex((index) => index - 1);
    } else {
      setStepIndex((index) => index - 1);
    }
  };

  return (
    <div className="lab-panel-columns">
      <div className="lab-panel-static">
        <div className="static-lab lab2-static-lab">
          <div
            className={`lab2-variables-panel${
              isAlternateActive ? " alternate" : ""
            }`}
          >
            <div className="lab2-variables-row">
              <span className="lab2-variables-label">S1</span>
              <span className="lab2-variables-value">
                {hasBegun ? activeValues.s1 : "-"}
              </span>
            </div>
            <div className="lab2-variables-row">
              <span className="lab2-variables-label">S2</span>
              <span className="lab2-variables-value">
                {hasBegun ? activeValues.s2 : "-"}
              </span>
            </div>
            <div className="lab2-variables-row">
              <span className="lab2-variables-label">Ch</span>
              <span className="lab2-variables-value">
                {hasBegun ? activeValues.ch : "-"}
              </span>
            </div>
            <div className="lab2-variables-row">
              <span className="lab2-variables-label">Ce</span>
              <span className="lab2-variables-value">
                {hasBegun ? activeValues.ce : "-"}
              </span>
            </div>
            {isAlternateActive && (
              <p className="lab2-variables-alt-note">Alternate values</p>
            )}
          </div>

          <div className="lab-graph">
            <svg
              className="lab-graph-lines"
              viewBox="0 0 280 150"
              preserveAspectRatio="xMidYMid meet"
            >
              <line x1="140" y1="35" x2="65" y2="120" />
              <line x1="140" y1="35" x2="215" y2="120" />
            </svg>
            <div className="graph-node graph-node-entry">Entry</div>
            <div className="graph-node graph-node-server graph-node-server-1">
              Server 1
            </div>
            <div className="graph-node graph-node-server graph-node-server-2">
              Server 2
            </div>
          </div>

          <div className="payoff-matrix-3x3">
            <div className="matrix-axis-label matrix-axis-attacker-3x3">
              Attacker
            </div>
            <div
              className={`matrix-sub-header matrix-col-sub-1${
                isServerHighlighted("attacker", 1) ? " selected" : ""
              }`}
            >
              <span className="mix-header-line">
                Server 1
                {showAttackerMix && (
                  <span className="mix-label">
                    {showThreeWayMix ? "(q1)" : "(q)"}
                  </span>
                )}
              </span>
              {showAttackerMix && (
                <span className="mix-percent">
                  {asPercent(showThreeWayMix ? attackerMix3.q1 : mixedQ)}
                </span>
              )}
            </div>
            <div
              className={`matrix-sub-header matrix-col-sub-2${
                isServerHighlighted("attacker", 2) ? " selected" : ""
              }`}
            >
              <span className="mix-header-line">
                Server 2
                {showAttackerMix && (
                  <span className="mix-label">
                    {showThreeWayMix ? "(q2)" : "(1-q)"}
                  </span>
                )}
              </span>
              {showAttackerMix && (
                <span className="mix-percent">
                  {asPercent(showThreeWayMix ? attackerMix3.q2 : 1 - mixedQ)}
                </span>
              )}
            </div>
            <div
              className={`matrix-sub-header matrix-col-sub-3${
                isServerHighlighted("attacker", 3) ? " selected" : ""
              }`}
            >
              <span className="mix-header-line">
                No Action
                {showAttackerMix && showThreeWayMix && (
                  <span className="mix-label">(q3)</span>
                )}
              </span>
              {showAttackerMix && showThreeWayMix && (
                <span className="mix-percent">
                  {asPercent(attackerMix3.q3)}
                </span>
              )}
            </div>

            <div className="matrix-axis-label matrix-axis-defender-3x3">
              Defender
            </div>
            <div
              className={`matrix-sub-header matrix-row-sub-1${
                isServerHighlighted("defender", 1) ? " selected" : ""
              }`}
            >
              <span className="mix-header-line">
                Server 1
                {showDefenderMix && (
                  <span className="mix-label">
                    {showThreeWayMix ? "(p1)" : "(p)"}
                  </span>
                )}
              </span>
              {showDefenderMix && (
                <span className="mix-percent">
                  {asPercent(showThreeWayMix ? defenderMix3.p1 : mixedP)}
                </span>
              )}
            </div>
            <div
              className={`matrix-sub-header matrix-row-sub-2${
                isServerHighlighted("defender", 2) ? " selected" : ""
              }`}
            >
              <span className="mix-header-line">
                Server 2
                {showDefenderMix && (
                  <span className="mix-label">
                    {showThreeWayMix ? "(p2)" : "(1-p)"}
                  </span>
                )}
              </span>
              {showDefenderMix && (
                <span className="mix-percent">
                  {asPercent(showThreeWayMix ? defenderMix3.p2 : 1 - mixedP)}
                </span>
              )}
            </div>
            <div
              className={`matrix-sub-header matrix-row-sub-3${
                isServerHighlighted("defender", 3) ? " selected" : ""
              }`}
            >
              <span className="mix-header-line">
                No Action
                {showDefenderMix && showThreeWayMix && (
                  <span className="mix-label">(p3)</span>
                )}
              </span>
              {showDefenderMix && showThreeWayMix && (
                <span className="mix-percent">
                  {asPercent(defenderMix3.p3)}
                </span>
              )}
            </div>

            {matrix.map((row, rowIndex) =>
              row.map((payoff, colIndex) => (
                <button
                  type="button"
                  key={`cell-${rowIndex}-${colIndex}`}
                  className={`matrix-cell${
                    isCellSelected(rowIndex, colIndex) ? " selected" : ""
                  }`}
                  style={{ gridColumn: colIndex + 3, gridRow: rowIndex + 3 }}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  (
                  <span className="tuple-element">
                    {payoff.defender ?? "-"}
                  </span>
                  ,{" "}
                  <span className="tuple-element">
                    {payoff.attacker ?? "-"}
                  </span>
                  )
                </button>
              )),
            )}
          </div>

          <p className="matrix-legend">(Defender payoff, Attacker payoff)</p>
        </div>
      </div>

      <div className="lab-panel-divider" />

      <div className="lab-panel-dynamic">
        <div className="dynamic-walkthrough lab2-dynamic">
          <div className="dynamic-content">
            {showIntro && (
              <div className="dynamic-intro">
                <div className="dynamic-definition">
                  <CIcon
                    icon={cilLightbulb}
                    className="dynamic-definition-icon"
                  />
                  <div>
                    <p>
                      This game still uses a payoff matrix in{" "}
                      <strong>Normal Form</strong>, but now each player has a
                      third option, <strong>No Action</strong>, alongside their
                      two servers. This results in a <strong>3x3 matrix</strong>{" "}
                      instead of Lab 1's 2x2.
                    </p>
                  </div>
                </div>

                <p className="dynamic-topic">Non-Zero-Sum Game (Normal Form)</p>
                <p className="dynamic-intro-text">
                  In Lab 1's zero-sum game, one player's gain was always exactly
                  the other player's loss, the payoffs always added up to zero.
                  In a non-zero sum game each players' payoff are now calculated
                  independently and no longer have to cancel out.
                </p>
                <p className="dynamic-intro-text">
                  We introduce two new variables: a honeypot cost{" "}
                  <strong>Ch</strong> for the Defender, and an exploit cost{" "}
                  <strong>Ce</strong> for the Attacker. Each player's result is
                  calculated separately: <strong>Rd = (Sz - D - Ch)</strong> for
                  the Defender (the total network value, minus damage, minus the
                  honeypot cost), and <strong>Ra = (D - Ce)</strong> for the
                  Attacker (damage minus the exploit cost). For this game each
                  servers' value is equal to the damage, thus S1 = D1 and S2 =
                  D2. You might notice that the defenders payoffs are calculated
                  using the networks total value instead of in Lab1 where only
                  the targeted server mattered. This is because the defender's
                  job is to keep the entire network in mind instead of just a
                  single node.
                </p>
                <p className="dynamic-intro-text">
                  In this example S1, S2, Ch, and Ce are set for you down below
                  , there will be an opportunity to configure these values for
                  yourself in the practice tab.
                </p>
                <p className="lab2-slider-label">Server 1 Value</p>
                <Slider
                  aria-label="Always visible"
                  min={1}
                  max={50}
                  defaultValue={PRIMARY_VALUES.s1}
                  step={1}
                  marks={ServerMarks}
                  disabled
                  valueLabelDisplay="on"
                  sx={lab2SliderSx}
                ></Slider>
                <p className="lab2-slider-label">Server 2 Value</p>
                <Slider
                  aria-label="Always visible"
                  min={1}
                  max={50}
                  defaultValue={PRIMARY_VALUES.s2}
                  step={1}
                  marks={ServerMarks}
                  disabled
                  valueLabelDisplay="on"
                  sx={lab2SliderSx}
                ></Slider>
                <p className="lab2-slider-label">Honeypot Cost (Ch)</p>
                <Slider
                  disabled
                  aria-label="Always visible"
                  min={1}
                  max={10}
                  defaultValue={PRIMARY_VALUES.ch}
                  step={1}
                  marks={NonServerMarks}
                  valueLabelDisplay="on"
                  sx={lab2SliderSx}
                ></Slider>
                <p className="lab2-slider-label">Exploit Cost (Ce)</p>
                <Slider
                  aria-label="Always visible"
                  min={1}
                  max={10}
                  defaultValue={PRIMARY_VALUES.ce}
                  step={1}
                  disabled
                  marks={NonServerMarks}
                  valueLabelDisplay="on"
                  sx={lab2SliderSx}
                ></Slider>
                <div className="dynamic-controls">
                  <CButton
                    style={{
                      backgroundColor: LAB2_ACCENT,
                      borderColor: LAB2_ACCENT,
                    }}
                    onClick={handleBeginWalkthrough}
                  >
                    Begin Walkthrough
                  </CButton>
                </div>
              </div>
            )}

            {!showIntro && isComplete && (
              <div className="dynamic-finish">
                <p className="dynamic-finish-title">Walkthrough complete!</p>
                <p className="dynamic-finish-subtitle">
                  Good job, you've walked through every concept in this lab.
                </p>
                <div className="concepts-learned">
                  <p className="concepts-learned-title">Concepts learned</p>
                  <ul className="concepts-learned-list">
                    {pages.map((page) => (
                      <li key={page.topic}>
                        <CIcon
                          icon={cilCheckCircle}
                          className="concepts-learned-icon"
                        />
                        <span>{page.topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="dynamic-finish-subtitle">
                  Practice is open to work through these concepts yourself.
                </p>
              </div>
            )}

            {!showIntro && !isComplete && (
              <>
                <div className="dynamic-definition">
                  <CIcon
                    icon={cilLightbulb}
                    className="dynamic-definition-icon"
                  />
                  <div>
                    {currentPage.definition.map((line, index) => (
                      <p key={`definition-${index}`}>{line}</p>
                    ))}
                  </div>
                </div>

                <p className="dynamic-topic">{currentPage.topic}</p>

                {currentStep.question.map((line, index) => (
                  <p className="dynamic-question" key={`question-${index}`}>
                    {line}
                  </p>
                ))}

                {isRevealed &&
                  (showAlternate && alternate
                    ? alternate.response(matrix)
                    : currentStep.response(matrix)
                  ).map((line, index) => (
                    <p className="dynamic-response" key={`response-${index}`}>
                      {line}
                    </p>
                  ))}

                <div className="dynamic-controls">
                  {!isRevealed && (
                    <CButton
                      style={{
                        backgroundColor: LAB2_ACCENT,
                        borderColor: LAB2_ACCENT,
                      }}
                      onClick={handleReveal}
                    >
                      Show Answer
                    </CButton>
                  )}
                  {isRevealed && alternate && !showAlternate && (
                    <CButton
                      style={{
                        backgroundColor: LAB2_ACCENT,
                        borderColor: LAB2_ACCENT,
                      }}
                      onClick={() => setShowAlternate(true)}
                    >
                      {alternate.label}
                    </CButton>
                  )}
                  {isRevealed && alternate && showAlternate && (
                    <CButton
                      color="secondary"
                      variant="outline"
                      onClick={() => setShowAlternate(false)}
                    >
                      Back to the original values
                    </CButton>
                  )}
                </div>
              </>
            )}
          </div>
          {!showIntro && (
            <div className="dynamic-nav">
              <CButton
                color="secondary"
                onClick={handleGoBack}
                disabled={showIntro}
              >
                <CIcon icon={cilArrowLeft} />
              </CButton>
              <CButton
                color="secondary"
                onClick={handleNextQuestion}
                disabled={
                  !showIntro && (isComplete || (!isRevealed && !isLastPage))
                }
              >
                <CIcon icon={cilArrowRight} />
              </CButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
