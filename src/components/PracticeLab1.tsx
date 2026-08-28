import { useState } from "react";
import { CButton } from "@coreui/react";
import "../styles/PayoffMatrix.css";
import "../styles/LabPanel.css";
import "../styles/PracticeLab1.css";
import { usePayoffMatrix } from "../hooks/usePayoffMatrix";
import type { Payoff } from "../hooks/usePayoffMatrix";

const buildAnswerKey = (matrix: Payoff[][]): Map<number, string> => {
  const key = new Map<number, string>();
  key.set(1, "Defend Server 1");
  // ...
  return key;
};

// const handleAnswerChange = (questionId: number, value: string) => {
//   setAnswers((prev) => new Map(prev).set(questionId, value));
// };
interface Step {
  question: { defender: string; attacker: string };
  answers: { defender: string[]; attacker: string[] };
}

interface Page {
  Steps: (matrix: Payoff[][]) => Step[];
}

const generatePages = (): Page[] => [
  {
    Steps: (_matrix) => {
      return [
        {
          question: {
            defender:
              "What is the Best Response if the Attacker attacks Server 1",
            attacker:
              "What is the Best Response if the Defender defends Server 1",
          },
          answers: {
            defender: ["Defend Server 1", "Defend Server 2"],
            attacker: ["Attack Server 1", "Attack Server 2"],
          },
        },
      ];
    },
  },
];

export const PracticeLab1 = () => {
  const {
    matrix,
    isDisabled,
    isCellSelected,
    isElementSelected,
    handleCellClick,
    handleElementClick,
  } = usePayoffMatrix();

  const [isDefender, setIsDefender] = useState<boolean | null>(null);
  const answerKey = buildAnswerKey(matrix);
  const [answers, setAnswers] = useState<Map<number, string>>(new Map());
  const [pages] = useState<Page[]>(generatePages);

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
          <></>
        )}
      </div>
    </div>
  );
};
