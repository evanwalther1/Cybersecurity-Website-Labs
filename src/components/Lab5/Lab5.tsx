import { cilShieldAlt } from "@coreui/icons";
import ReactDOM from "react-dom";
import { useState } from "react";
import "../../styles/LabWindow.css";
import type { LabResult } from "../../types/labResult";
import LabLayout from "../LabLayout";
import { LabInternalLayout } from "../LabInternalLayout";

const labProps = {
  title: "Repeated Game",
  objectives: [
    "Read an attack history and name the pattern behind it",
    "Value a stream of future rounds with a discount factor",
    "Define a trigger strategy and find where it fails",
    "Weigh adapting to a pattern against staying unpredictable",
  ],
  points: 100,
  icon: cilShieldAlt,
  accentColor: "#7048e8",
};

const Lab5 = () => {
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
            LabNum={5}
          ></LabInternalLayout>,
          document.getElementById("portal")!,
        )}
    </LabLayout>
  );
};

export default Lab5;
