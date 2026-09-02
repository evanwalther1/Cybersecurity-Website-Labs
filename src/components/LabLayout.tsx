import { useState } from "react";
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardTitle,
  CContainer,
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
                  onClick={onStartLab}
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
        </CModal>
      )}

      {children}
    </CContainer>
  );
};

export default LabLayout;
