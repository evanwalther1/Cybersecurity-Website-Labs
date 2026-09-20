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

interface RealPayoff {
  defender: number;
  attacker: number;
}

const toRealMatrix = (matrix: Payoff3x3[][]): RealPayoff[][] =>
  matrix.map((row) =>
    row.map((cell) => ({
      defender: cell.defender ?? 0,
      attacker: cell.attacker ?? 0,
    })),
  );

const LAB2_ACCENT = "#20c997";

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

const SERVER_MIN = 21;

const ServerMarks = [
  { value: 21 },
  { value: 30 },
  { value: 40 },
  { value: 50 },
];

const NonServerMarks = [
  { value: 0 },
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
  while (distractors.length < 3 && guard < 100) {
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

const randomMixPercent = (): number => {
  const options = [15, 20, 25, 30, 35, 40, 60, 65, 70, 75, 80, 85];
  return options[Math.floor(Math.random() * options.length)];
};

const calculateDefenderMaxmin = (matrix: RealPayoff[][]): number =>
  Math.max(
    Math.min(
      matrix[0][0].defender,
      matrix[0][1].defender,
      matrix[0][2].defender,
    ),
    Math.min(
      matrix[1][0].defender,
      matrix[1][1].defender,
      matrix[1][2].defender,
    ),
    Math.min(
      matrix[2][0].defender,
      matrix[2][1].defender,
      matrix[2][2].defender,
    ),
  );

const calculateAttackerMaxmin = (matrix: RealPayoff[][]): number =>
  Math.max(
    Math.min(
      matrix[0][0].attacker,
      matrix[1][0].attacker,
      matrix[2][0].attacker,
    ),
    Math.min(
      matrix[0][1].attacker,
      matrix[1][1].attacker,
      matrix[2][1].attacker,
    ),
    Math.min(
      matrix[0][2].attacker,
      matrix[1][2].attacker,
      matrix[2][2].attacker,
    ),
  );

const calculateDefenderMinmax = (matrix: RealPayoff[][]): number =>
  Math.min(
    Math.max(
      matrix[0][0].attacker,
      matrix[0][1].attacker,
      matrix[0][2].attacker,
    ),
    Math.max(
      matrix[1][0].attacker,
      matrix[1][1].attacker,
      matrix[1][2].attacker,
    ),
    Math.max(
      matrix[2][0].attacker,
      matrix[2][1].attacker,
      matrix[2][2].attacker,
    ),
  );

const calculateAttackerMinmax = (matrix: RealPayoff[][]): number =>
  Math.min(
    Math.max(
      matrix[0][0].defender,
      matrix[1][0].defender,
      matrix[2][0].defender,
    ),
    Math.max(
      matrix[0][1].defender,
      matrix[1][1].defender,
      matrix[2][1].defender,
    ),
    Math.max(
      matrix[0][2].defender,
      matrix[1][2].defender,
      matrix[2][2].defender,
    ),
  );

const computeAttackerQ = (matrix: RealPayoff[][]): number => {
  const a = matrix[0][0].defender; // Defend S1, Attack S1
  const b = matrix[0][1].defender; // Defend S1, Attack S2
  const c = matrix[1][0].defender; // Defend S2, Attack S1
  const d = matrix[1][1].defender; // Defend S2, Attack S2
  return (d - b) / (a - b - c + d);
};

const computeDefenderP = (matrix: RealPayoff[][]): number => {
  const e = matrix[0][0].attacker; // Defend S1, Attack S1
  const f = matrix[1][0].attacker; // Defend S2, Attack S1
  const g = matrix[0][1].attacker; // Defend S1, Attack S2
  const h = matrix[1][1].attacker; // Defend S2, Attack S2
  return (h - f) / (e - f - g + h);
};

interface Step {
  question: { defender: string; attacker: string };
  choices: { defender: string[]; attacker: string[] };
  correctAnswer: { defender: string; attacker: string };
  weight: number;
}

interface Page {
  Steps: (matrix: RealPayoff[][], s1: number, s2: number) => Step[];
}

const generatePages = (): Page[] => [
  {
    Steps: (matrix, s1, s2) => {
      const defenderGiven = ["Attack Server 1", "Attack Server 2", "No Action"][
        Math.floor(Math.random() * 3)
      ];
      const defenderBREasyAnswer =
        defenderGiven === "Attack Server 1"
          ? "Defend Server 1"
          : defenderGiven === "Attack Server 2"
            ? "Defend Server 2"
            : "No Action";

      const attackerGiven = ["Defend Server 1", "Defend Server 2", "No Action"][
        Math.floor(Math.random() * 3)
      ];
      const attackerBREasyAnswer =
        attackerGiven === "Defend Server 1"
          ? "Attack Server 2"
          : attackerGiven === "Defend Server 2"
            ? "Attack Server 1"
            : s1 >= s2
              ? "Attack Server 1"
              : "Attack Server 2";

      const attackS1Percent = randomMixPercent();
      const attackS2Percent = 100 - attackS1Percent;
      const aP1 = attackS1Percent / 100;
      const aP2 = attackS2Percent / 100;
      const evDefendS1 =
        aP1 * matrix[0][0].defender + aP2 * matrix[0][1].defender;
      const evDefendS2 =
        aP1 * matrix[1][0].defender + aP2 * matrix[1][1].defender;
      const evDefendNoAction =
        aP1 * matrix[2][0].defender + aP2 * matrix[2][1].defender;
      const defenderBRHardAnswer =
        evDefendS1 >= evDefendS2 && evDefendS1 >= evDefendNoAction
          ? "Defend Server 1"
          : evDefendS2 >= evDefendNoAction
            ? "Defend Server 2"
            : "No Action";

      const defendS1Percent = randomMixPercent();
      const defendS2Percent = 100 - defendS1Percent;
      const dP1 = defendS1Percent / 100;
      const dP2 = defendS2Percent / 100;
      const evAttackS1 =
        dP1 * matrix[0][0].attacker + dP2 * matrix[1][0].attacker;
      const evAttackS2 =
        dP1 * matrix[0][1].attacker + dP2 * matrix[1][1].attacker;
      const evAttackNoAction =
        dP1 * matrix[0][2].attacker + dP2 * matrix[1][2].attacker;
      const attackerBRHardAnswer =
        evAttackS1 >= evAttackS2 && evAttackS1 >= evAttackNoAction
          ? "Attack Server 1"
          : evAttackS2 >= evAttackNoAction
            ? "Attack Server 2"
            : "No Action";

      const pureNEDefenderChoices = shuffle([
        "No, whichever server I defend, the Attacker is always better off attacking the other undefended server, since exploiting it costs less than what it's worth.",
        "Yes, both players doing nothing is always the safest and most stable choice.",
        "No, because my honeypot cost is always higher than the Attacker's exploit cost.",
        "Yes, because I can always guess which server the Attacker will target.",
      ]);
      const pureNEAttackerChoices = shuffle([
        "No, whichever server the Defender defends, I'm always better off attacking the other undefended one, since it's worth more than what it costs me to exploit it.",
        "Yes, both players doing nothing is always the safest and most stable choice.",
        "No, because the Defender's honeypot cost is always higher than my exploit cost.",
        "Yes, because the Defender can always guess which server I'll target.",
      ]);

      const mixedQChoices = buildPercentChoices(computeAttackerQ(matrix));
      const mixedPChoices = buildPercentChoices(computeDefenderP(matrix));

      const defenderMaxminChoices = buildIntegerChoices(
        calculateDefenderMaxmin(matrix),
      );
      const attackerMaxminChoices = buildIntegerChoices(
        calculateAttackerMaxmin(matrix),
      );
      const defenderMinmaxChoices = buildIntegerChoices(
        calculateDefenderMinmax(matrix),
      );
      const attackerMinmaxChoices = buildIntegerChoices(
        calculateAttackerMinmax(matrix),
      );

      return [
        {
          question: {
            defender: `What is the Defender's Best Response if the Attacker chooses to play "${defenderGiven}"?`,
            attacker: `What is the Attacker's Best Response if the Defender chooses to play "${attackerGiven}"?`,
          },
          choices: {
            defender: shuffle([
              "Defend Server 1",
              "Defend Server 2",
              "No Action",
            ]),
            attacker: shuffle([
              "Attack Server 1",
              "Attack Server 2",
              "No Action",
            ]),
          },
          correctAnswer: {
            defender: defenderBREasyAnswer,
            attacker: attackerBREasyAnswer,
          },
          weight: 10,
        },
        {
          question: {
            defender: `What is the Defender's Best Response if the Attacker randomizes their strategy, choosing Attack Server 1 with ${attackS1Percent}% probability and Attack Server 2 with ${attackS2Percent}% probability?`,
            attacker: `What is the Attacker's Best Response if the Defender randomizes their strategy, choosing Defend Server 1 with ${defendS1Percent}% probability and Defend Server 2 with ${defendS2Percent}% probability?`,
          },
          choices: {
            defender: shuffle([
              "Defend Server 1",
              "Defend Server 2",
              "No Action",
            ]),
            attacker: shuffle([
              "Attack Server 1",
              "Attack Server 2",
              "No Action",
            ]),
          },
          correctAnswer: {
            defender: defenderBRHardAnswer,
            attacker: attackerBRHardAnswer,
          },
          weight: 15,
        },
        {
          question: {
            defender: "Is there a Pure Nash Equilibrium in this game?",
            attacker: "Is there a Pure Nash Equilibrium in this game?",
          },
          choices: {
            defender: pureNEDefenderChoices,
            attacker: pureNEAttackerChoices,
          },
          correctAnswer: {
            defender: pureNEDefenderChoices.find((choice) =>
              choice.startsWith("No, whichever server I defend"),
            )!,
            attacker: pureNEAttackerChoices.find((choice) =>
              choice.startsWith("No, whichever server the Defender defends"),
            )!,
          },
          weight: 15,
        },
        {
          question: {
            defender:
              "What is the Mixed-Strategy Nash Equilibrium probability that the Defender defends Server 1 (restricted to Defend S1 vs. Defend S2)?",
            attacker:
              "What is the Mixed-Strategy Nash Equilibrium probability that the Attacker attacks Server 1 (restricted to Attack S1 vs. Attack S2)?",
          },
          choices: {
            defender: mixedPChoices.choices,
            attacker: mixedQChoices.choices,
          },
          correctAnswer: {
            defender: mixedPChoices.correctAnswer,
            attacker: mixedQChoices.correctAnswer,
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
            defender: defenderMaxminChoices.correctAnswer,
            attacker: attackerMaxminChoices.correctAnswer,
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
            defender: defenderMinmaxChoices.correctAnswer,
            attacker: attackerMinmaxChoices.correctAnswer,
          },
          weight: 20,
        },
      ];
    },
  },
];

const DEFAULT_S1 = 25;
const DEFAULT_S2 = 25;
const DEFAULT_CH = 5;
const DEFAULT_CE = 5;

export const PracticeLab2 = ({ onSubmit }: PracticeLab2Props) => {
  const [matrix, setMatrix] = useState<Payoff3x3[][]>(generateBlankMatrix);
  const [isDefender, setIsDefender] = useState<boolean | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  const [s1, setS1] = useState(DEFAULT_S1);
  const [s2, setS2] = useState(DEFAULT_S2);
  const [ch, setCh] = useState(DEFAULT_CH);
  const [ce, setCe] = useState(DEFAULT_CE);

  const handleChChange = (_event: Event, value: number | number[]) => {
    const newCh = value as number;
    setCh(newCh);
    setS1((prev) => Math.max(prev, newCh + 1, SERVER_MIN));
    setS2((prev) => Math.max(prev, newCh + 1, SERVER_MIN));
  };

  const isS1Valid = s1 > ch;
  const isS2Valid = s2 > ch;
  const canStart = isDefender !== null && isS1Valid && isS2Valid;

  const [pages] = useState<Page[]>(generatePages);
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Map<number, string>>(
    new Map<number, string>(),
  );

  const role: "defender" | "attacker" = isDefender ? "defender" : "attacker";
  const steps = useMemo(
    () => pages[0].Steps(toRealMatrix(matrix), s1, s2),
    [pages, hasStarted],
  );
  const currentStep = steps[stepIndex];

  const handleStartLab = () => {
    if (!canStart) {
      return;
    }
    setMatrix(calculateLab2Matrix(s1, s2, ch, ce));
    setHasStarted(true);
  };

  const handleSelection = (choice: string) => {
    setSelectedAnswers((prev) => new Map(prev).set(stepIndex, choice));
  };

  const handleNextQuestion = () => {
    if (stepIndex === steps.length - 1) {
      return;
    }
    setStepIndex((index) => index + 1);
  };

  const handleGoBack = () => {
    if (stepIndex === 0) {
      return;
    }
    setStepIndex((index) => index - 1);
  };

  const handleLabSubmit = () => {
    let score = 0;
    const results = steps.map((step, index) => {
      const yourAnswer = selectedAnswers.get(index) ?? "(no answer)";
      const correctAnswer = step.correctAnswer[role];
      if (yourAnswer === correctAnswer) {
        score += step.weight;
      }
      return {
        question: step.question[role],
        yourAnswer,
        correctAnswer,
        isCorrect: yourAnswer === correctAnswer,
      };
    });
    onSubmit({ score, results });
  };

  const handleRestart = () => {
    setMatrix(generateBlankMatrix());
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
              min={Math.max(ch + 1, SERVER_MIN)}
              max={50}
              value={s1}
              step={1}
              marks={ServerMarks}
              valueLabelDisplay="on"
              sx={lab2SliderSx}
              onChange={(_event, value) => setS1(value as number)}
            />
            {!isS1Valid && (
              <p className="lab2-slider-error">
                Server 1's value must be greater than Ch.
              </p>
            )}

            <p className="lab2-slider-label">Server 2 Value</p>
            <Slider
              aria-label="Server 2 Value"
              min={Math.max(ch + 1, SERVER_MIN)}
              max={50}
              value={s2}
              step={1}
              marks={ServerMarks}
              valueLabelDisplay="on"
              sx={lab2SliderSx}
              onChange={(_event, value) => setS2(value as number)}
            />
            {!isS2Valid && (
              <p className="lab2-slider-error">
                Server 2's value must be greater than Ch.
              </p>
            )}

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
              onChange={handleChChange}
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
              {isDefender === null && (
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
