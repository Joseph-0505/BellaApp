import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import "../../styles/dashboard-layout.css";


export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`dashboard-layout ${collapsed ? "is-sidebar-collapsed" : ""}`}>
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((current) => !current)}
      />

      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}
