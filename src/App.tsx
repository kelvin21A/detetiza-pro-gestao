import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Spinner from './components/ui/spinner';
import { ProtectedRoute } from "./components/ProtectedRoute";
import SuperAdminRoute from "./components/SuperAdminRoute";
import SafariMobileFix from "./components/SafariMobileFix";
import { PWAInstallBanner, PWAUpdateBanner } from "./components/PWAInstallBanner";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SuperAdmin from "./pages/SuperAdmin";
import Clientes from "./pages/Clientes";
import RenovacoesSimples from "./pages/RenovacoesSimples";
import Agenda from "./pages/Agenda";
import NovoAgendamento from "./pages/NovoAgendamento";
import EditarAgendamento from "./pages/EditarAgendamento";
import Equipes from "./pages/Equipes";
import NovaEquipe from "./pages/NovaEquipe";
import EditarEquipe from "./pages/EditarEquipe";
import NovoCliente from "./pages/NovoCliente";
import EditarCliente from "./pages/EditarCliente";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Em produção, o DevTools não será incluído no bundle final.
const DevTools = process.env.NODE_ENV === 'development' 
  ? React.lazy(() => import('./components/DevTools')) 
  : () => null;

const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return <Spinner />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/super-admin" element={<SuperAdminRoute><SuperAdmin /></SuperAdminRoute>} />
        <Route path="/" element={<ProtectedRoute title="Dashboard"><Index /></ProtectedRoute>} />
        <Route path="/clientes" element={<ProtectedRoute title="Clientes"><Clientes /></ProtectedRoute>} />
        <Route path="/renovacoes" element={<ProtectedRoute title="Renovações"><RenovacoesSimples /></ProtectedRoute>} />
        <Route path="/agenda" element={<ProtectedRoute title="Agenda"><Agenda /></ProtectedRoute>} />
        <Route path="/agenda/novo" element={<ProtectedRoute title="Novo Agendamento"><NovoAgendamento /></ProtectedRoute>} />
        <Route path="/agenda/:id/editar" element={<ProtectedRoute title="Editar Agendamento"><EditarAgendamento /></ProtectedRoute>} />
        <Route path="/equipes" element={<ProtectedRoute title="Equipes"><Equipes /></ProtectedRoute>} />
        <Route path="/equipes/nova" element={<ProtectedRoute title="Nova Equipe"><NovaEquipe /></ProtectedRoute>} />
        <Route path="/equipes/:id/editar" element={<ProtectedRoute title="Editar Equipe"><EditarEquipe /></ProtectedRoute>} />
        <Route path="/clientes/novo" element={<ProtectedRoute title="Novo Cliente"><NovoCliente /></ProtectedRoute>} />
        <Route path="/clientes/:id/editar" element={<ProtectedRoute title="Editar Cliente"><EditarCliente /></ProtectedRoute>} />
        <Route path="/configuracoes" element={<ProtectedRoute title="Configurações"><Configuracoes /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <PWAInstallBanner />
      <PWAUpdateBanner />
    </BrowserRouter>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <SafariMobileFix>
            <Toaster />
            <Sonner />
            <AppContent />
          </SafariMobileFix>
        </AuthProvider>
      </TooltipProvider>
      <React.Suspense fallback={null}>
        <DevTools />
      </React.Suspense>
    </QueryClientProvider>
  );
}

export default App;
