import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Verificar credenciais hardcoded conforme solicitado
    if (username === "estruturasdv" && password === "Opala1979") {
      toast({
        title: "Login realizado com sucesso",
        description: "Redirecionando para o painel de administração...",
        variant: "default",
      });
      navigate("/admin");  // Redireciona para a rota /admin (que atualmente vai para NotFound)
    } else {
      setError("Usuário ou senha inválidos");
      toast({
        title: "Erro de autenticação",
        description: "Usuário ou senha inválidos. Tente novamente.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-5xl">
        {/* Formulário de login */}
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center mb-2">
                <div className="bg-primary rounded-md text-white h-8 w-8 flex items-center justify-center mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 6.37v11.26a.9.9 0 0 1-1.33.83l-1.47-.87a1.17 1.17 0 0 0-1.21.04l-3.11 2.14a1.17 1.17 0 0 1-1.21.04L7.6 17.9a1.17 1.17 0 0 0-1.21.04l-2.72 1.87A.9.9 0 0 1 2 19V5.5a.9.9 0 0 1 .33-.7l2.72-1.87a1.17 1.17 0 0 1 1.21-.04l3.07 1.91a1.17 1.17 0 0 0 1.21-.04l3.11-2.14a1.17 1.17 0 0 1 1.21-.04l1.47.87a.9.9 0 0 1 .67.92z" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-xl">Login de Administrador</CardTitle>
                  <CardDescription>Acesse o painel de gestão de comissões</CardDescription>
                </div>
              </div>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Usuário</Label>
                  <Input 
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Digite seu usuário"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input 
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    required
                  />
                </div>
                {error && (
                  <div className="text-sm text-red-500 mt-2">
                    {error}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full">
                  Entrar
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
        
        {/* Seção informativa */}
        <div className="hidden lg:flex flex-col justify-center p-6">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Sistema de Gestão de Comissões
          </h1>
          <p className="text-gray-500 mb-6">
            Gerencie de forma eficiente as comissões de vendas da sua equipe, com análises detalhadas e acompanhamento em tempo real.
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-primary bg-opacity-10 p-2 rounded-md mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Gestão de Pagamentos</h3>
                <p className="text-sm text-gray-500">Controle e acompanhe todos os pagamentos de comissões realizados.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-primary bg-opacity-10 p-2 rounded-md mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Análise de Desempenho</h3>
                <p className="text-sm text-gray-500">Visualize gráficos e indicadores de desempenho das comissões.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-primary bg-opacity-10 p-2 rounded-md mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Acesso Fácil</h3>
                <p className="text-sm text-gray-500">Interface intuitiva e responsiva para uso em qualquer dispositivo.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}