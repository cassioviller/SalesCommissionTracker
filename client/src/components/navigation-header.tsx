import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useLocation, Link } from "wouter";
import { BarChart2, FileText, FileTextIcon, LogOut, Users, Home } from "lucide-react";

export default function NavigationHeader() {
  const { userRole, logout } = useAuth();
  const [location, navigate] = useLocation();
  
  const handleLogout = () => {
    logout();
    navigate("/");
  };
  
  return (
    <header className="bg-white border-b shadow-sm py-3 px-6 sticky top-0 z-10">
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div className="flex items-center gap-1 font-semibold text-lg text-primary">
          <BarChart2 className="h-5 w-5" />
          <span>Comissões EDV</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {userRole === "admin" && (
            <Button 
              variant={location === "/admin/gerenciar-parceiros" ? "default" : "outline"} 
              size="sm" 
              asChild
            >
              <Link href="/admin/gerenciar-parceiros">
                <Users className="h-4 w-4 mr-1" />
                Parceiros
              </Link>
            </Button>
          )}
          
          {userRole === "partner" && (
            <Button 
              variant={location === "/partner" ? "default" : "outline"} 
              size="sm" 
              asChild
            >
              <Link href="/partner">
                <Home className="h-4 w-4 mr-1" />
                Dashboard
              </Link>
            </Button>
          )}
          
          <Button 
            variant={location === "/propostas" || location.includes("/edit-proposal") || location === "/add-proposal" ? "default" : "outline"} 
            size="sm" 
            asChild
          >
            <Link href="/propostas">
              <FileText className="h-4 w-4 mr-1" />
              Propostas
            </Link>
          </Button>
          
          <Button 
            variant={location === "/comissoes" ? "default" : "outline"} 
            size="sm" 
            asChild
          >
            <Link href="/comissoes">
              <FileTextIcon className="h-4 w-4 mr-1" />
              Comissões
            </Link>
          </Button>
          
          <Button 
            variant={location === "/kpis" ? "default" : "outline"} 
            size="sm" 
            asChild
          >
            <Link href="/kpis">
              <BarChart2 className="h-4 w-4 mr-1" />
              KPIs
            </Link>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-1" />
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}