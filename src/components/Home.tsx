import {
  CCard,
  CCardBody,
  CCardText,
  CCol,
  CContainer,
  CRow,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import "../styles/Home.css";
import { NavLink } from "react-router-dom";
import type { CSSProperties } from "react";
import { LABS } from "../data/labs";

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
        {LABS.map((lab) => {
          const isOpen = lab.accent !== undefined;

          const card = (
            <CCard
              className={`h-100 text-center lab-card ${
                isOpen ? "is-open" : "is-soon"
              }`}
              // Handed to CSS as a custom property so the color stays defined
              // only in data/labs.ts.
              style={{ "--lab-accent": lab.accent } as CSSProperties}
            >
              <CCardBody>
                <CIcon icon={lab.icon} size="xxl" className="lab-card-icon" />
                <p className="lab-card-title">{lab.title}</p>
                {lab.subtitle && (
                  <p className="lab-card-subtitle">{lab.subtitle}</p>
                )}
                <CCardText>{lab.description}</CCardText>
              </CCardBody>
            </CCard>
          );

          return (
            <CCol xs={12} sm={6} lg={4} key={lab.number}>
              {isOpen ? (
                <NavLink to={`/lab${lab.number}`} className="lab-card-link">
                  {card}
                </NavLink>
              ) : (
                // Not a link: App.tsx has no route for these, so wrapping them
                // would give a clickable card that navigates nowhere.
                <div className="lab-card-link is-soon" aria-disabled="true">
                  {card}
                </div>
              )}
            </CCol>
          );
        })}
      </CRow>
    </CContainer>
  );
};

export default Home;
