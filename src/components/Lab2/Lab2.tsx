import { cilBalanceScale } from "@coreui/icons";
import ReactDOM from "react-dom";
import { useState } from "react";
import "../../styles/LabWindow.css";
import type { LabResult } from "../../types/labResult";
import LabLayout from "../LabLayout";
import { LabInternalLayout } from "../LabInternalLayout";

const labProps = {
  title: "Lab 2: Non Zero-Sum Game (Normal Form)",
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
        ReactDOM.createPortal(<></>, document.getElementById("portal")!)}
    </LabLayout>
  );
};

export default Lab2;
