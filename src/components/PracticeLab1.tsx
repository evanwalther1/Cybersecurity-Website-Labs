import { useMemo, useState } from "react";
import { CBadge, CButton, CFormTextarea } from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilArrowLeft, cilArrowRight } from "@coreui/icons";
import "../styles/PayoffMatrix.css";
import "../styles/LabPanel.css";
import "../styles/PracticeLab1.css";
import {
  usePayoffMatrix,
  asPercent,
  computeAttackerQ,
  computeDefenderP,
  calculateDefenderMaxmin,
  calculateAttackerMaxmin,
  calculateDefenderMinmax,
  calculateAttackerMinmax,
} from "../hooks/usePayoffMatrix";
import type { Payoff } from "../hooks/usePayoffMatrix";
import type { LabResult } from "../types/labResult";

interface Props {
  onSubmit: (result: LabResult) => void;
}

interface Step {
  question: { defender: string; attacker: string };
  choices: { defender: string[]; attacker: string[] };
  correctAnswer: { defender: string; attacker: string };
  weight: number;
}

interface Page {
  Steps: (matrix: Payoff[][]) => Step[];
}

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

const generatePages = (): Page[] => [
  {
    Steps: (matrix) => {
      const mixedQ = computeAttackerQ(matrix);
      const mixedP = computeDefenderP(matrix);
      const mixedAttackerChoices = buildPercentChoices(mixedQ);
      const mixedDefenderChoices = buildPercentChoices(mixedP);

      const maxminDefender = buildIntegerChoices(
        calculateDefenderMaxmin(matrix),
      );
      const maxminAttacker = buildIntegerChoices(
        calculateAttackerMaxmin(matrix),
      );
      const minmaxDefender = buildIntegerChoices(
        calculateDefenderMinmax(matrix),
      );
      const minmaxAttacker = buildIntegerChoices(
        calculateAttackerMinmax(matrix),
      );

      return [
        {
          question: {
            defender:
              "What is the Best Response if the Attacker attacks Server 1?",
            attacker:
              "What is the Best Response if the Defender defends Server 1?",
          },
          choices: {
            defender: ["Defend Server 1", "Defend Server 2"],
            attacker: ["Attack Server 1", "Attack Server 2"],
          },
          correctAnswer: {
            defender: "Defend Server 1",
            attacker: "Attack Server 1",
          },
          weight: 10,
        },
        {
          question: {
            defender:
              "Is there a Pure Nash Equilibrium in this game? Why or Why not?",
            attacker:
              "Is there a Pure Nash Equilibrium in this game? Why or Why not?",
          },
          choices: {
            defender: ["No", "Yes"],
            attacker: ["No", "Yes"],
          },
          correctAnswer: {
            defender: "No",
            attacker: "No",
          },
          weight: 10,
        },
        {
          question: {
            defender: "What is the Mixed Nash Equilibrium for the Defender?",
            attacker: "What is the Mixed Nash Equilibrium for the Attacker?",
          },
          choices: {
            defender: mixedAttackerChoices.choices,
            attacker: mixedDefenderChoices.choices,
          },
          correctAnswer: {
            defender: mixedAttackerChoices.correctAnswer,
            attacker: mixedDefenderChoices.correctAnswer,
          },
          weight: 40,
        },
        {
          question: {
            defender: "What is the Maxmin value for the Defender?",
            attacker: "What is the Maxmin value for the Attacker?",
          },
          choices: {
            defender: maxminDefender.choices,
            attacker: maxminAttacker.choices,
          },
          correctAnswer: {
            defender: maxminDefender.correctAnswer,
            attacker: maxminAttacker.correctAnswer,
          },
          weight: 20,
        },
        {
          question: {
            defender: "What is the Minmax value for the Defender?",
            attacker: "What is the Minmax value for the Attacker?",
          },
          choices: {
            defender: minmaxDefender.choices,
            attacker: minmaxAttacker.choices,
          },
          correctAnswer: {
            defender: minmaxDefender.correctAnswer,
            attacker: minmaxAttacker.correctAnswer,
          },
          weight: 20,
        },
      ];
    },
  },
];

export const PracticeLab1 = ({ onSubmit }: Props) => {
  const {
    matrix,
    isDisabled,
    isCellSelected,
    isElementSelected,
    handleCellClick,
    handleElementClick,
  } = usePayoffMatrix();

  const [isDefender, setIsDefender] = useState<boolean | null>(null);
  const [pages] = useState<Page[]>(generatePages);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitted, SetSubmitted] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Map<number, string>>(
    new Map<number, string>(),
  );
  const [explanation, setExplanation] = useState("");
  const steps = useMemo(() => pages[0].Steps(matrix), [pages, matrix]);
  const currentStep = steps[stepIndex];
  const role: "defender" | "attacker" = isDefender ? "defender" : "attacker";

  const handleSelection = (choice: string) => {
    setSelectedAnswers((prev) => new Map(prev).set(stepIndex, choice));
  };

  const handleLabSubmit = () => {
    SetSubmitted(true);
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

  return (
    <div className="lab-panel-columns">
      <div className="lab-panel-static">
        <div className="static-lab">
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

          <div className="payoff-matrix">
            <div className="matrix-axis-label matrix-axis-attacker">
              Attacker
            </div>
            <div className="matrix-sub-header matrix-col-sub-1">Server 1</div>
            <div className="matrix-sub-header matrix-col-sub-2">Server 2</div>

            <div className="matrix-axis-label matrix-axis-defender">
              Defender
            </div>
            <div className="matrix-sub-header matrix-row-sub-1">Server 1</div>
            <div className="matrix-sub-header matrix-row-sub-2">Server 2</div>

            {matrix.map((row, rowIndex) =>
              row.map((payoff, colIndex) => (
                <button
                  type="button"
                  key={`cell-${rowIndex}-${colIndex}`}
                  className={`matrix-cell${
                    isCellSelected(rowIndex, colIndex) ? " selected" : ""
                  }`}
                  style={{ gridColumn: colIndex + 3, gridRow: rowIndex + 3 }}
                  disabled={isDisabled}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  (
                  <span
                    className={`tuple-element${
                      isElementSelected(rowIndex, colIndex, "defender")
                        ? " selected"
                        : ""
                    }`}
                    onClick={(event) =>
                      handleElementClick(event, rowIndex, colIndex, "defender")
                    }
                  >
                    {payoff.defender}
                  </span>
                  ,{" "}
                  <span
                    className={`tuple-element${
                      isElementSelected(rowIndex, colIndex, "attacker")
                        ? " selected"
                        : ""
                    }`}
                    onClick={(event) =>
                      handleElementClick(event, rowIndex, colIndex, "attacker")
                    }
                  >
                    {payoff.attacker}
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
        {isDefender === null ? (
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
          </div>
        ) : (
          <div className="practice-walkthrough">
            <p className="practice-role">
              Playing as {isDefender ? "Defender" : "Attacker"}
            </p>

            <div className="practice-content">
              <p className="practice-question">{currentStep.question[role]}</p>

              <div className="practice-choices">
                {currentStep.choices[role].map((choice) => (
                  <button
                    type="button"
                    key={choice}
                    className={`practice-choice${selectedAnswers.get(stepIndex) === choice ? " selected" : ""}`}
                    onClick={() => handleSelection(choice)}
                  >
                    {choice}
                  </button>
                ))}
                {stepIndex === 1 ? (
                  <div className="practice-explain">
                    <p className="practice-explain-prompt">Explain</p>
                    <CFormTextarea
                      rows={2}
                      placeholder="Type your explanation..."
                      value={explanation}
                      onChange={(event) => setExplanation(event.target.value)}
                    />
                  </div>
                ) : (
                  <></>
                )}
                {stepIndex === steps.length - 1 ? (
                  <CButton
                    color="success"
                    className="practice-submit"
                    onClick={() => handleLabSubmit()}
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
