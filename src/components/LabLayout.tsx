import { useState } from "react";
import jsPDF from "jspdf";
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardTitle,
  CContainer,
  CForm,
  CFormInput,
  CFormLabel,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilCheckCircle, cilXCircle } from "@coreui/icons";
import "../styles/LabLayout.css";
import type { LabResult } from "../types/labResult";

interface LabLayoutProps {
  title: string;
  objectives: string[];
  points: number;
  icon: string[];
  accentColor: string;
  onStartLab: () => void;
  labResult?: LabResult;
  children: React.ReactNode;
}

const LabLayout = ({
  title,
  objectives,
  points,
  icon,
  accentColor,
  onStartLab,
  labResult,
  children,
}: LabLayoutProps) => {
  const [showResults, setShowResults] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [name, setName] = useState("");

  const onStartPreLab = () => {
    setShowNamePrompt(true);
  };

  // CoreUI's CModal calls `onClose` on every visible -> false transition,
  // not just when the user dismisses it (backdrop click/Escape) - so it
  // also fires right after handleConfirmNamePrompt below closes the modal
  // programmatically. Keep this handler limited to "the modal finished
  // closing, sync our state" and never clear `name` here, or confirming
  // would immediately wipe out the name that was just entered.
  const handleModalClose = () => {
    setShowNamePrompt(false);
  };

  const handleCancelNamePrompt = () => {
    setName("");
    setShowNamePrompt(false);
  };

  const handleConfirmNamePrompt = () => {
    setShowNamePrompt(false);
    onStartLab();
  };

  const handleExportPdf = () => {
    if (!labResult) return;

    const doc = new jsPDF();
    const marginX = 14;
    const pageBottom = 280;
    const wrapWidth = 180;
    let y = 20;

    const ensureRoom = (lineHeight: number) => {
      if (y + lineHeight > pageBottom) {
        doc.addPage();
        y = 20;
      }
    };

    doc.setFontSize(18);
    doc.text(title, marginX, y);
    y += 10;

    doc.setFontSize(12);
    doc.text(`Name: ${name || "Unnamed Student"}`, marginX, y);
    y += 7;
    doc.text(`Score: ${labResult.score}/${points}`, marginX, y);
    y += 12;

    doc.setFontSize(14);
    doc.text("Results", marginX, y);
    y += 8;
    doc.setFontSize(11);

    labResult.results.forEach((result, index) => {
      ensureRoom(20);

      doc.setFont("helvetica", "bold");
      doc.text(
        `${index + 1}. ${result.isCorrect ? "Correct" : "Incorrect"}`,
        marginX,
        y,
      );
      y += 6;

      doc.setFont("helvetica", "normal");
      const questionLines = doc.splitTextToSize(result.question, wrapWidth);
      ensureRoom(questionLines.length * 6);
      doc.text(questionLines, marginX, y);
      y += questionLines.length * 6;

      ensureRoom(6);
      doc.text(`Your answer: ${result.yourAnswer}`, marginX, y);
      y += 6;

      if (!result.isCorrect) {
        ensureRoom(6);
        doc.text(`Correct answer: ${result.correctAnswer}`, marginX, y);
        y += 6;
      }

      y += 4;
    });

    doc.save(`${title.replace(/\s+/g, "_")}_Results.pdf`);
  };

  return (
    <CContainer className="lab-shell">
      <div className="lab-intro">
        <CIcon
          icon={icon}
          size="xxl"
          className="lab-icon"
          style={{ color: accentColor }}
        />
        <h1>{title}</h1>

        <CCard
          className="lab-info-card"
          style={{ borderTop: `4px solid ${accentColor}` }}
        >
          <CCardBody>
            <CCardTitle>Objectives</CCardTitle>
            <ul className="lab-objectives-list">
              {objectives.map((objective) => (
                <li key={objective}>
                  <CIcon
                    icon={cilCheckCircle}
                    className="lab-objective-icon"
                    style={{ color: accentColor }}
                  />
                  <span>{objective}</span>
                </li>
              ))}
            </ul>

            <CBadge
              shape="rounded-pill"
              className="lab-points-badge"
              style={{ backgroundColor: accentColor }}
            >
              {labResult ? `${labResult.score}/${points}` : `${points} pts`}
            </CBadge>

            <div>
              {labResult ? (
                <CButton
                  onClick={() => setShowResults(true)}
                  className="lab-start-button"
                  style={{
                    backgroundColor: accentColor,
                    borderColor: accentColor,
                  }}
                >
                  Results
                </CButton>
              ) : (
                <CButton
                  onClick={onStartPreLab}
                  className="lab-start-button"
                  style={{
                    backgroundColor: accentColor,
                    borderColor: accentColor,
                  }}
                >
                  Start Lab
                </CButton>
              )}
            </div>
          </CCardBody>
        </CCard>
      </div>
      <CModal
        visible={showNamePrompt}
        onClose={handleModalClose}
        alignment="center"
        className="lab-name-modal"
      >
        <CModalHeader>
          <CModalTitle>Enter your name</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CFormInput
            id="lab-name-input"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
          />
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={handleCancelNamePrompt}>
            Cancel
          </CButton>
          <CButton
            style={{ backgroundColor: accentColor, borderColor: accentColor }}
            onClick={handleConfirmNamePrompt}
          >
            OK
          </CButton>
        </CModalFooter>
      </CModal>

      {labResult && (
        <CModal
          visible={showResults}
          onClose={() => setShowResults(false)}
          alignment="center"
          className="lab-results-modal"
        >
          <CModalHeader>
            <CModalTitle>
              Results: {labResult.score}/{points}
            </CModalTitle>
          </CModalHeader>
          <CModalBody>
            <ul className="lab-results-list">
              {labResult.results.map((result, index) => (
                <li
                  key={`${result.question}-${index}`}
                  className={`lab-results-item${
                    result.isCorrect ? " correct" : " incorrect"
                  }`}
                >
                  <CIcon
                    icon={result.isCorrect ? cilCheckCircle : cilXCircle}
                    className="lab-results-icon"
                  />
                  <div>
                    <p className="lab-results-question">{result.question}</p>
                    <p className="lab-results-answer">
                      Your answer: <strong>{result.yourAnswer}</strong>
                    </p>
                    {!result.isCorrect && (
                      <p className="lab-results-answer">
                        Correct answer: <strong>{result.correctAnswer}</strong>
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CModalBody>
          <CModalFooter>
            <CButton
              style={{
                backgroundColor: accentColor,
                borderColor: accentColor,
              }}
              onClick={handleExportPdf}
            >
              Export as PDF
            </CButton>
          </CModalFooter>
        </CModal>
      )}

      {children}
    </CContainer>
  );
};

export default LabLayout;
