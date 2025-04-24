import React, { createContext, useState, ReactNode, useContext, useEffect } from "react";

// Tipo de papel do usuário
type UserRole = "admin" | "partner" | null;

// Tipo para o contexto de autenticação
type AuthContextType = {
  isAuthenticated: boolean;
  userRole: UserRole;
  login: (username: string, password: string) => Promise<boolean>;
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
  const login = async (username: string, password: string): Promise<boolean> => {
    // Login de admin
    if (username === "estruturasdv" && password === "Opala1979") {
      const authData = { role: "admin" };
      localStorage.setItem("auth", JSON.stringify(authData));
      setIsAuthenticated(true);
      setUserRole("admin");
      setPartnerId(undefined);
      // Login bem-sucedido, não redirecionamos aqui para evitar redirect duplo
      return true;
    } 
    
    // Login de parceiro - verificamos na API
    try {
      // Primeiro tentamos obter a lista de parceiros
      const response = await fetch("/api/partners");
      if (!response.ok) {
        console.error("Erro ao obter parceiros da API");
        return false;
      }
      
      const partners = await response.json();
      // Verificamos se existe um parceiro com as credenciais fornecidas
      const partner = partners.find((p: any) => 
        p.username === username && p.password === password
      );
      
      if (partner) {
        const authData = { role: "partner", partnerId: partner.id.toString() };
        localStorage.setItem("auth", JSON.stringify(authData));
        setIsAuthenticated(true);
        setUserRole("partner");
        setPartnerId(partner.id.toString());
        // Login bem-sucedido, não redirecionamos aqui para evitar redirect duplo
        return true;
      }
    } catch (error) {
      console.error("Erro na autenticação do parceiro:", error);
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