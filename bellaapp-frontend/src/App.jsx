import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import DashboardLayout from "./components/layout/DashboardLayout";
import { isAuthenticated } from "./services/api";
import AgendaPage from "./pages/agenda/AgendaPage";
import AuthPage from "./pages/auth/AuthPage";
import ClientesPage from "./pages/clientes/ClientesPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import ServicosPage from "./pages/servicos/ServicosPage";
import ProfissionaisPage from "./pages/profissionais/ProfissionaisPage";

function ProtectedLayout() {
  if (!isAuthenticated()) {
    return <Navigate replace to="/login" />;
  }

  return <DashboardLayout />;
}

function PublicOnlyRoute({ children }) {
  if (isAuthenticated()) {
    return <Navigate replace to="/dashboard" />;
  }

  return children;
}

function RootRedirect() {
  return <Navigate replace to={isAuthenticated() ? "/dashboard" : "/login"} />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <AuthPage />
            </PublicOnlyRoute>
          }
        />

        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/servicos" element={<ServicosPage />} />
          <Route path="/profissionais" element={<ProfissionaisPage />} />
        </Route>

        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
