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
  const login = (username: string, password: string, partnerIdParam?: string): boolean => {
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
    else if (username && password && partnerIdParam) {
      const authData = { role: "partner", partnerId: partnerIdParam };
      localStorage.setItem("auth", JSON.stringify(authData));
      setIsAuthenticated(true);
      setUserRole("partner");
      setPartnerId(partnerIdParam);
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