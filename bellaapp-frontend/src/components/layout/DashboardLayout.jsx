import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import "../../styles/dashboard-layout.css";


export default function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}