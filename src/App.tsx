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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SafariMobileFix>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/super-admin" element={<SuperAdminRoute><SuperAdmin /></SuperAdminRoute>} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />

            <Route path="/renovacoes" element={<ProtectedRoute><RenovacoesSimples /></ProtectedRoute>} />
            <Route path="/chamados" element={<ProtectedRoute><Chamados /></ProtectedRoute>} />
            <Route path="/chamados/novo" element={<ProtectedRoute><NovoChamado /></ProtectedRoute>} />
            <Route path="/chamados/:id/editar" element={<ProtectedRoute><EditarChamado /></ProtectedRoute>} />
            <Route path="/equipes" element={<ProtectedRoute><Equipes /></ProtectedRoute>} />
            <Route path="/equipes/nova" element={<ProtectedRoute><NovaEquipe /></ProtectedRoute>} />
            <Route path="/equipes/:id/editar" element={<ProtectedRoute><EditarEquipe /></ProtectedRoute>} />
            <Route path="/clientes/novo" element={<ProtectedRoute><NovoCliente /></ProtectedRoute>} />
            <Route path="/clientes/:id/editar" element={<ProtectedRoute><EditarCliente /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          
            {/* PWA Components */}
            <PWAInstallBanner />
            <PWAUpdateBanner />
          </BrowserRouter>
        </TooltipProvider>
      </SafariMobileFix>
    </AuthProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
