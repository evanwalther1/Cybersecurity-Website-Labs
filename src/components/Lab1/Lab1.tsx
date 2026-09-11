import LabLayout from "../LabLayout";
import { LabInternalLayout } from "../LabInternalLayout";
import { cilBalanceScale } from "@coreui/icons";
import ReactDOM from "react-dom";
import { useState } from "react";
import "../../styles/LabWindow.css";
import type { LabResult } from "../../types/labResult";

const labProps = {
  title: "Lab 1: Zero-Sum Game (Normal Form)",
  objectives: [
    "Find a player's best response to an opponent's strategy.",
    "Identify pure Nash equilibrium",
    "Identify mixed Nash equilibrium in a game.",
    "Apply the maxmin strategy to a game.",
    "Apply the minmax strategy to a game.",
  ],
  points: 100,
  icon: cilBalanceScale,
  accentColor: "#4dabf7",
};

export const Lab1 = () => {
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
            LabNum={1}
          ></LabInternalLayout>,
          document.getElementById("portal")!,
        )}
    </LabLayout>
  );
};
