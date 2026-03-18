import Sidebar from "./Sidebar";
import "../../styles/dashboard-layout.css";

export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-content">
        {children}
      </main>
    </div>
  );
}