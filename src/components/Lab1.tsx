import LabLayout from "./LabLayout";
import { LabInternalLayout } from "./LabInternalLayout";
import { cilBalanceScale } from "@coreui/icons";
import ReactDOM from "react-dom";
import { useState } from "react";
import "../styles/LabWindow.css";

const labProps = {
  title: "Lab 1: Introduction to Game Theory",
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

  const handleStartLab = () => {
    setIsPlaying(true);
  };

  return (
    <LabLayout onStartLab={handleStartLab} {...labProps}>
      {isPlaying &&
        ReactDOM.createPortal(
          <LabInternalLayout
            onClose={() => setIsPlaying(false)}
          ></LabInternalLayout>,
          document.getElementById("portal")!,
        )}
    </LabLayout>
  );
};
