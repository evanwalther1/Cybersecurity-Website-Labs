import "../../styles/ExampleLab4.css";
import type { LabResult } from "../../types/labResult";

interface PracticeLab4Props {
  onSubmit: (result: LabResult) => void;
}

// Not built yet. Example Lab 4 is complete; Practice is the next piece of work.
export const PracticeLab4 = ({ onSubmit: _onSubmit }: PracticeLab4Props) => {
  return (
    <div className="lab4-practice-pending">
      <p>Practice for this lab is still being built.</p>
    </div>
  );
};
