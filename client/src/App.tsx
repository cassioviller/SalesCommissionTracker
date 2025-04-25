import React, { lazy, Suspense } from "react";
import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Login from "./pages/login";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Definição de tipos
type UserRole = "admin" | "partner" | null;

// Carregar os componentes administrativos e de parceiro de forma dinâmica
const AdminDashboard = lazy(() => import('./pages/admin/dashboard'));
const CriarParceiro = lazy(() => import('./pages/admin/criar-parceiro'));
const GerenciarParceiros = lazy(() => import('./pages/admin/gerenciar-parceiros-simplificado'));
const PartnerDashboard = lazy(() => import('./pages/partner-dashboard'));
const Comissoes = lazy(() => import('./pages/comissoes'));
const Propostas = lazy(() => import('./pages/propostas'));
const PropostasCards = lazy(() => import('./pages/propostas-cards'));
const AddProposal = lazy(() => import('./pages/add-proposal'));
const EditProposal = lazy(() => import('./pages/edit-proposal'));
const KPIs = lazy(() => import('./pages/kpis'));

// Componente fallback para carregamento
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
  </div>
);

// Rota protegida com carregamento lazy
function ProtectedRoute({ 
  component: Component, 
  path, 
  requiredRole 
}: { 
  component: React.ComponentType, 
  path: string, 
  requiredRole?: UserRole 
}) {
  const auth = useAuth();
  
  return (
    <Route path={path}>
      {auth.isAuthenticated && (!requiredRole || auth.userRole === requiredRole) ? (
        <Suspense fallback={<LoadingFallback />}>
          <Component />
        </Suspense>
      ) : (
        <Redirect to="/" />
      )}
    </Route>
  );
}

// Router principal
function AppRouter() {
  const { isAuthenticated, userRole } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Switch>
        {/* Rota pública de login */}
        <Route path="/">
          {isAuthenticated ? (
            <Redirect to={userRole === "admin" ? "/admin" : "/propostas"} />
          ) : (
            <Login />
          )}
        </Route>
        
        {/* Rotas de administrador */}
        <ProtectedRoute path="/admin" component={AdminDashboard} requiredRole="admin" />
        <ProtectedRoute path="/admin/criar-parceiro" component={CriarParceiro} requiredRole="admin" />
        <ProtectedRoute path="/admin/gerenciar-parceiros" component={GerenciarParceiros} requiredRole="admin" />
        
        {/* Rota de dashboard do parceiro */}
        <ProtectedRoute path="/partner" component={PartnerDashboard} requiredRole="partner" />
        
        {/* Rotas comuns - acessíveis tanto para admin quanto parceiro */}
        <ProtectedRoute path="/propostas" component={Propostas} />
        <ProtectedRoute path="/propostas-cards" component={PropostasCards} />
        <ProtectedRoute path="/add-proposal" component={AddProposal} />
        <ProtectedRoute path="/edit-proposal/:id" component={EditProposal} />
        <ProtectedRoute path="/comissoes" component={Comissoes} />
        <ProtectedRoute path="/kpis" component={KPIs} />
        
        {/* Rota de fallback para não encontrado */}
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

// Componente principal da aplicação
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRouter />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
