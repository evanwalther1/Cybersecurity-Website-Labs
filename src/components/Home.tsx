import {
  CCard,
  CCardBody,
  CCardTitle,
  CCardText,
  CCol,
  CContainer,
  CRow,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import {
  cilBalanceScale,
  cilPuzzle,
  cilChartLine,
  cilGraph,
  cilShieldAlt,
  cilLockLocked,
  cilBug,
} from "@coreui/icons";
import "../styles/Home.css";
import { NavLink } from "react-router-dom";
import { CNavLink } from "@coreui/react";

interface LabSummary {
  title: string;
  description: string;
  icon: string[];
}

const labs: LabSummary[] = [
  {
    title: "Lab 1: Zero-Sum Game (Normal Form)",
    description:
      "Best response, pure Nash Equilibrium, mixed Nash Equilibrium, maxmin, and minmax.",
    icon: cilBalanceScale,
  },
  {
    title: "Lab 2: Non Zero-Sum Game (Normal Form)",
    description:
      "Best response, pure Nash equilibrium, mixed Nash Equilibrium, maxmin, and minmax",
    icon: cilPuzzle,
  },
  {
    title: "Lab 3",
    description: "Concepts for this lab are still being defined.",
    icon: cilChartLine,
  },
  {
    title: "Lab 4",
    description: "Concepts for this lab are still being defined.",
    icon: cilGraph,
  },
  {
    title: "Lab 5",
    description: "Concepts for this lab are still being defined.",
    icon: cilShieldAlt,
  },
  {
    title: "Lab 6",
    description: "Concepts for this lab are still being defined.",
    icon: cilLockLocked,
  },
  {
    title: "Lab 7",
    description: "Concepts for this lab are still being defined.",
    icon: cilBug,
  },
];

const Home = () => {
  return (
    <CContainer className="home-page">
      <div className="home-intro">
        <h1>Game Theory Labs</h1>
        <p>
          This website walks you through a series of hands-on labs exploring
          Game Theory, starting with the fundamentals and building toward more
          advanced game theory topics.
        </p>
      </div>

      <CRow className="justify-content-center g-4 home-lab-grid">
        {labs.map((lab, index) => (
          <CCol xs={12} sm={6} lg={4} key={lab.title}>
            <CNavLink as={NavLink} to={`/lab${index + 1}`}>
              <CCard className="h-100 text-center lab-card">
                <CCardBody>
                  <CIcon icon={lab.icon} size="xxl" className="lab-card-icon" />
                  <CCardTitle>{lab.title}</CCardTitle>
                  <CCardText>{lab.description}</CCardText>
                </CCardBody>
              </CCard>
            </CNavLink>
          </CCol>
        ))}
      </CRow>
    </CContainer>
  );
};

export default Home;
