import { cilPuzzle } from "@coreui/icons";
import ReactDOM from "react-dom";
import { useState } from "react";
import "../../styles/LabWindow.css";
import type { LabResult } from "../../types/labResult";
import LabLayout from "../LabLayout";
import { LabInternalLayout } from "../LabInternalLayout";

const labProps = {
  title: "Lab 2: Non Zero-Sum Game (Normal Form)",
  objectives: [
    "Understand how a non-zero-sum game differs from a zero-sum game.",
    "Account for honeypot cost (Ch) and exploit cost (Ce) in each player's payoff.",
    "Analyze a 3x3 payoff matrix that includes a 'No Action' strategy for each player.",
    "Customize game parameters (S1, S2, Ch, Ce) and see how they affect the equilibria.",
    "Apply Best Response, Pure/Mixed Nash Equilibrium, Maxmin, and Minmax to a more complex game.",
  ],
  points: 100,
  icon: cilPuzzle,
  accentColor: "#20c997",
};

const Lab2 = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [labResult, setLabResult] = useState<LabResult | null>(null);

  const handleStartLab = () => {
    setIsPlaying(true);
  };

  const handleLabComplete = (result: LabResult) => {
    setLabResult(result);
    setIsPlaying(false);
  };

  return (
    <LabLayout
      onStartLab={handleStartLab}
      labResult={labResult ?? undefined}
      {...labProps}
    >
      {isPlaying &&
        ReactDOM.createPortal(
          <LabInternalLayout
            onClose={() => setIsPlaying(false)}
            onLabComplete={handleLabComplete}
            LabNum={2}
          ></LabInternalLayout>,
          document.getElementById("portal")!,
        )}
    </LabLayout>
  );
};

export default Lab2;
