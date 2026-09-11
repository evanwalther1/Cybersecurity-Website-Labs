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
import { PracticeLab1 } from "./Lab1/PracticeLab1";
import { PracticeLab2 } from "./Lab2/PracticeLab2";
import { useState } from "react";
import type { LabResult } from "../types/labResult";

interface LabInternalLayoutProps {
  onClose: () => void;
  onLabComplete: (result: LabResult) => void;
  LabNum: number;
}

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

  return (
    <div className="lab-window">
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
            {LabNum == 1 ? <ExampleLab1 /> : <ExampleLab2 />}
          </CTabPanel>
          <CTabPanel itemKey="practice" className="lab-tab-panel">
            {LabNum == 1 ? (
              <PracticeLab1 onSubmit={onLabComplete} />
            ) : (
              <PracticeLab2 onSubmit={onLabComplete} />
            )}
          </CTabPanel>
        </CTabContent>
      </CTabs>
    </div>
  );
};
