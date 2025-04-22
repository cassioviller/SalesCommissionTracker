import React, { createContext, useState, ReactNode, useContext, useEffect } from "react";

// Tipo de papel do usuário
type UserRole = "admin" | "partner" | null;

// Tipo para o contexto de autenticação
type AuthContextType = {
  isAuthenticated: boolean;
  userRole: UserRole;
  login: (username: string, password: string, partnerId?: string) => boolean;
  logout: () => void;
  partnerId?: string;
};

// Criar o contexto
const AuthContext = createContext<AuthContextType | null>(null);

// Provedor do contexto
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [partnerId, setPartnerId] = useState<string | undefined>(undefined);
  
  // Verificar se há dados de autenticação no localStorage ao iniciar
  useEffect(() => {
    const storedAuth = localStorage.getItem("auth");
    if (storedAuth) {
      const authData = JSON.parse(storedAuth);
      setIsAuthenticated(true);
      setUserRole(authData.role);
      setPartnerId(authData.partnerId);
    }
  }, []);
  
  // Função de login
  const login = (username: string, password: string): boolean => {
    // Login de admin
    if (username === "estruturasdv" && password === "Opala1979") {
      const authData = { role: "admin" };
      localStorage.setItem("auth", JSON.stringify(authData));
      setIsAuthenticated(true);
      setUserRole("admin");
      setPartnerId(undefined);
      return true;
    } 
    // Login de parceiro (simplificado - seria validado contra banco de dados)
    // Simulação de parceiros no sistema - no mundo real, isso viria do banco de dados
    const partners = [
      { username: "parceiro1", password: "senha123", id: "PARTNER-1001" },
      { username: "parceiro2", password: "senha123", id: "PARTNER-1002" }
    ];
    
    const partner = partners.find(p => p.username === username && p.password === password);
    
    if (partner) {
      const authData = { role: "partner", partnerId: partner.id };
      localStorage.setItem("auth", JSON.stringify(authData));
      setIsAuthenticated(true);
      setUserRole("partner");
      setPartnerId(partner.id);
      return true;
    }
    
    return false;
  };
  
  // Função de logout
  const logout = () => {
    localStorage.removeItem("auth");
    setIsAuthenticated(false);
    setUserRole(null);
    setPartnerId(undefined);
  };
  
  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, login, logout, partnerId }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar a autenticação
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}

// Exportação padrão do contexto
export default AuthContext;