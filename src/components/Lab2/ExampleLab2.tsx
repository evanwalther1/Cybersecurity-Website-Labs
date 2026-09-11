import { useState } from "react";
import { CButton } from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilArrowLeft, cilArrowRight, cilLightbulb } from "@coreui/icons";
import "../../styles/PayoffMatrix.css";
import "../../styles/PayoffMatrix3x3.css";
import "../../styles/LabPanel.css";
import "../../styles/ExampleLab1.css";
import { Box } from "@mui/material";
import { Slider } from "@mui/material";

interface Payoff3x3 {
  defender: number | null;
  attacker: number | null;
}

interface ClickedCell {
  row: number;
  col: number;
}
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
  const [matrix] = useState<Payoff3x3[][]>(generateBlankMatrix);
  const [showIntro, setShowIntro] = useState(true);
  const [clickedCell, setClickedCell] = useState<ClickedCell | null>(null);

  const isCellSelected = (row: number, col: number) =>
    clickedCell?.row === row && clickedCell?.col === col;

  const handleCellClick = (row: number, col: number) => {
    setClickedCell({ row, col });
  };

  const handleBeginWalkthrough = () => {
    setShowIntro(false);
  };

  const handleGoBack = () => {
    if (!showIntro) {
      setShowIntro(true);
    }
  };

  const handleNextQuestion = () => {
    if (showIntro) {
      handleBeginWalkthrough();
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
        <div className="dynamic-walkthrough">
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
                  Lab 2 is different each players' payoff are now calculated
                  independently and no longer have to cancel out, which is what
                  makes this a <strong>non-zero-sum</strong> game.
                </p>
                <p className="dynamic-intro-text">
                  We introduce two new variables: a honeypot cost{" "}
                  <strong>Ch</strong> for the Defender, and an exploit cost{" "}
                  <strong>Ce</strong> for the Attacker. Each player's result is
                  calculated separately: <strong>Rd = (Sz - D - Ch)</strong> for
                  the Defender (the total network value, minus damage, minus the
                  honeypot cost), and <strong>Ra = (D - Ce)</strong> for the
                  Attacker (damage minus the exploit cost).
                </p>
                <p className="dynamic-intro-text">
                  In this example S1, S2, Ch, and Ce are set for you down below
                  , there will be an opportunity to configure these values for
                  yourself in the practice tab.
                </p>
                <p>Server 1 Value</p>
                <Slider
                  aria-label="Always visible"
                  min={1}
                  max={50}
                  defaultValue={30}
                  step={1}
                  marks={ServerMarks}
                  disabled
                  valueLabelDisplay="on"
                ></Slider>
                <p>Server 2 Value</p>
                <Slider
                  aria-label="Always visible"
                  min={1}
                  max={50}
                  defaultValue={30}
                  step={1}
                  marks={ServerMarks}
                  disabled
                  valueLabelDisplay="on"
                ></Slider>
                <p>Honeypot Cost (Ch)</p>
                <Slider
                  disabled
                  aria-label="Always visible"
                  min={1}
                  max={50}
                  defaultValue={30}
                  step={1}
                  marks={NonServerMarks}
                  valueLabelDisplay="on"
                ></Slider>
                <p>Exploit Cost (Ce)</p>
                <Slider
                  aria-label="Always visible"
                  min={1}
                  max={50}
                  defaultValue={30}
                  step={1}
                  disabled
                  marks={NonServerMarks}
                  valueLabelDisplay="on"
                ></Slider>
                <div className="dynamic-controls">
                  <CButton color="primary" onClick={handleBeginWalkthrough}>
                    Begin Walkthrough
                  </CButton>
                </div>
              </div>
            )}
          </div>

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
              disabled={!showIntro}
            >
              <CIcon icon={cilArrowRight} />
            </CButton>
          </div>
        </div>
      </div>
    </div>
  );
};
