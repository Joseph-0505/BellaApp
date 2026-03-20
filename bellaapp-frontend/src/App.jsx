import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AuthPage from "./pages/auth/AuthPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import AgendaPage from "./pages/agenda/AgendaPage";
import ClientesPage from "./pages/clientes/ClientesPage";
import ServicosPage from "./pages/servicos/ServicosPage";

import DashboardLayout from "./components/layout/DashboardLayout";

 function App() {
  return (
  <BrowserRouter>
    <Routes>

     {/* Pública */}
     <Route path="/login" element={<AuthPage />} />

      {/* Protegida*/}
      <Route element={<DashboardLayout/>}>
       <Route path="/dashboard" element={<DashboardPage />} />
       <Route path="/agenda" element={<AgendaPage />} />
       <Route path="/clientes" element={<ClientesPage />} />
       <Route path="/servicos" element={<ServicosPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard"/>}/>

    </Routes>
  </BrowserRouter>
  );
  
}

export default App;

