import { cilGraph } from "@coreui/icons";
import ReactDOM from "react-dom";
import { useState } from "react";
import "../../styles/LabWindow.css";
import type { LabResult } from "../../types/labResult";
import LabLayout from "../LabLayout";
import { LabInternalLayout } from "../LabInternalLayout";

const labProps = {
  title: "Lab 4: Stackelberg Security Game",
  objectives: [
    "Understand commitment: the leader moves first, in the open",
    "Compute expected utility under a mixed defense",
    "Find the attacker's best response to a commitment",
    "Optimize a commitment by making the attacker indifferent",
  ],
  points: 100,
  icon: cilGraph,
  accentColor: "#f08c00",
};

const Lab4 = () => {
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
            LabNum={4}
          ></LabInternalLayout>,
          document.getElementById("portal")!,
        )}
    </LabLayout>
  );
};

export default Lab4;
