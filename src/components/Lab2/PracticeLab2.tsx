import { useMemo, useState } from "react";
import { CButton } from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilArrowLeft, cilArrowRight } from "@coreui/icons";
import { Slider } from "@mui/material";
import "../../styles/PayoffMatrix.css";
import "../../styles/PayoffMatrix3x3.css";
import "../../styles/LabPanel.css";
import "../../styles/PracticeLab1.css";
import "../../styles/ExampleLab2.css";
import type { LabResult } from "../../types/labResult";

interface PracticeLab2Props {
  onSubmit: (result: LabResult) => void;
}

interface Payoff3x3 {
  defender: number | null;
  attacker: number | null;
}

// Same shape as Payoff3x3 but non-nullable, used once the lab has started
// and the matrix is guaranteed built.
interface RealPayoff {
  defender: number;
  attacker: number;
}

const EPS = 1e-7;
const LAB2_ACCENT = "#20c997";

const DEFENDER_ACTIONS = ["Defend Server 1", "Defend Server 2", "No Action"];
const ATTACKER_ACTIONS = ["Attack Server 1", "Attack Server 2", "No Action"];

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
};

const ServerMarks = [
  { value: 1 },
  { value: 10 },
  { value: 20 },
  { value: 30 },
  { value: 40 },
  { value: 50 },
];

const NonServerMarks = [
  { value: 1 },
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

// Same rules/formulas as ExampleLab2's calculateLab2Matrix.
export const calculateLab2Matrix = (
  s1: number,
  s2: number,
  ch: number,
  ce: number,
): RealPayoff[][] => {
  const totalValue = s1 + s2;
  const serverValues = [s1, s2];

  const cellFor = (
    defenderAction: 0 | 1 | 2,
    attackerAction: 0 | 1 | 2,
  ): RealPayoff => {
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

// --- Question-generation helpers (same techniques as PracticeLab1.tsx) ---

const asPercent = (value: number): string => `${(value * 100).toFixed(1)}%`;

const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const buildPercentChoices = (
  correct: number,
): { choices: string[]; correctAnswer: string } => {
  const correctLabel = asPercent(correct);
  const candidates = [
    asPercent(1 - correct),
    asPercent(Math.max(0, Math.min(1, correct + 0.05))),
    asPercent(Math.max(0, Math.min(1, correct - 0.05))),
    "50.0%",
  ];

  const distractors: string[] = [];
  for (const candidate of candidates) {
    if (candidate !== correctLabel && !distractors.includes(candidate)) {
      distractors.push(candidate);
    }
    if (distractors.length === 3) break;
  }

  let guard = 0;
  while (distractors.length < 3 && guard < 200) {
    const randomOffset =
      (0.1 + Math.random() * 0.4) * (Math.random() < 0.5 ? -1 : 1);
    const randomLabel = asPercent(
      Math.max(0, Math.min(1, correct + randomOffset)),
    );
    if (randomLabel !== correctLabel && !distractors.includes(randomLabel)) {
      distractors.push(randomLabel);
    }
    guard += 1;
  }

  return {
    choices: shuffle([correctLabel, ...distractors]),
    correctAnswer: correctLabel,
  };
};

const buildIntegerChoices = (
  correct: number,
): { choices: string[]; correctAnswer: string } => {
  const correctLabel = String(correct);
  const candidates = [correct + 1, correct - 1, correct + 2, correct - 2];

  const distractors: string[] = [];
  for (const candidate of candidates) {
    const label = String(candidate);
    if (label !== correctLabel && !distractors.includes(label)) {
      distractors.push(label);
    }
    if (distractors.length === 3) break;
  }

  return {
    choices: shuffle([correctLabel, ...distractors]),
    correctAnswer: correctLabel,
  };
};

// Every index that ties for the maximum. Answers can legitimately tie (if
// S1 equals Ch, defending Server 1 and doing nothing are exactly as good),
// so every tied-optimal choice has to count as correct.
const argMaxIndices = (values: number[]): number[] => {
  const best = Math.max(...values);
  return values
    .map((value, index) => ({ value, index }))
    .filter((entry) => entry.value >= best - EPS)
    .map((entry) => entry.index);
};

// --- Nash equilibrium solver -------------------------------------------
// Support enumeration over equal-size supports, which finds every
// equilibrium of a non-degenerate bimatrix game. Degenerate value sets get
// rejected by the validity gate below rather than answered incorrectly.

interface Equilibrium {
  defender: number[];
  attacker: number[];
}

const SUPPORTS: number[][] = [
  [0],
  [1],
  [2],
  [0, 1],
  [0, 2],
  [1, 2],
  [0, 1, 2],
];

// Gauss-Jordan elimination, returns null when the system is singular.
const solveLinear = (rows: number[][], rhs: number[]): number[] | null => {
  const n = rhs.length;
  const m = rows.map((row, i) => [...row, rhs[i]]);

  for (let col = 0; col < n; col++) {
    let pivot = -1;
    let best = 1e-10;
    for (let row = col; row < n; row++) {
      if (Math.abs(m[row][col]) > best) {
        best = Math.abs(m[row][col]);
        pivot = row;
      }
    }
    if (pivot < 0) return null;
    [m[col], m[pivot]] = [m[pivot], m[col]];

    const pivotValue = m[col][col];
    for (let k = col; k <= n; k++) m[col][k] /= pivotValue;
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = m[row][col];
      if (factor === 0) continue;
      for (let k = col; k <= n; k++) m[row][k] -= factor * m[col][k];
    }
  }

  return m.map((row) => row[n]);
};

export const findEquilibria = (matrix: RealPayoff[][]): Equilibrium[] => {
  const found: Equilibrium[] = [];

  for (const defenderSupport of SUPPORTS) {
    for (const attackerSupport of SUPPORTS) {
      if (defenderSupport.length !== attackerSupport.length) continue;
      const size = defenderSupport.length;

      // The attacker's probabilities are pinned by making the defender
      // indifferent across the defender's own support, and vice versa.
      const attackerRows: number[][] = [];
      const attackerRhs: number[] = [];
      for (let t = 0; t + 1 < size; t++) {
        attackerRows.push(
          attackerSupport.map(
            (j) =>
              matrix[defenderSupport[t]][j].defender -
              matrix[defenderSupport[t + 1]][j].defender,
          ),
        );
        attackerRhs.push(0);
      }
      attackerRows.push(attackerSupport.map(() => 1));
      attackerRhs.push(1);
      const attackerSolution = solveLinear(attackerRows, attackerRhs);
      if (!attackerSolution) continue;

      const defenderRows: number[][] = [];
      const defenderRhs: number[] = [];
      for (let t = 0; t + 1 < size; t++) {
        defenderRows.push(
          defenderSupport.map(
            (i) =>
              matrix[i][attackerSupport[t]].attacker -
              matrix[i][attackerSupport[t + 1]].attacker,
          ),
        );
        defenderRhs.push(0);
      }
      defenderRows.push(defenderSupport.map(() => 1));
      defenderRhs.push(1);
      const defenderSolution = solveLinear(defenderRows, defenderRhs);
      if (!defenderSolution) continue;

      const defender = [0, 0, 0];
      const attacker = [0, 0, 0];
      defenderSupport.forEach((i, t) => (defender[i] = defenderSolution[t]));
      attackerSupport.forEach((j, t) => (attacker[j] = attackerSolution[t]));

      // Every strategy in the support must carry real weight.
      if (defenderSupport.some((i) => defender[i] <= EPS)) continue;
      if (attackerSupport.some((j) => attacker[j] <= EPS)) continue;

      // Nothing outside the support may beat what's inside it.
      const defenderPayoffs = [0, 1, 2].map((i) =>
        attacker.reduce((sum, w, j) => sum + w * matrix[i][j].defender, 0),
      );
      const attackerPayoffs = [0, 1, 2].map((j) =>
        defender.reduce((sum, w, i) => sum + w * matrix[i][j].attacker, 0),
      );
      const defenderBest = Math.max(...defenderPayoffs);
      const attackerBest = Math.max(...attackerPayoffs);
      if (defenderSupport.some((i) => defenderPayoffs[i] < defenderBest - EPS))
        continue;
      if (attackerSupport.some((j) => attackerPayoffs[j] < attackerBest - EPS))
        continue;

      const duplicate = found.some(
        (e) =>
          e.defender.every((v, i) => Math.abs(v - defender[i]) < 1e-6) &&
          e.attacker.every((v, j) => Math.abs(v - attacker[j]) < 1e-6),
      );
      if (!duplicate) found.push({ defender, attacker });
    }
  }

  return found;
};

// Cells where neither player can improve by switching on their own.
const findStableCells = (
  matrix: RealPayoff[][],
): { defenderAction: number; attackerAction: number }[] => {
  const cells: { defenderAction: number; attackerAction: number }[] = [];
  for (let d = 0; d < 3; d++) {
    for (let a = 0; a < 3; a++) {
      const columnBest = Math.max(
        matrix[0][a].defender,
        matrix[1][a].defender,
        matrix[2][a].defender,
      );
      const rowBest = Math.max(...matrix[d].map((cell) => cell.attacker));
      if (
        matrix[d][a].defender >= columnBest - EPS &&
        matrix[d][a].attacker >= rowBest - EPS
      ) {
        cells.push({ defenderAction: d, attackerAction: a });
      }
    }
  }
  return cells;
};

// What a student following this lab end to end would arrive at: check for a
// Pure N.E. first, otherwise run the three-variable mixed system and fall
// back to two variables when it isn't feasible.
const taughtSolution = (
  matrix: RealPayoff[][],
  s1: number,
  s2: number,
  ch: number,
  ce: number,
): Equilibrium => {
  const stable = findStableCells(matrix);
  if (stable.length > 0) {
    const defender = [0, 0, 0];
    const attacker = [0, 0, 0];
    defender[stable[0].defenderAction] = 1;
    attacker[stable[0].attackerAction] = 1;
    return { defender, attacker };
  }

  const threeWayDefender = [1 - ce / s1, 1 - ce / s2, ce / s1 + ce / s2 - 1];
  const threeWayAttacker = [ch / s1, ch / s2, 1 - ch / s1 - ch / s2];
  if (
    threeWayDefender.every((v) => v >= -EPS) &&
    threeWayAttacker.every((v) => v >= -EPS)
  ) {
    return { defender: threeWayDefender, attacker: threeWayAttacker };
  }

  const sz = s1 + s2;
  return {
    defender: [s1 / sz, s2 / sz, 0],
    attacker: [s2 / sz, s1 / sz, 0],
  };
};

interface GameContext {
  matrix: RealPayoff[][];
  s1: number;
  s2: number;
  ch: number;
  ce: number;
  equilibrium: Equilibrium;
}

// A value set is usable only when the game has exactly one equilibrium AND
// the method this lab teaches actually finds it. Anything else (ties that
// create several equilibria, or equilibria on supports this lab never
// covers) would mark a correct student answer wrong, so it gets rejected at
// Start Lab instead.
export const analyzeGame = (
  s1: number,
  s2: number,
  ch: number,
  ce: number,
): GameContext | null => {
  const matrix = calculateLab2Matrix(s1, s2, ch, ce);
  const equilibria = findEquilibria(matrix);
  if (equilibria.length !== 1) return null;

  const taught = taughtSolution(matrix, s1, s2, ch, ce);
  const matches =
    taught.defender.every(
      (v, i) => Math.abs(v - equilibria[0].defender[i]) < 1e-6,
    ) &&
    taught.attacker.every(
      (v, j) => Math.abs(v - equilibria[0].attacker[j]) < 1e-6,
    );
  if (!matches) return null;

  return { matrix, s1, s2, ch, ce, equilibrium: equilibria[0] };
};

interface Step {
  question: { defender: string; attacker: string };
  choices: { defender: string[]; attacker: string[] };
  // Every answer that counts as correct, so genuine ties are graded fairly.
  correctAnswer: { defender: string[]; attacker: string[] };
  weight: number;
}

interface Page {
  Steps: (game: GameContext) => Step[];
}

// Splits used for the "given a mix" question. 50/50 is left out because it
// makes the two servers symmetric and the answer ambiguous.
const MIX_SPLITS = [15, 20, 25, 30, 35, 40, 60, 65, 70, 75, 80, 85];

export const generatePages = (): Page[] => [
  {
    Steps: (game) => {
      const { matrix, equilibrium } = game;
      const rd = (row: number, col: number) => matrix[row][col].defender;
      const ra = (row: number, col: number) => matrix[row][col].attacker;

      // --- Best Response (easy): one fixed opponent action.
      const defenderBestAgainst = (attackerAction: number) =>
        argMaxIndices([
          rd(0, attackerAction),
          rd(1, attackerAction),
          rd(2, attackerAction),
        ]);
      const attackerBestAgainst = (defenderAction: number) =>
        argMaxIndices([
          ra(defenderAction, 0),
          ra(defenderAction, 1),
          ra(defenderAction, 2),
        ]);

      // Prefer a scenario with a single clear winner; fall back to any of
      // them (and accept every tied answer) if none is clean.
      const pickScenario = (best: (index: number) => number[]) => {
        const all = [0, 1, 2];
        const strict = all.filter((index) => best(index).length === 1);
        const pool = strict.length > 0 ? strict : all;
        return pool[Math.floor(Math.random() * pool.length)];
      };

      const defenderGiven = pickScenario(defenderBestAgainst);
      const attackerGiven = pickScenario(attackerBestAgainst);

      // --- Best Response (hard): opponent mixes over their two servers.
      const defenderBestAgainstMix = (weight: number) =>
        argMaxIndices([
          weight * rd(0, 0) + (1 - weight) * rd(0, 1),
          weight * rd(1, 0) + (1 - weight) * rd(1, 1),
          weight * rd(2, 0) + (1 - weight) * rd(2, 1),
        ]);
      const attackerBestAgainstMix = (weight: number) =>
        argMaxIndices([
          weight * ra(0, 0) + (1 - weight) * ra(1, 0),
          weight * ra(0, 1) + (1 - weight) * ra(1, 1),
          weight * ra(0, 2) + (1 - weight) * ra(1, 2),
        ]);

      const pickSplit = (best: (weight: number) => number[]) => {
        const strict = MIX_SPLITS.filter(
          (percent) => best(percent / 100).length === 1,
        );
        const pool = strict.length > 0 ? strict : MIX_SPLITS;
        return pool[Math.floor(Math.random() * pool.length)];
      };

      const attackerSplit = pickSplit(defenderBestAgainstMix);
      const defenderSplit = pickSplit(attackerBestAgainstMix);

      // --- Pure N.E.: the four candidate outcomes, one of which is true.
      const noPureStatement =
        "No, there is no Pure Nash Equilibrium: whichever single pair of strategies you check, at least one player always has a profitable switch.";
      const cellStatement = (d: number, a: number) =>
        `Yes, at (${DEFENDER_ACTIONS[d]}, ${ATTACKER_ACTIONS[a]}), neither player can improve their own payoff by switching on their own.`;
      const stableCells = findStableCells(matrix);
      const pureCorrect =
        stableCells.length > 0
          ? cellStatement(
              stableCells[0].defenderAction,
              stableCells[0].attackerAction,
            )
          : noPureStatement;
      const purePool = [
        noPureStatement,
        cellStatement(2, 2),
        cellStatement(2, 0),
        cellStatement(2, 1),
        cellStatement(0, 0),
        cellStatement(1, 1),
      ];
      const pureChoices = shuffle([
        pureCorrect,
        ...shuffle(purePool.filter((s) => s !== pureCorrect)).slice(0, 3),
      ]);

      // --- Mixed N.E.: read the answer straight off the real equilibrium.
      const defenderMixChoices = buildPercentChoices(equilibrium.defender[0]);
      const attackerMixChoices = buildPercentChoices(equilibrium.attacker[0]);

      // --- Maxmin / Minmax.
      const defenderMaxmin = Math.max(
        Math.min(rd(0, 0), rd(0, 1), rd(0, 2)),
        Math.min(rd(1, 0), rd(1, 1), rd(1, 2)),
        Math.min(rd(2, 0), rd(2, 1), rd(2, 2)),
      );
      const attackerMaxmin = Math.max(
        Math.min(ra(0, 0), ra(1, 0), ra(2, 0)),
        Math.min(ra(0, 1), ra(1, 1), ra(2, 1)),
        Math.min(ra(0, 2), ra(1, 2), ra(2, 2)),
      );
      const defenderMinmax = Math.min(
        Math.max(ra(0, 0), ra(0, 1), ra(0, 2)),
        Math.max(ra(1, 0), ra(1, 1), ra(1, 2)),
        Math.max(ra(2, 0), ra(2, 1), ra(2, 2)),
      );
      const attackerMinmax = Math.min(
        Math.max(rd(0, 0), rd(1, 0), rd(2, 0)),
        Math.max(rd(0, 1), rd(1, 1), rd(2, 1)),
        Math.max(rd(0, 2), rd(1, 2), rd(2, 2)),
      );

      const defenderMaxminChoices = buildIntegerChoices(defenderMaxmin);
      const attackerMaxminChoices = buildIntegerChoices(attackerMaxmin);
      const defenderMinmaxChoices = buildIntegerChoices(defenderMinmax);
      const attackerMinmaxChoices = buildIntegerChoices(attackerMinmax);

      return [
        {
          question: {
            defender: `What is the Defender's Best Response if the Attacker chooses to play "${ATTACKER_ACTIONS[defenderGiven]}"?`,
            attacker: `What is the Attacker's Best Response if the Defender chooses to play "${DEFENDER_ACTIONS[attackerGiven]}"?`,
          },
          choices: {
            defender: shuffle([...DEFENDER_ACTIONS]),
            attacker: shuffle([...ATTACKER_ACTIONS]),
          },
          correctAnswer: {
            defender: defenderBestAgainst(defenderGiven).map(
              (i) => DEFENDER_ACTIONS[i],
            ),
            attacker: attackerBestAgainst(attackerGiven).map(
              (i) => ATTACKER_ACTIONS[i],
            ),
          },
          weight: 10,
        },
        {
          question: {
            defender: `What is the Defender's Best Response if the Attacker randomizes their strategy, choosing Attack Server 1 with ${attackerSplit}% probability and Attack Server 2 with ${100 - attackerSplit}% probability?`,
            attacker: `What is the Attacker's Best Response if the Defender randomizes their strategy, choosing Defend Server 1 with ${defenderSplit}% probability and Defend Server 2 with ${100 - defenderSplit}% probability?`,
          },
          choices: {
            defender: shuffle([...DEFENDER_ACTIONS]),
            attacker: shuffle([...ATTACKER_ACTIONS]),
          },
          correctAnswer: {
            defender: defenderBestAgainstMix(attackerSplit / 100).map(
              (i) => DEFENDER_ACTIONS[i],
            ),
            attacker: attackerBestAgainstMix(defenderSplit / 100).map(
              (i) => ATTACKER_ACTIONS[i],
            ),
          },
          weight: 15,
        },
        {
          question: {
            defender: "Is there a Pure Nash Equilibrium in this game?",
            attacker: "Is there a Pure Nash Equilibrium in this game?",
          },
          choices: { defender: pureChoices, attacker: pureChoices },
          correctAnswer: {
            defender: [pureCorrect],
            attacker: [pureCorrect],
          },
          weight: 15,
        },
        {
          question: {
            defender:
              "In this game's Nash Equilibrium, what is the probability that the Defender defends Server 1?",
            attacker:
              "In this game's Nash Equilibrium, what is the probability that the Attacker attacks Server 1?",
          },
          choices: {
            defender: defenderMixChoices.choices,
            attacker: attackerMixChoices.choices,
          },
          correctAnswer: {
            defender: [defenderMixChoices.correctAnswer],
            attacker: [attackerMixChoices.correctAnswer],
          },
          weight: 25,
        },
        {
          question: {
            defender: "What is the Maxmin value for the Defender?",
            attacker: "What is the Maxmin value for the Attacker?",
          },
          choices: {
            defender: defenderMaxminChoices.choices,
            attacker: attackerMaxminChoices.choices,
          },
          correctAnswer: {
            defender: [defenderMaxminChoices.correctAnswer],
            attacker: [attackerMaxminChoices.correctAnswer],
          },
          weight: 15,
        },
        {
          question: {
            defender: "What is the Minmax value for the Defender?",
            attacker: "What is the Minmax value for the Attacker?",
          },
          choices: {
            defender: defenderMinmaxChoices.choices,
            attacker: attackerMinmaxChoices.choices,
          },
          correctAnswer: {
            defender: [defenderMinmaxChoices.correctAnswer],
            attacker: [attackerMinmaxChoices.correctAnswer],
          },
          weight: 20,
        },
      ];
    },
  },
];

const DEFAULT_S1 = 25;
const DEFAULT_S2 = 15;
const DEFAULT_CH = 4;
const DEFAULT_CE = 6;

export const PracticeLab2 = ({ onSubmit }: PracticeLab2Props) => {
  const [isDefender, setIsDefender] = useState<boolean | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  const [s1, setS1] = useState(DEFAULT_S1);
  const [s2, setS2] = useState(DEFAULT_S2);
  const [ch, setCh] = useState(DEFAULT_CH);
  const [ce, setCe] = useState(DEFAULT_CE);

  const [pages] = useState<Page[]>(generatePages);
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Map<number, string>>(
    new Map<number, string>(),
  );

  // Recomputed live as the sliders move, so Start Lab knows whether this
  // value set produces a game every question can be graded against.
  const game = useMemo(() => analyzeGame(s1, s2, ch, ce), [s1, s2, ch, ce]);
  const valuesAreUsable = game !== null;
  const canStart = isDefender !== null && valuesAreUsable;

  const matrix: Payoff3x3[][] =
    hasStarted && game ? game.matrix : generateBlankMatrix();

  const role: "defender" | "attacker" = isDefender ? "defender" : "attacker";
  // Frozen once the lab starts so shuffles and scenario picks stay put
  // while the student navigates back and forth.
  const steps = useMemo(
    () => (game ? pages[0].Steps(game) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pages, hasStarted],
  );
  const currentStep = steps[stepIndex];

  const handleStartLab = () => {
    if (!canStart) return;
    setHasStarted(true);
  };

  const handleSelection = (choice: string) => {
    setSelectedAnswers((prev) => new Map(prev).set(stepIndex, choice));
  };

  const handleNextQuestion = () => {
    if (stepIndex === steps.length - 1) return;
    setStepIndex((index) => index + 1);
  };

  const handleGoBack = () => {
    if (stepIndex === 0) return;
    setStepIndex((index) => index - 1);
  };

  const handleLabSubmit = () => {
    let score = 0;
    const results = steps.map((step, index) => {
      const yourAnswer = selectedAnswers.get(index) ?? "(no answer)";
      const accepted = step.correctAnswer[role];
      const isCorrect = accepted.includes(yourAnswer);
      if (isCorrect) score += step.weight;
      return {
        question: step.question[role],
        yourAnswer,
        correctAnswer: accepted.join(" or "),
        isCorrect,
      };
    });
    onSubmit({ score, results });
  };

  const handleRestart = () => {
    setIsDefender(null);
    setHasStarted(false);
    setS1(DEFAULT_S1);
    setS2(DEFAULT_S2);
    setCh(DEFAULT_CH);
    setCe(DEFAULT_CE);
    setStepIndex(0);
    setSelectedAnswers(new Map<number, string>());
  };

  return (
    <div className="lab-panel-columns">
      <div className="lab-panel-static">
        <div className="static-lab lab2-static-lab">
          <div className="lab2-variables-panel">
            <div className="lab2-variables-row">
              <span className="lab2-variables-label">S1</span>
              <span className="lab2-variables-value">
                {hasStarted ? s1 : "-"}
              </span>
            </div>
            <div className="lab2-variables-row">
              <span className="lab2-variables-label">S2</span>
              <span className="lab2-variables-value">
                {hasStarted ? s2 : "-"}
              </span>
            </div>
            <div className="lab2-variables-row">
              <span className="lab2-variables-label">Ch</span>
              <span className="lab2-variables-value">
                {hasStarted ? ch : "-"}
              </span>
            </div>
            <div className="lab2-variables-row">
              <span className="lab2-variables-label">Ce</span>
              <span className="lab2-variables-value">
                {hasStarted ? ce : "-"}
              </span>
            </div>
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
            <div className="matrix-sub-header matrix-col-sub-1">Server 1</div>
            <div className="matrix-sub-header matrix-col-sub-2">Server 2</div>
            <div className="matrix-sub-header matrix-col-sub-3">No Action</div>

            <div className="matrix-axis-label matrix-axis-defender-3x3">
              Defender
            </div>
            <div className="matrix-sub-header matrix-row-sub-1">Server 1</div>
            <div className="matrix-sub-header matrix-row-sub-2">Server 2</div>
            <div className="matrix-sub-header matrix-row-sub-3">No Action</div>

            {matrix.map((row, rowIndex) =>
              row.map((payoff, colIndex) => (
                <div
                  key={`cell-${rowIndex}-${colIndex}`}
                  className="matrix-cell"
                  style={{ gridColumn: colIndex + 3, gridRow: rowIndex + 3 }}
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
                </div>
              )),
            )}
          </div>

          <p className="matrix-legend">(Defender payoff, Attacker payoff)</p>
        </div>
      </div>

      <div className="lab-panel-divider" />

      <div className="lab-panel-dynamic">
        {!hasStarted ? (
          <div className="player-choice">
            <p className="player-choice-prompt">Choose Player</p>
            <div className="player-choice-buttons">
              <CButton color="primary" onClick={() => setIsDefender(true)}>
                Defender
              </CButton>
              <CButton color="danger" onClick={() => setIsDefender(false)}>
                Attacker
              </CButton>
            </div>

            <p className="lab2-slider-label">Server 1 Value</p>
            <Slider
              aria-label="Server 1 Value"
              min={1}
              max={50}
              value={s1}
              step={1}
              marks={ServerMarks}
              valueLabelDisplay="on"
              sx={lab2SliderSx}
              onChange={(_event, value) => setS1(value as number)}
            />

            <p className="lab2-slider-label">Server 2 Value</p>
            <Slider
              aria-label="Server 2 Value"
              min={1}
              max={50}
              value={s2}
              step={1}
              marks={ServerMarks}
              valueLabelDisplay="on"
              sx={lab2SliderSx}
              onChange={(_event, value) => setS2(value as number)}
            />

            <p className="lab2-slider-label">Honeypot Cost (Ch)</p>
            <Slider
              aria-label="Honeypot Cost"
              min={1}
              max={10}
              value={ch}
              step={1}
              marks={NonServerMarks}
              valueLabelDisplay="on"
              sx={lab2SliderSx}
              onChange={(_event, value) => setCh(value as number)}
            />

            <p className="lab2-slider-label">Exploit Cost (Ce)</p>
            <Slider
              aria-label="Exploit Cost"
              min={1}
              max={10}
              value={ce}
              step={1}
              marks={NonServerMarks}
              valueLabelDisplay="on"
              sx={lab2SliderSx}
              onChange={(_event, value) => setCe(value as number)}
            />

            <div className="dynamic-controls">
              <CButton
                style={{
                  backgroundColor: LAB2_ACCENT,
                  borderColor: LAB2_ACCENT,
                }}
                disabled={!canStart}
                onClick={handleStartLab}
              >
                Start Lab
              </CButton>
              {!valuesAreUsable && (
                <p className="lab2-slider-error">
                  This combination of values doesn't produce a game this lab
                  can grade. Please retry with different values.
                </p>
              )}
              {valuesAreUsable && isDefender === null && (
                <p className="lab2-slider-error">
                  Choose Defender or Attacker to start.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="practice-walkthrough lab2-dynamic">
            <div className="practice-role-row">
              <p className="practice-role">
                Playing as {isDefender ? "Defender" : "Attacker"}
              </p>
              <CButton
                color="danger"
                variant="outline"
                size="sm"
                className="practice-restart"
                onClick={handleRestart}
              >
                Restart
              </CButton>
            </div>

            <div className="practice-content">
              <div className="practice-question-block">
                <p className="practice-question">
                  {currentStep.question[role]}
                </p>
                <p className="practice-question-weight">
                  ({currentStep.weight} pts)
                </p>
              </div>

              <div className="practice-choices">
                {currentStep.choices[role].map((choice) => (
                  <button
                    type="button"
                    key={choice}
                    className={`practice-choice${
                      selectedAnswers.get(stepIndex) === choice
                        ? " selected"
                        : ""
                    }`}
                    onClick={() => handleSelection(choice)}
                  >
                    {choice}
                  </button>
                ))}
                {stepIndex === steps.length - 1 ? (
                  <CButton
                    color="success"
                    className="practice-submit"
                    onClick={handleLabSubmit}
                  >
                    Submit Lab
                  </CButton>
                ) : (
                  <></>
                )}
              </div>
            </div>

            <div className="dynamic-nav">
              <CButton
                color="secondary"
                onClick={handleGoBack}
                disabled={stepIndex === 0}
              >
                <CIcon icon={cilArrowLeft} />
              </CButton>
              <CButton
                color="secondary"
                onClick={handleNextQuestion}
                disabled={stepIndex === steps.length - 1}
              >
                <CIcon icon={cilArrowRight} />
              </CButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
