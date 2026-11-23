import { cilBell } from "@coreui/icons";
import ReactDOM from "react-dom";
import { useState } from "react";
import "../../styles/LabWindow.css";
import type { LabResult } from "../../types/labResult";
import LabLayout from "../LabLayout";
import { LabInternalLayout } from "../LabInternalLayout";

const labProps = {
  title: "Bayesian Game",
  objectives: [
    "Read a game of incomplete information: player types and prior beliefs",
    "Update a belief with Bayes' rule after a sensor fires",
    "Chain two alerts into one posterior over the attacker's type",
    "Account for a sensor that is wrong some of the time",
    "Choose a defense that maximizes expected utility under uncertainty",
  ],
  points: 100,
  icon: cilBell,
  accentColor: "#e64980",
};

const Lab6 = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [labResult, setLabResult] = useState<LabResult | null>(null);

  return (
    <LabLayout
      onStartLab={() => setIsPlaying(true)}
      labResult={labResult ?? undefined}
      {...labProps}
    >
      {isPlaying &&
        ReactDOM.createPortal(
          <LabInternalLayout
            onClose={() => setIsPlaying(false)}
            onLabComplete={(result: LabResult) => {
              setLabResult(result);
              setIsPlaying(false);
            }}
            LabNum={6}
          ></LabInternalLayout>,
          document.getElementById("portal")!,
        )}
    </LabLayout>
  );
};

export default Lab6;
