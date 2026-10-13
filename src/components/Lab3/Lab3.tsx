import { cilPuzzle } from "@coreui/icons";
import ReactDOM from "react-dom";
import { useState } from "react";
import "../../styles/LabWindow.css";
import type { LabResult } from "../../types/labResult";
import LabLayout from "../LabLayout";
import { LabInternalLayout } from "../LabInternalLayout";

const labProps = {
  title: "Lab 3: Extensive-Form Game",
  objectives: [
    "Understand sequential games",
    "Understand traversing a game tree to find payoffs",
    "Learn how to find the SPNE (Sub-game Perfect Nash Equilibrium",
    "Use backward induction to make rational decisions",
  ],
  points: 100,
  icon: cilPuzzle,
  accentColor: "#c22982",
};

const Lab3 = () => {
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
            LabNum={3}
          ></LabInternalLayout>,
          document.getElementById("portal")!,
        )}
    </LabLayout>
  );
};

export default Lab3;
