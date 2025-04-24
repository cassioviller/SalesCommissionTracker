import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { BarChart2, FileText, FileTextIcon, Home, LogOut, Users, Grid } from "lucide-react";

export default function NavigationHeader() {
  const { userRole, logout } = useAuth();
  const [location] = useLocation();
  
  return (
    <header className="bg-white border-b shadow-sm py-3 px-6 sticky top-0 z-10">
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div className="flex items-center gap-1 font-semibold text-lg text-primary">
          <BarChart2 className="h-5 w-5" />
          <span>Comissões EDV</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {userRole === "admin" && (
            <>
              <Button 
                variant={location === "/admin" ? "default" : "outline"} 
                size="sm" 
                asChild
              >
                <a href="/admin">
                  <Home className="h-4 w-4 mr-1" />
                  Dashboard
                </a>
              </Button>
              
              <Button 
                variant={location.includes("/admin/gerenciar-parceiros") ? "default" : "outline"} 
                size="sm" 
                asChild
              >
                <a href="/admin/gerenciar-parceiros">
                  <Users className="h-4 w-4 mr-1" />
                  Parceiros
                </a>
              </Button>
            </>
          )}
          
          {userRole === "partner" && (
            <Button 
              variant={location === "/partner" ? "default" : "outline"} 
              size="sm" 
              asChild
            >
              <a href="/partner">
                <Home className="h-4 w-4 mr-1" />
                Dashboard
              </a>
            </Button>
          )}
          
          <Button 
            variant={location === "/propostas" || location.includes("/edit-proposal") || location === "/add-proposal" ? "default" : "outline"} 
            size="sm" 
            asChild
          >
            <a href="/propostas">
              <FileText className="h-4 w-4 mr-1" />
              Propostas
            </a>
          </Button>
          
          <Button 
            variant={location === "/comissoes" ? "default" : "outline"} 
            size="sm" 
            asChild
          >
            <a href="/comissoes">
              <FileTextIcon className="h-4 w-4 mr-1" />
              Comissões
            </a>
          </Button>
          
          <Button 
            variant={location === "/kpis" ? "default" : "outline"} 
            size="sm" 
            asChild
          >
            <a href="/kpis">
              <BarChart2 className="h-4 w-4 mr-1" />
              KPIs
            </a>
          </Button>
          
          <Button 
            variant={location === "/propostas-cards" ? "default" : "outline"} 
            size="sm" 
            asChild
          >
            <a href="/propostas-cards">
              <Grid className="h-4 w-4 mr-1" />
              Cards
            </a>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 mr-1" />
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}