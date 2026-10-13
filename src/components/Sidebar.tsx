import type { CSSProperties } from "react";
import {
  CSidebar,
  CSidebarBrand,
  CSidebarHeader,
  CSidebarNav,
  CNavItem,
  CNavTitle,
  CNavLink,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilHome } from "@coreui/icons";
import { NavLink } from "react-router-dom";
import bsuLogo from "../assets/bsu-logo.png";
import { LABS } from "../data/labs";
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
        </CSidebarBrand>
      </CSidebarHeader>

      <CSidebarNav>
        <CNavItem>
          <CNavLink as={NavLink} to="/home">
            <CIcon customClassName="nav-icon" icon={cilHome} />
            Home
          </CNavLink>
        </CNavItem>
        <CNavTitle>Labs</CNavTitle>

        {LABS.map((lab) => {
          // The accent is handed to CSS as a custom property so the icon tint
          // and the active bar both read from one value, and so the color
          // stays defined only in data/labs.ts.
          const accent = { "--lab-accent": lab.accent } as CSSProperties;
          const label = `Lab ${lab.number}`;
          // Each lab's own icon rather than a generic bullet. This matters most
          // when the sidebar is collapsed, where labels are hidden and seven
          // identical bullets gave nothing to navigate by.
          const icon = <CIcon customClassName="nav-icon" icon={lab.icon} />;

          return lab.sidebarPath ? (
            <CNavItem key={lab.number}>
              <CNavLink as={NavLink} to={lab.sidebarPath} style={accent}>
                {icon}
                {label}
              </CNavLink>
            </CNavItem>
          ) : (
            <CNavItem key={lab.number} href="#" style={accent}>
              {icon}
              {label}
            </CNavItem>
          );
        })}
      </CSidebarNav>
    </CSidebar>
  );
};

export default Sidebar;
