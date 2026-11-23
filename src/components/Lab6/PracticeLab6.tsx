import type { LabResult } from "../../types/labResult";

interface PracticeLab6Props {
  onSubmit: (result: LabResult) => void;
}

/**
 * Placeholder, so Lab 6 can be registered and its Example reached. `onSubmit`
 * is kept rather than removed so wiring the real Practice in later is a
 * change to this file alone.
 */
export const PracticeLab6 = ({ onSubmit }: PracticeLab6Props) => {
  void onSubmit;
  return (
    <div className="lab-missing">
      <p>TBD</p>
    </div>
  );
};
