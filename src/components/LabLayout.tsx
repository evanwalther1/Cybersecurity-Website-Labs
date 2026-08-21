import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardTitle,
  CContainer,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilCheckCircle } from "@coreui/icons";
import "../styles/LabLayout.css";

interface LabLayoutProps {
  title: string;
  objectives: string[];
  points: number;
  icon: string[];
  accentColor: string;
  onStartLab: () => void;
  children: React.ReactNode;
}

const LabLayout = ({
  title,
  objectives,
  points,
  icon,
  accentColor,
  onStartLab,
  children,
}: LabLayoutProps) => {
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
              {points} pts
            </CBadge>

            <div>
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
            </div>
          </CCardBody>
        </CCard>
      </div>

      {children}
    </CContainer>
  );
};

export default LabLayout;
