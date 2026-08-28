import type { CSSProperties } from "react";
import {
  CSidebar,
  CSidebarBrand,
  CSidebarHeader,
  CSidebarNav,
  CNavItem,
  CNavTitle,
  CNavLink,
  CBadge,
  CNavGroup,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilSoccer, cilHome, cilApps } from "@coreui/icons";
import { NavLink } from "react-router-dom";
import bsuLogo from "../assets/bsu-logo.png";
import "../styles/Sidebar.css";

const Sidebar = () => {
  return (
    <CSidebar className="border-end" unfoldable colorScheme="dark">
      <CSidebarHeader className="border-bottom">
        <CSidebarBrand className="d-flex align-items-center gap-2">
          <img
            src={bsuLogo}
            alt="Boise State University"
            className="sidebar-brand-icon"
          />
          {/* <span className="d-sidebar-narrow-none">BSU Labs</span> */}
        </CSidebarBrand>
      </CSidebarHeader>

      <CSidebarNav>
        <CNavItem>
          <CNavLink as={NavLink} to="/home">
            <CIcon customClassName={"nav-icon"} icon={cilHome} />
            Home
          </CNavLink>
        </CNavItem>
        <CNavTitle>Labs</CNavTitle>
        <CNavItem>
          <CNavLink as={NavLink} to="/lab1">
            <span className="nav-icon">
              <span className="nav-icon-bullet"></span>
            </span>{" "}
            Lab 1
          </CNavLink>
        </CNavItem>
        <CNavItem href="#">
          <span className="nav-icon">
            <span className="nav-icon-bullet"></span>
          </span>{" "}
          Lab 2
        </CNavItem>
        <CNavItem href="#">
          <span className="nav-icon">
            <span className="nav-icon-bullet"></span>
          </span>{" "}
          Lab 3
        </CNavItem>
        <CNavItem href="#">
          <span className="nav-icon">
            <span className="nav-icon-bullet"></span>
          </span>{" "}
          Lab 4
        </CNavItem>
        <CNavItem href="#">
          <span className="nav-icon">
            <span className="nav-icon-bullet"></span>
          </span>{" "}
          Lab 5
        </CNavItem>
        <CNavItem href="#">
          <span className="nav-icon">
            <span className="nav-icon-bullet"></span>
          </span>{" "}
          Lab 6
        </CNavItem>
        <CNavItem href="#">
          <span className="nav-icon">
            <span className="nav-icon-bullet"></span>
          </span>{" "}
          Lab 7
        </CNavItem>
      </CSidebarNav>
    </CSidebar>
  );
};

export default Sidebar;
