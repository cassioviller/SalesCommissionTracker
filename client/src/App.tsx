import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Comissoes from "@/pages/comissoes";
import Sidebar from "@/components/sidebar";
// Importações com caminhos relativos em vez de alias
import AdminLogin from "./pages/admin-login";
import PartnerLogin from "./pages/partner-login";
import PartnerDashboard from "./pages/partner-dashboard";

function Router() {
  const [location] = useLocation();
  
  // Verificar se estamos em uma página de login ou dashboard de parceiro
  const isLoginPage = location === "/admin-login" || location === "/partner-login";
  const isPartnerPage = location === "/partner-dashboard";
  
  // Se estiver em uma página de login ou parceiro, não mostrar o sidebar
  if (isLoginPage || isPartnerPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Switch>
          <Route path="/admin-login" component={AdminLogin} />
          <Route path="/partner-login" component={PartnerLogin} />
          <Route path="/partner-dashboard" component={PartnerDashboard} />
          <Route component={NotFound} />
        </Switch>
      </div>
    );
  }
  
  // Layout padrão com sidebar para as outras páginas
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <main className="p-6">
          <Switch>
            <Route path="/" component={Comissoes}/>
            <Route path="/comissoes" component={Comissoes}/>
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
