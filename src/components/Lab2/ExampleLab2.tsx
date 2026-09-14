import { useEffect, useState } from "react";
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

// Same helper as usePayoffMatrix.ts's asPercent - kept local for now since
// ExampleLab2 isn't sharing that hook yet (its matrix is 3x3, not 2x2).
const asPercent = (value: number): string => `${(value * 100).toFixed(1)}%`;

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

interface Step {
  question: string[];
  response: (matrix: Payoff3x3[][]) => React.ReactNode[];
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
      "In a non-zero-sum game, a player's Best Response is the strategy (or mix of strategies) that produces the highest possible individual payoff, given the specific strategies selected by the other players. " +
        "Unlike a zero-sum game where a opponent's loss perfectly mirrors your gain, the best response in a non-zero-sum form must independently balance maximizing your own gains against fixed system variables like server baselines and operational costs.",
    ],
    steps: [
      {
        question: [
          "What is the Defender's Best Response if the Attacker chooses to play No-Action?",
        ],
        response: (matrix) => {
          const sz = EXAMPLE_S1 + EXAMPLE_S2;
          const defendS1 = matrix[0][2].defender;
          const defendS2 = matrix[1][2].defender;
          const noAction = matrix[2][2].defender;
          return [
            "Look at the column where the Attacker plays No Action - nothing is being attacked, so damage (D) is 0 no matter which strategy the Defender picks. Compare the Defender's payoff across all three of their own strategies in that column.",
            `Defend Server 1: Rd = Sz - D - Ch = ${sz} - 0 - ${EXAMPLE_CH} = ${defendS1}.`,
            `Defend Server 2: Rd = Sz - D - Ch = ${sz} - 0 - ${EXAMPLE_CH} = ${defendS2}.`,
            `No Action: Rd = Sz - D - Ch = ${sz} - 0 - 0 = ${noAction}.`,
            <>
              The highest payoff is{" "}
              <strong className="dynamic-highlight">{noAction}</strong>, so the
              Defender's{" "}
              <strong className="dynamic-highlight">
                Best Response is No Action
              </strong>
              . Since the Attacker isn't attacking anything, running a honeypot
              on either server only costs Ch = {EXAMPLE_CH} for nothing in
              return - there's no reason to pay for defense that will never
              catch anything.
            </>,
          ];
        },
        highlightCell: { row: 2, col: 2 },
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

          const evAttackS1 = p1 * attackS1vsDefendS1 + p2 * attackS1vsDefendS2;
          const evAttackS2 = p1 * attackS2vsDefendS1 + p2 * attackS2vsDefendS2;
          const evNoAction = p1 * noActionVsDefendS1 + p2 * noActionVsDefendS2;

          return [
            "Since the Defender is mixing between two strategies, the Attacker's Best Response is whichever pure strategy gives the highest expected payoff against that mix - found by multiplying each matchup's payoff by the probability of the Defender playing that strategy, then adding them up.",
            `Attack Server 1: E[Ra] = (0.7)(${attackS1vsDefendS1}) + (0.3)(${attackS1vsDefendS2}) = ${p1 * attackS1vsDefendS1} + ${p2 * attackS1vsDefendS2} = ${evAttackS1}.`,
            `Attack Server 2: E[Ra] = (0.7)(${attackS2vsDefendS1}) + (0.3)(${attackS2vsDefendS2}) = ${p1 * attackS2vsDefendS1} + ${p2 * attackS2vsDefendS2} = ${evAttackS2}.`,
            `No Action: E[Ra] = (0.7)(${noActionVsDefendS1}) + (0.3)(${noActionVsDefendS2}) = ${evNoAction}.`,
            <>
              The highest expected payoff is{" "}
              <strong className="dynamic-highlight">{evAttackS2}</strong>, so
              the Attacker's{" "}
              <strong className="dynamic-highlight">
                Best Response is to attack Server 2
              </strong>
              . Attacking Server 1 outright wins big on the 30% of the time the
              Defender happens to guess Server 2 ({attackS1vsDefendS2}), but the
              Defender is defending Server 1 too often (70%) for that to pay off
              on average - Server 2 is the safer bet against this particular
              mix.
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
      "Unlike Lab 1's zero-sum game - where a Pure Nash Equilibrium never exists, no matter the payoff values - whether one exists here depends on the specific values chosen for S1, S2, Ch, and Ce. It isn't guaranteed to be absent (or present); it has to be checked for each configuration.",
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
            "To check for a Pure Nash Equilibrium, look for one cell where neither player wants to unilaterally switch strategies - a cell that's simultaneously the Defender's best response to the Attacker's column AND the Attacker's best response to the Defender's row.",
            `First, find the Defender's best response to each of the Attacker's three strategies (the highest Rd in each column): against Attack S1, the best is Defend S1 (${rd(0, 0)} beats ${rd(1, 0)} and ${rd(2, 0)}); against Attack S2, the best is Defend S2 (${rd(1, 1)} beats ${rd(0, 1)} and ${rd(2, 1)}); against No Action, the best is No Action (${rd(2, 2)} beats ${rd(0, 2)} and ${rd(1, 2)}).`,
            `Now check whether the Attacker is also happy with their choice in each of those three candidate cells (the highest Ra in that row): at (Defend S1, Attack S1) the Attacker earns ${ra(0, 0)}, but attacking Server 2 instead would earn ${ra(0, 1)} - better, so this cell isn't stable. At (Defend S2, Attack S2) the Attacker earns ${ra(1, 1)}, but attacking Server 1 instead would earn ${ra(1, 0)} - also better, so this isn't stable either. At (No Action, No Action) the Attacker earns ${ra(2, 2)}, but attacking Server 1 instead would earn ${ra(2, 0)} - again better, so this isn't stable.`,
            <>
              None of the three candidate cells survive both checks, so{" "}
              <strong className="dynamic-highlight">
                there is no Pure Nash Equilibrium
              </strong>{" "}
              for these particular values of S1, S2, Ch, and Ce. Different
              slider values could produce a game that does have one - it just
              has to be checked, not assumed either way.
            </>,
          ];
        },
      },
    ],
  },
  {
    topic: "Mixed Nash Equilibrium",
    definition: [""],
    steps: [
      {
        question: [
          "What is the Mixed-Strategy Nash Equilibrium probability for the Attacker (restricted to Attack S1 vs. Attack S2)?",
        ],
        response: (matrix) => {
          return [<></>];
        },
      },
      {
        question: [
          "What is the Mixed-Strategy Nash Equilibrium probability for the Defender (restricted to Defend S1 vs. Defend S2)?",
        ],
        response: (matrix) => {
          return [<></>];
        },
      },
    ],
  },
  {
    topic: "Maxmin",
    definition: ["In a non-zero sum game.."],
    steps: [
      {
        question: ["What is the Maxmin value for the Defender?"],
        response: (_matrix) => {
          return [];
        },
      },
      {
        question: ["What is the Maxmin value for the Attacker?"],
        response: (_matrix) => {
          return [];
        },
      },
    ],
  },
  {
    topic: "Minmax",
    definition: [],
    steps: [
      {
        question: ["What is the Minmax value for the Defender?"],
        response: (_matrix) => {
          return [];
        },
      },
      {
        question: ["What is the Minmax value for the Attacker?"],
        response: (_matrix) => {
          return [];
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
  server: 1 | 2;
}

const EXAMPLE_S1 = 45;
const EXAMPLE_S2 = 30;
const EXAMPLE_CH = 4;
const EXAMPLE_CE = 7;

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
  const [matrix, setMatrix] = useState<Payoff3x3[][]>(generateBlankMatrix);
  const [showIntro, setShowIntro] = useState(true);
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

  const hasBegun = matrix[0][0].defender !== null;

  const isCellSelected = (row: number, col: number) =>
    clickedCell?.row === row && clickedCell?.col === col;

  const isServerHighlighted = (
    player: "defender" | "attacker",
    server: 1 | 2,
  ) =>
    highlightedServer?.player === player &&
    highlightedServer?.server === server;

  const highlightServer = (player: "defender" | "attacker", server: 1 | 2) => {
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
    setMatrix(
      calculateLab2Matrix(EXAMPLE_S1, EXAMPLE_S2, EXAMPLE_CH, EXAMPLE_CE),
    );
    setShowIntro(false);
  };

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
    if (showIntro) {
      return;
    }
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
  }, [pageIndex, stepIndex, showIntro]);

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
          <div className="lab2-variables-panel">
            <div className="lab2-variables-row">
              <span className="lab2-variables-label">S1</span>
              <span className="lab2-variables-value">
                {hasBegun ? EXAMPLE_S1 : "-"}
              </span>
            </div>
            <div className="lab2-variables-row">
              <span className="lab2-variables-label">S2</span>
              <span className="lab2-variables-value">
                {hasBegun ? EXAMPLE_S2 : "-"}
              </span>
            </div>
            <div className="lab2-variables-row">
              <span className="lab2-variables-label">Ch</span>
              <span className="lab2-variables-value">
                {hasBegun ? EXAMPLE_CH : "-"}
              </span>
            </div>
            <div className="lab2-variables-row">
              <span className="lab2-variables-label">Ce</span>
              <span className="lab2-variables-value">
                {hasBegun ? EXAMPLE_CE : "-"}
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
            <div
              className={`matrix-sub-header matrix-col-sub-1${
                isServerHighlighted("attacker", 1) ? " selected" : ""
              }`}
            >
              Server 1
            </div>
            <div
              className={`matrix-sub-header matrix-col-sub-2${
                isServerHighlighted("attacker", 2) ? " selected" : ""
              }`}
            >
              Server 2
            </div>
            <div className="matrix-sub-header matrix-col-sub-3">No Action</div>

            <div className="matrix-axis-label matrix-axis-defender-3x3">
              Defender
            </div>
            <div
              className={`matrix-sub-header matrix-row-sub-1${
                isServerHighlighted("defender", 1) ? " selected" : ""
              }`}
            >
              Server 1
            </div>
            <div
              className={`matrix-sub-header matrix-row-sub-2${
                isServerHighlighted("defender", 2) ? " selected" : ""
              }`}
            >
              Server 2
            </div>
            <div className="matrix-sub-header matrix-row-sub-3">No Action</div>

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
                  defaultValue={EXAMPLE_S1}
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
                  defaultValue={EXAMPLE_S2}
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
                  defaultValue={EXAMPLE_CH}
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
                  defaultValue={EXAMPLE_CE}
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
                  currentStep.response(matrix).map((line, index) => (
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
