import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import "../styles/Layout.css";

const Layout = () => {
  return (
    <>
      <Sidebar />
      <main className="lab-content">
        <Outlet />
      </main>
    </>
  );
};

export default Layout;
