import { useState } from "react";
import { CButton } from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilArrowLeft, cilArrowRight, cilLightbulb } from "@coreui/icons";
import "../styles/PayoffMatrix.css";
import "../styles/LabPanel.css";
import "../styles/ExampleLab1.css";
import { usePayoffMatrix } from "../hooks/usePayoffMatrix";
import type { Payoff } from "../hooks/usePayoffMatrix";

interface Step {
  question: string[];
  response: (matrix: Payoff[][]) => React.ReactNode[];
  highlightCell?: { row: number; col: number };
}

interface Page {
  topic: string;
  definition: string[];
  steps: Step[];
}

// Mixed-strategy equilibrium: each player's own mixing probability is found
// by making the OTHER player indifferent between their two pure strategies.
// q = Attacker's probability of attacking Server 1 (1-q for Server 2) - found
// by setting the Defender's expected payoff from "Defend Server 1" equal to
// their expected payoff from "Defend Server 2", both written as functions of q.
const computeAttackerQ = (matrix: Payoff[][]): number => {
  const a = matrix[0][0].defender; // Defend S1, Attack S1
  const b = matrix[0][1].defender; // Defend S1, Attack S2
  const c = matrix[1][0].defender; // Defend S2, Attack S1
  const d = matrix[1][1].defender; // Defend S2, Attack S2
  return (d - b) / (a - b - c + d);
};

// p = Defender's probability of defending Server 1 (1-p for Server 2) -
// same method, using the Attacker's payoffs across the Attacker's two pure
// strategies instead.
const computeDefenderP = (matrix: Payoff[][]): number => {
  const e = matrix[0][0].attacker; // Defend S1, Attack S1
  const f = matrix[1][0].attacker; // Defend S2, Attack S1
  const g = matrix[0][1].attacker; // Defend S1, Attack S2
  const h = matrix[1][1].attacker; // Defend S2, Attack S2
  return (h - f) / (e - f - g + h);
};

const asPercent = (value: number): string => `${(value * 100).toFixed(1)}%`;

const generatePages = (): Page[] => [
  {
    topic: "Best Response",
    definition: [
      "A player's best response is the strategy (or strategies) that gives them the highest possible payoff, given the specific strategy the other player has chosen.",
    ],
    steps: [
      {
        question: [
          "What is the best response as a Defender if the Attacker attacks Server 1?",
        ],
        response: (matrix) => [
          "Defend Server 1.",
          <>
            If the Defender defends Server 1, their payoff is{" "}
            <strong className="dynamic-highlight">
              {matrix[0][0].defender}
            </strong>
            ; if they instead defend Server 2 while the Attacker still attacks
            Server 1, their payoff is{" "}
            <strong className="dynamic-highlight">
              {matrix[1][0].defender}
            </strong>
            . The higher payoff tells the Defender which server to defend.
          </>,
        ],
        highlightCell: { row: 0, col: 0 },
      },
      {
        question: [
          "What is the best response as the Attacker if the Defender defends Server 2?",
        ],
        response: (matrix) => [
          "Attack Server 1.",
          <>
            If the Attacker attacks Server 1, their payoff is{" "}
            <strong className="dynamic-highlight">
              {matrix[1][0].attacker}
            </strong>
            ; if they instead attack Server 2, their payoff is{" "}
            <strong className="dynamic-highlight">
              {matrix[1][1].attacker}
            </strong>
            . The higher payoff tells the Attacker which server to attack.
          </>,
        ],
        highlightCell: { row: 1, col: 0 },
      },
    ],
  },
  {
    topic: "Pure Nash Equilibrium",
    definition: [
      "A Pure Nash Equilibrium is a stable outcome where every player is playing one single, specific strategy - not a mix of strategies - and no player can improve their own payoff by unilaterally switching strategies, assuming everyone else keeps theirs fixed.",
    ],
    steps: [
      {
        question: ["Is there a Pure Nash Equilibrium in this game?"],
        response: (_matrix) => [
          "There is no pure Nash Equilibrium: whichever server the defender defends, the attacker is always better off attacking the other one, and vice versa.",
        ],
      },
    ],
  },
  {
    topic: "Mixed Nash Equilibrium",
    definition: [
      "A Mixed Nash Equilibrium is an equilibrium where a player randomizes between two or more strategies according to specific probabilities, rather than committing to one. It's used when no Pure Nash Equilibrium exists - each player picks probabilities that make the other player indifferent between their own choices.",
    ],
    steps: [
      {
        question: ["What is the Mixed Nash Equilibrium for the Attacker?"],
        response: (matrix) => {
          const a = matrix[0][0].defender;
          const b = matrix[0][1].defender;
          const c = matrix[1][0].defender;
          const d = matrix[1][1].defender;
          const q = computeAttackerQ(matrix);
          return [
            "To find the Attacker's mixing probability, q (the probability of attacking Server 1, with (1-q) for Server 2), find the value of q that makes the Defender indifferent between their two strategies.",
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
          ];
        },
      },
      {
        question: ["What is the Mixed Nash Equilibrium for the Defender?"],
        response: (matrix) => {
          const e = matrix[0][0].attacker;
          const f = matrix[1][0].attacker;
          const g = matrix[0][1].attacker;
          const h = matrix[1][1].attacker;
          const p = computeDefenderP(matrix);
          return [
            "The same method applies to the Defender's mixing probability, p (the probability of defending Server 1, with (1-p) for Server 2) - this time make the Attacker indifferent between their two strategies.",
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
          ];
        },
      },
    ],
  },
  {
    topic: "Maxmin",
    definition: [
      "The maxmin strategy is a cautious, worst-case approach: for each strategy a player could choose, look at the worst possible outcome it could lead to, then pick whichever strategy makes that worst-case outcome as good as possible - the 'best of the worst.'",
    ],
    steps: [
      {
        question: ["What is the Maxmin value for the Defender?"],
        response: (_matrix) => ["TODO"],
      },
    ],
  },
  {
    topic: "Minmax",
    definition: [
      "The minmax strategy looks at things from the opposite side of maxmin: it's the strategy that minimizes the best possible outcome the other player could achieve, effectively limiting how much the opponent can gain no matter how they respond.",
    ],
    steps: [
      {
        question: ["What is the Minmax value for the Attacker?"],
        response: (_matrix) => ["TODO"],
      },
    ],
  },
];

export const ExampleLab1 = () => {
  const {
    matrix,
    isDisabled,
    isCellSelected,
    clearSelection,
    isElementSelected,
    handleCellClick,
    handleElementClick,
  } = usePayoffMatrix();

  const [pages] = useState<Page[]>(generatePages);
  const [pageIndex, setPageIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  const currentPage = pages[pageIndex];
  const currentStep = currentPage?.steps[stepIndex];
  const isLastStepInPage = stepIndex === currentPage.steps.length - 1;
  const isLastPage = pageIndex === pages.length - 1;
  const showMixLabels =
    isRevealed && currentPage.topic === "Mixed Nash Equilibrium";

  const handleReveal = () => {
    setIsRevealed(true);
    if (currentStep.highlightCell) {
      handleCellClick(
        currentStep.highlightCell.row,
        currentStep.highlightCell.col,
      );
    }
  };

  const handleNextQuestion = () => {
    if (isLastStepInPage && isLastPage) {
      return;
    }
    if (isLastStepInPage) {
      setPageIndex((index) => index + 1);
      setStepIndex(0);
    } else {
      setStepIndex((index) => index + 1);
    }
    clearSelection;
    setIsRevealed(false);
  };

  const handleGoBack = () => {
    if (pageIndex === 0 && stepIndex === 0) {
      return;
    }
    if (stepIndex === 0) {
      const previousPage = pages[pageIndex - 1];
      setStepIndex(previousPage.steps.length - 1);
      setPageIndex((index) => index - 1);
    } else {
      setStepIndex((index) => index - 1);
    }
    setIsRevealed(true);
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
            <div className="matrix-sub-header matrix-col-sub-1">
              Server 1{showMixLabels && <span className="mix-label">(q)</span>}
            </div>
            <div className="matrix-sub-header matrix-col-sub-2">
              Server 2
              {showMixLabels && <span className="mix-label">(1-q)</span>}
            </div>

            <div className="matrix-axis-label matrix-axis-defender">
              Defender
            </div>
            <div className="matrix-sub-header matrix-row-sub-1">
              Server 1{showMixLabels && <span className="mix-label">(p)</span>}
            </div>
            <div className="matrix-sub-header matrix-row-sub-2">
              Server 2
              {showMixLabels && <span className="mix-label">(1-p)</span>}
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
        </div>
      </div>

      <div className="lab-panel-divider" />

      <div className="lab-panel-dynamic">
        <div className="dynamic-walkthrough">
          <div className="dynamic-content">
            <div className="dynamic-definition">
              <CIcon icon={cilLightbulb} className="dynamic-definition-icon" />
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
              currentStep.response(matrix).map((line, index) => (
                <p className="dynamic-response" key={`response-${index}`}>
                  {line}
                </p>
              ))}

            <div className="dynamic-controls">
              {!isRevealed && (
                <CButton color="primary" onClick={handleReveal}>
                  Show Answer
                </CButton>
              )}
              {isRevealed && isLastStepInPage && isLastPage && (
                <p className="dynamic-complete">Walkthrough complete!</p>
              )}
            </div>
          </div>

          <div className="dynamic-nav">
            <CButton
              color="secondary"
              onClick={handleGoBack}
              disabled={pageIndex == 0 && stepIndex == 0}
            >
              <CIcon icon={cilArrowLeft} />
            </CButton>
            <CButton
              color="secondary"
              onClick={handleNextQuestion}
              disabled={!isRevealed && !isLastPage}
            >
              <CIcon icon={cilArrowRight} />
            </CButton>
          </div>
        </div>
      </div>
    </div>
  );
};
