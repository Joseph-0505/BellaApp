import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";

import DashboardLayout from "./components/layout/DashboardLayout";
import AgendaPage from "./pages/agenda/AgendaPage";
import ActivateAccountPage from "./pages/auth/ActivateAccountPage";
import AuthPage from "./pages/auth/AuthPage";
import ClientesPage from "./pages/clientes/ClientesPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import LandingPage from "./pages/landing/LandingPage";
import ProfilePage from "./pages/perfil/ProfilePage";
import CaixaPage from "./pages/caixa/CaixaPage";
import RoomsPage from "./pages/rooms/RoomsPage";
import ServicosPage from "./pages/servicos/ServicosPage";
import ProfissionaisPage from "./pages/profissionais/ProfissionaisPage";
import PlansPage from "./pages/planos/PlansPage";
import OnboardingPage from "./pages/onboarding/OnboardingPage";
import useAuth from "./hooks/useAuth";

function AppLoadingScreen() {
  return <div className="auth-page">Carregando...</div>;
}

function resolveAuthenticatedRedirect(onboarding) {
  return onboarding?.completed === true ? "/dashboard" : "/onboarding";
}

function ProtectedLayout() {
  const { bootstrapping, isAuthenticated, onboarding, onboardingLoading } = useAuth();

  if (bootstrapping || (isAuthenticated && onboardingLoading)) {
    return <AppLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/login" />;
  }

  if (onboarding?.completed !== true) {
    return <Navigate replace to="/onboarding" />;
  }

  return <DashboardLayout />;
}

function PublicOnlyRoute({ children }) {
  const { bootstrapping, isAuthenticated, onboarding, onboardingLoading } = useAuth();

  if (bootstrapping || (isAuthenticated && onboardingLoading)) {
    return <AppLoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate replace to={resolveAuthenticatedRedirect(onboarding)} />;
  }

  return children;
}

function LandingRoute() {
  return <LandingPage />;
}

function OnboardingRoute() {
  const location = useLocation();
  const { bootstrapping, isAuthenticated, onboarding, onboardingLoading } = useAuth();

  if (bootstrapping || (isAuthenticated && onboardingLoading)) {
    return <AppLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/login" />;
  }

  const searchParams = new URLSearchParams(location.search);
  const previewMode = searchParams.get("preview") === "1" || searchParams.get("preview") === "true";

  if (onboarding?.completed === true && !previewMode) {
    return <Navigate replace to="/dashboard" />;
  }

  return <OnboardingPage />;
}

function OnboardingPreviewRoute() {
  const { bootstrapping, isAuthenticated, onboardingLoading } = useAuth();

  if (bootstrapping || (isAuthenticated && onboardingLoading)) {
    return <AppLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/login" />;
  }

  return <OnboardingPage />;
}

function RootRedirect() {
  const { bootstrapping, isAuthenticated, onboarding, onboardingLoading } = useAuth();

  if (bootstrapping || (isAuthenticated && onboardingLoading)) {
    return <AppLoadingScreen />;
  }

  return <Navigate replace to={isAuthenticated ? resolveAuthenticatedRedirect(onboarding) : "/"} />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingRoute />} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <AuthPage />
            </PublicOnlyRoute>
          }
        />
        <Route path="/ativar-conta" element={<ActivateAccountPage />} />
        <Route path="/onboarding" element={<OnboardingRoute />} />
        <Route path="/onboarding/preview" element={<OnboardingPreviewRoute />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/caixa" element={<CaixaPage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/servicos" element={<ServicosPage />} />
          <Route path="/profissionais" element={<ProfissionaisPage />} />
          <Route path="/planos" element={<PlansPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
