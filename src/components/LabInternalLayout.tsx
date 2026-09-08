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
import { ExampleLab1 } from "./ExampleLab1";
import { PracticeLab1 } from "./PracticeLab1";
import { useState } from "react";
import type { LabResult } from "../types/labResult";

interface LabInternalLayoutProps {
  onClose: () => void;
  onLabComplete: (result: LabResult) => void;
}

export const LabInternalLayout = ({
  onClose,
  onLabComplete,
}: LabInternalLayoutProps) => {
  const [hasCompleted, setHasCompleted] = useState(false);
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
            <ExampleLab1 setHasCompleted={setHasCompleted} />
          </CTabPanel>
          <CTabPanel itemKey="practice" className="lab-tab-panel">
            <PracticeLab1 onSubmit={onLabComplete} />
          </CTabPanel>
        </CTabContent>
      </CTabs>
    </div>
  );
};
