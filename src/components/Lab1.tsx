import LabLayout from "./LabLayout";
import { cilBalanceScale } from "@coreui/icons";
import ReactDOM from "react-dom";

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

const handleStartLab = () => {
  return ReactDOM.createPortal(
    <>
      <div>Testing</div>
    </>,
    document.getElementById("portal")!,
  );
};

export const Lab1 = () => {
  return (
    <LabLayout onStartLab={handleStartLab} {...labProps}>
      <></>
    </LabLayout>
  );
};
