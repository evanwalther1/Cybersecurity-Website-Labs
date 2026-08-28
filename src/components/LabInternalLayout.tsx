import {
  CCloseButton,
  CTab,
  CTabContent,
  CTabList,
  CTabPanel,
  CTabs,
} from "@coreui/react";
import "../styles/LabInternalLayout.css";
import { ExampleLab1 } from "./ExampleLab1";
import { PracticeLab1 } from "./PracticeLab1";
import { useState } from "react";

interface LabInternalLayoutProps {
  onClose: () => void;
}

export const LabInternalLayout = ({ onClose }: LabInternalLayoutProps) => {
  const [hasCompleted, setHasCompleted] = useState(false);
  return (
    <div className="lab-window">
      <CCloseButton className="lab-window-close" onClick={onClose} />

      <CTabs defaultActiveItemKey="example">
        <CTabList variant="tabs" className="lab-tab-list">
          <CTab itemKey="example">Example</CTab>
          <CTab itemKey="practice" disabled={!hasCompleted}>
            Practice
          </CTab>
        </CTabList>
        <CTabContent className="lab-tab-content">
          <CTabPanel itemKey="example" className="lab-tab-panel">
            <ExampleLab1 setHasCompleted={setHasCompleted} />
          </CTabPanel>
          <CTabPanel itemKey="practice" className="lab-tab-panel">
            <PracticeLab1 />
          </CTabPanel>
        </CTabContent>
      </CTabs>
    </div>
  );
};
