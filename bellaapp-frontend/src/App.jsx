import { BrowserRouter, Routes, Route } from "react-router-dom";

import AuthPage from "./pages/auth/AuthPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import AgendaPage from "./pages/agenda/AgendaPage";
import ClientesPage from "./pages/clientes/ClientesPage";
import ServicosPage from "./pages/servicos/ServicosPage";


 function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Página pública */}
        <Route path="/" element={<AuthPage />} />

        {/* Área logada */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/agenda" element={<AgendaPage />} />
        <Route path="/clientes" element={<ClientesPage />} />
        <Route path="/servicos" element={<ServicosPage />} />
      </Routes>
    </BrowserRouter>
  );
  
}

export default App;

