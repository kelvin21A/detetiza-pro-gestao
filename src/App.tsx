import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import SuperAdminRoute from "./components/SuperAdminRoute";
import SafariMobileFix from "./components/SafariMobileFix";
import { PWAInstallBanner, PWAUpdateBanner } from "./components/PWAInstallBanner";
import ErrorBoundary from "./components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SuperAdmin from "./pages/SuperAdmin";
import Clientes from "./pages/Clientes";
import RenovacoesSimples from "./pages/RenovacoesSimples";
import Chamados from "./pages/Chamados";
import NovoChamado from "./pages/NovoChamado";
import EditarChamado from "./pages/EditarChamado";
import Equipes from "./pages/Equipes";
import NovaEquipe from "./pages/NovaEquipe";
import EditarEquipe from "./pages/EditarEquipe";
import NovoCliente from "./pages/NovoCliente";
import EditarCliente from "./pages/EditarCliente";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";
import { useAuth } from "./contexts/AuthContext";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
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
        <Route path="/chamados" element={<ProtectedRoute title="Chamados"><Chamados /></ProtectedRoute>} />
        <Route path="/chamados/novo" element={<ProtectedRoute title="Novo Chamado"><NovoChamado /></ProtectedRoute>} />
        <Route path="/chamados/:id/editar" element={<ProtectedRoute title="Editar Chamado"><EditarChamado /></ProtectedRoute>} />
        <Route path="/equipes" element={<ProtectedRoute title="Equipes"><Equipes /></ProtectedRoute>} />
        <Route path="/equipes/nova" element={<ProtectedRoute title="Nova Equipe"><NovaEquipe /></ProtectedRoute>} />
        <Route path="/equipes/:id/editar" element={<ProtectedRoute title="Editar Equipe"><EditarEquipe /></ProtectedRoute>} />
        <Route path="/clientes/novo" element={<ProtectedRoute title="Novo Cliente"><NovoCliente /></ProtectedRoute>} />
        <Route path="/clientes/:id/editar" element={<ProtectedRoute title="Editar Cliente"><EditarCliente /></ProtectedRoute>} />
        <Route path="/configuracoes" element={<ProtectedRoute title="Configurações"><Configuracoes /></ProtectedRoute>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {/* PWA Components */}
      <PWAInstallBanner />
      <PWAUpdateBanner />
    </BrowserRouter>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SafariMobileFix>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppContent />
          </TooltipProvider>
        </SafariMobileFix>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
