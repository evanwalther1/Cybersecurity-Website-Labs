import { useEffect, useState } from "react";
import { CButton } from "@coreui/react";
import CIcon from "@coreui/icons-react";
import {
  cilArrowLeft,
  cilArrowRight,
  cilCheckCircle,
  cilLightbulb,
} from "@coreui/icons";
import "../styles/PayoffMatrix.css";
import "../styles/LabPanel.css";
import "../styles/ExampleLab1.css";
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

interface Props {
  setHasCompleted: (value: boolean) => void;
}
interface Step {
  question: string[];
  response: (matrix: Payoff[][]) => React.ReactNode[];
  highlightCell?: { row: number; col: number };
  highlightServer?: { player: "defender" | "attacker"; server: 1 | 2 };
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
        highlightServer: { player: "defender", server: 1 },
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
        highlightServer: { player: "attacker", server: 1 },
      },
    ],
  },
  {
    topic: "Pure Nash Equilibrium",
    definition: [
      "A Pure Nash Equilibrium is a stable outcome where every player is playing one single specific strategy (not a mix of strategies), and no player has any incentive to switch strategies because their payoff won't be higher.",
    ],
    steps: [
      {
        question: ["Is there a Pure Nash Equilibrium in this game?"],
        response: (_matrix) => [
          "There is no pure Nash Equilibrium: whichever server the defender defends, the attacker is always better off attacking the other one, and vice versa.",
          "A Pure Nash Equilibrium requires both players to be able to lock in one single choice at the same time, with neither one wanting to switch once they see what the other picked. Here that's impossible, any fixed pairing of choices immediately gives one player a reason to change, and reacting to that change immediately gives the other player a reason to change too. This back-and-forth never settles down, so no stable single-choice outcome exists.",
        ],
      },
    ],
  },
  {
    topic: "Mixed Nash Equilibrium",
    definition: [
      "A Mixed Nash Equilibrium is an equilibrium where a player randomizes between two or more strategies according to specific probabilities, rather than committing to one. It's used when no Pure Nash Equilibrium exists, each player picks probabilities that make the other player indifferent between their own choices.",
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
            "The same method applies to the Defender's mixing probability, p (the probability of defending Server 1, with (1-p) for Server 2), this time make the Attacker indifferent between their two strategies.",
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
      "The Maxmin Strategy is a plan of action where a player chooses the option that maximizes their own minimum possible payoff." +
        " It addresses the cautious, worst-case scenario. For each strategy a player could choose, look at the worst possible outcome it could lead to," +
        " then pick whichever strategy makes that worst-case outcome as good as possible." +
        " This is a defensive choice used to avoid the absolute worst outcome",
      "Note: this is different from the Mixed Nash Equilibrium you just saw. Maxmin assumes the player is locked into a single fixed choice with no randomizing, it's the safest guaranteed outcome if mixing isn't an option. A rational, adapting opponent can still exploit a fixed choice over time, which is exactly why mixing becomes necessary for a stable equilibrium in a game like this one.",
    ],
    steps: [
      {
        question: ["What is the Maxmin value for the Defender?"],
        response: (matrix) => {
          const a = matrix[0][0].defender;
          const b = matrix[0][1].defender;
          const c = matrix[1][0].defender;
          const d = matrix[1][1].defender;
          const minServer1 = Math.min(a, b);
          const minServer2 = Math.min(c, d);
          const maxmin = calculateDefenderMaxmin(matrix);
          const bestServer = minServer1 >= minServer2 ? 1 : 2;
          return [
            "To find the Maxmin value for the Defender we need to choose the minimum payoff for each strategy, then choose the maximum of those.",
            `For Server 1 we have two possible payoffs, ${a} and ${b}; the minimum of these is ${minServer1}.`,
            `For Server 2 we have two possible payoffs, ${c} and ${d}; the minimum of these is ${minServer2}.`,
            `The maximum of these two minimums is the Maxmin value: max(${minServer1}, ${minServer2}) = ${maxmin}.`,
            <>
              Maxmin = <strong className="dynamic-highlight">{maxmin}</strong>.
              The Defender should defend Server {bestServer} to guarantee at
              least this payoff, no matter what the Attacker does.
            </>,
          ];
        },
      },
      {
        question: ["What is the Maxmin value for the Attacker?"],
        response: (matrix) => {
          const e = matrix[0][0].attacker;
          const f = matrix[1][0].attacker;
          const g = matrix[0][1].attacker;
          const h = matrix[1][1].attacker;
          const minServer1 = Math.min(e, f);
          const minServer2 = Math.min(g, h);
          const maxmin = calculateAttackerMaxmin(matrix);
          const bestServer = minServer1 >= minServer2 ? 1 : 2;
          return [
            "The same method applies to the Attacker, using the Attacker's own payoffs.",
            `For Server 1 we have two possible payoffs, ${e} and ${f}; the minimum of these is ${minServer1}.`,
            `For Server 2 we have two possible payoffs, ${g} and ${h}; the minimum of these is ${minServer2}.`,
            `The maximum of these two minimums is the Maxmin value: max(${minServer1}, ${minServer2}) = ${maxmin}.`,
            <>
              Maxmin = <strong className="dynamic-highlight">{maxmin}</strong>.
              The Attacker should attack Server {bestServer} to guarantee at
              least this payoff, no matter what the Defender does.
            </>,
          ];
        },
      },
    ],
  },
  {
    topic: "Minmax",
    definition: [
      "The Minmax Strategy is the opposite of maxmin, it's a plan of action that minimizes the maximum possible payoff of an opponent." +
        " This strategy effectively limits how much the opponent can gain no matter how they respond. (In a zero-sum game such as this one," +
        " this strategy also minimizes their own maximum possible loss)",
      "Note: as with Maxmin, this assumes a single fixed choice with no randomizing, it's a different question from the Mixed Nash Equilibrium's optimal randomized strategy.",
    ],
    steps: [
      {
        question: ["What is the Minmax value for the Defender?"],
        response: (matrix) => {
          const row1AttackerMax = Math.max(
            matrix[0][0].attacker,
            matrix[0][1].attacker,
          );
          const row2AttackerMax = Math.max(
            matrix[1][0].attacker,
            matrix[1][1].attacker,
          );
          const minmax = calculateDefenderMinmax(matrix);
          const bestServer = row1AttackerMax <= row2AttackerMax ? 1 : 2;
          return [
            "To find the Minmax value for the Defender, look at the best payoff the Attacker could get in response to each Defender strategy, then choose whichever Defender strategy keeps that as small as possible.",
            `If the Defender defends Server 1, the Attacker's best possible payoff is max(${matrix[0][0].attacker}, ${matrix[0][1].attacker}) = ${row1AttackerMax}.`,
            `If the Defender defends Server 2, the Attacker's best possible payoff is max(${matrix[1][0].attacker}, ${matrix[1][1].attacker}) = ${row2AttackerMax}.`,
            `The minimum of these two is the Minmax value: min(${row1AttackerMax}, ${row2AttackerMax}) = ${minmax}.`,
            <>
              Minmax = <strong className="dynamic-highlight">{minmax}</strong>.
              The Defender should defend Server {bestServer} to limit the
              Attacker to at most this payoff.
            </>,
          ];
        },
      },
      {
        question: ["What is the Minmax value for the Attacker?"],
        response: (matrix) => {
          const col1DefenderMax = Math.max(
            matrix[0][0].defender,
            matrix[1][0].defender,
          );
          const col2DefenderMax = Math.max(
            matrix[0][1].defender,
            matrix[1][1].defender,
          );
          const minmax = calculateAttackerMinmax(matrix);
          const bestServer = col1DefenderMax <= col2DefenderMax ? 1 : 2;
          return [
            "The same method applies to the Attacker: look at the best payoff the Defender could get in response to each Attacker strategy, then choose whichever Attacker strategy keeps that as small as possible.",
            `If the Attacker attacks Server 1, the Defender's best possible payoff is max(${matrix[0][0].defender}, ${matrix[1][0].defender}) = ${col1DefenderMax}.`,
            `If the Attacker attacks Server 2, the Defender's best possible payoff is max(${matrix[0][1].defender}, ${matrix[1][1].defender}) = ${col2DefenderMax}.`,
            `The minimum of these two is the Minmax value: min(${col1DefenderMax}, ${col2DefenderMax}) = ${minmax}.`,
            <>
              Minmax = <strong className="dynamic-highlight">{minmax}</strong>.
              The Attacker should attack Server {bestServer} to limit the
              Defender to at most this payoff.
            </>,
          ];
        },
      },
    ],
  },
];

export const ExampleLab1 = ({ setHasCompleted }: Props) => {
  const {
    matrix,
    isDisabled,
    isCellSelected,
    clearSelection,
    isElementSelected,
    isServerHighlighted,
    handleCellClick,
    handleElementClick,
    highlightServer,
  } = usePayoffMatrix();

  const [pages] = useState<Page[]>(generatePages);
  const [pageIndex, setPageIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  // Tracks every step that has ever been revealed, keyed by "pageIndex-stepIndex",
  // so navigating back and forward remembers each step's own reveal state
  // instead of one flag that resets on every move.
  const [revealedSteps, setRevealedSteps] = useState<Set<string>>(new Set());
  const [isComplete, setIsComplete] = useState(false);

  const currentPage = pages[pageIndex];
  const currentStep = currentPage?.steps[stepIndex];
  const currentStepKey = `${pageIndex}-${stepIndex}`;
  const isRevealed = revealedSteps.has(currentStepKey);
  const isLastStepInPage = stepIndex === currentPage.steps.length - 1;
  const isLastPage = pageIndex === pages.length - 1;
  const showMixLabels =
    isRevealed && currentPage.topic === "Mixed Nash Equilibrium";

  const handleReveal = () => {
    setRevealedSteps((prev) => new Set(prev).add(currentStepKey));
    if (currentStep.highlightCell) {
      handleCellClick(
        currentStep.highlightCell.row,
        currentStep.highlightCell.col,
      );
    }
    if (currentStep.highlightServer) {
      highlightServer(
        currentStep.highlightServer.player,
        currentStep.highlightServer.server,
      );
    }
  };
  useEffect(() => {
    if (isRevealed) {
      if (currentStep.highlightCell) {
        handleCellClick(
          currentStep.highlightCell.row,
          currentStep.highlightCell.col,
        );
      }
      if (currentStep.highlightServer) {
        highlightServer(
          currentStep.highlightServer.player,
          currentStep.highlightServer.server,
        );
      }
    } else {
      clearSelection();
    }
  }, [pageIndex, stepIndex]);

  const handleNextQuestion = () => {
    if (isLastStepInPage && isLastPage) {
      setHasCompleted(true);
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
            <div
              className={`matrix-sub-header matrix-col-sub-1${
                isServerHighlighted("attacker", 1) ? " selected" : ""
              }`}
            >
              Server 1{showMixLabels && <span className="mix-label">(q)</span>}
            </div>
            <div
              className={`matrix-sub-header matrix-col-sub-2${
                isServerHighlighted("attacker", 2) ? " selected" : ""
              }`}
            >
              Server 2
              {showMixLabels && <span className="mix-label">(1-q)</span>}
            </div>

            <div className="matrix-axis-label matrix-axis-defender">
              Defender
            </div>
            <div
              className={`matrix-sub-header matrix-row-sub-1${
                isServerHighlighted("defender", 1) ? " selected" : ""
              }`}
            >
              Server 1{showMixLabels && <span className="mix-label">(p)</span>}
            </div>
            <div
              className={`matrix-sub-header matrix-row-sub-2${
                isServerHighlighted("defender", 2) ? " selected" : ""
              }`}
            >
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

          <p className="matrix-legend">(Defender payoff, Attacker payoff)</p>
        </div>
      </div>

      <div className="lab-panel-divider" />

      <div className="lab-panel-dynamic">
        <div className="dynamic-walkthrough">
          <div className="dynamic-content">
            {isComplete ? (
              <div className="dynamic-finish">
                <p className="dynamic-finish-title">Walkthrough complete!</p>
                <p className="dynamic-finish-subtitle">
                  Great work - you've walked through every concept in this lab.
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
                  Practice is now open to work through these concepts yourself.
                </p>
              </div>
            ) : (
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
                </div>
              </>
            )}
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
              disabled={isComplete || (!isRevealed && !isLastPage)}
            >
              <CIcon icon={cilArrowRight} />
            </CButton>
          </div>
        </div>
      </div>
    </div>
  );
};
