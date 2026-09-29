import {
  CButton,
  CCloseButton,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CTab,
  CTabContent,
  CTabList,
  CTabPanel,
  CTabs,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilWarning } from "@coreui/icons";
import "../styles/LabInternalLayout.css";
import { ExampleLab1 } from "./Lab1/ExampleLab1";
import { ExampleLab2 } from "./Lab2/ExampleLab2";
import { ExampleLab3 } from "./Lab3/ExampleLab3";
import { PracticeLab1 } from "./Lab1/PracticeLab1";
import { PracticeLab2 } from "./Lab2/PracticeLab2";
import { PracticeLab3 } from "./Lab3/PracticeLab3";
import { useState } from "react";
import type { ComponentType } from "react";
import type { LabResult } from "../types/labResult";

interface LabInternalLayoutProps {
  onClose: () => void;
  onLabComplete: (result: LabResult) => void;
  LabNum: number;
}

interface PracticeLabProps {
  onSubmit: (result: LabResult) => void;
}

const LAB_COMPONENTS: Record<
  number,
  { Example: ComponentType; Practice: ComponentType<PracticeLabProps> }
> = {
  1: { Example: ExampleLab1, Practice: PracticeLab1 },
  2: { Example: ExampleLab2, Practice: PracticeLab2 },
  3: { Example: ExampleLab3, Practice: PracticeLab3 },
};

export const LabInternalLayout = ({
  onClose,
  onLabComplete,
  LabNum,
}: LabInternalLayoutProps) => {
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const handleConfirmClose = () => {
    setShowCloseConfirm(false);
    onClose();
  };

  const renderExampleLab = (labNum: number) => {
    const lab = LAB_COMPONENTS[labNum];
    if (!lab) {
      return <p className="lab-missing">Lab {labNum} isn't available yet.</p>;
    }
    return <lab.Example />;
  };

  const renderPracticeLab = (labNum: number) => {
    const lab = LAB_COMPONENTS[labNum];
    if (!lab) {
      return <p className="lab-missing">Lab {labNum} isn't available yet.</p>;
    }
    return <lab.Practice onSubmit={onLabComplete} />;
  };

  return (
    // The per-lab class exists so a lab with unusual space needs can opt out
    // of the default inset window. Lab 3's game tree is wide, so it goes
    // fullscreen (see LabInternalLayout.css).
    <div className={`lab-window lab-window-${LabNum}`}>
      <CCloseButton
        className="lab-window-close"
        onClick={() => setShowCloseConfirm(true)}
      />

      <CModal
        visible={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        alignment="center"
        className="close-confirm-modal"
      >
        <CModalHeader>
          <CModalTitle className="close-confirm-title">
            <CIcon icon={cilWarning} className="close-confirm-icon" />
            Close this lab?
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          Closing now will lose all of your progress in this lab. This can't be
          undone.
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            variant="outline"
            onClick={() => setShowCloseConfirm(false)}
          >
            No, go back
          </CButton>
          <CButton color="danger" onClick={handleConfirmClose}>
            Yes, close lab
          </CButton>
        </CModalFooter>
      </CModal>

      <CTabs defaultActiveItemKey="example">
        <CTabList variant="tabs" className="lab-tab-list">
          <CTab itemKey="example">Example</CTab>
          <CTab itemKey="practice">Practice</CTab>
        </CTabList>
        <CTabContent className="lab-tab-content">
          <CTabPanel itemKey="example" className="lab-tab-panel">
            {renderExampleLab(LabNum)}
          </CTabPanel>
          <CTabPanel itemKey="practice" className="lab-tab-panel">
            {renderPracticeLab(LabNum)}
          </CTabPanel>
        </CTabContent>
      </CTabs>
    </div>
  );
};
