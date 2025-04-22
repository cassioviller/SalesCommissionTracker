import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [partnerUsername, setPartnerUsername] = useState("");
  const [partnerPassword, setPartnerPassword] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const auth = useAuth();
  
  // Se já estiver autenticado, redirecionar para o dashboard apropriado
  useEffect(() => {
    if (auth.isAuthenticated) {
      if (auth.userRole === "admin") {
        navigate("/admin");
      } else if (auth.userRole === "partner") {
        navigate("/partner");
      }
    }
  }, [auth.isAuthenticated, auth.userRole, navigate]);
  
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminUsername || !adminPassword) {
      toast({
        title: "Erro de Login",
        description: "Preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }
    
    const success = auth.login(adminUsername, adminPassword);
    
    if (success) {
      toast({
        title: "Login bem-sucedido",
        description: "Bem-vindo ao painel de administração.",
      });
      navigate("/admin");
    } else {
      toast({
        title: "Erro de Login",
        description: "Credenciais inválidas.",
        variant: "destructive",
      });
    }
  };
  
  const handlePartnerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!partnerUsername || !partnerPassword) {
      toast({
        title: "Erro de Login",
        description: "Preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }
    
    const success = auth.login(partnerUsername, partnerPassword);
    
    if (success) {
      toast({
        title: "Login bem-sucedido",
        description: "Bem-vindo ao portal de parceiros.",
      });
      navigate("/partner");
    } else {
      toast({
        title: "Erro de Login",
        description: "Credenciais inválidas.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row">
      {/* Banner lateral */}
      <div className="hidden md:flex md:w-1/2 bg-primary p-8 text-white flex-col justify-center">
        <div className="max-w-md mx-auto">
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="bg-white rounded-md text-primary h-10 w-10 flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 6.37v11.26a.9.9 0 0 1-1.33.83l-1.47-.87a1.17 1.17 0 0 0-1.21.04l-3.11 2.14a1.17 1.17 0 0 1-1.21.04L7.6 17.9a1.17 1.17 0 0 0-1.21.04l-2.72 1.87A.9.9 0 0 1 2 19V5.5a.9.9 0 0 1 .33-.7l2.72-1.87a1.17 1.17 0 0 1 1.21-.04l3.07 1.91a1.17 1.17 0 0 0 1.21-.04l3.11-2.14a1.17 1.17 0 0 1 1.21-.04l1.47.87a.9.9 0 0 1 .67.92z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold">Sistema de Comissões</h1>
            </div>
            <h2 className="text-3xl font-bold mb-4">Gerencie suas comissões de forma eficiente</h2>
            <p className="text-lg opacity-90 mb-8">
              Acompanhe propostas, pagamentos e comissões em um único lugar, com uma visão completa de seus negócios.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="bg-white bg-opacity-20 rounded-full p-2 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Monitoramento em tempo real</h3>
                <p className="opacity-80">Acompanhe o status de pagamentos e comissões com atualizações automáticas.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-white bg-opacity-20 rounded-full p-2 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Dashboard intuitivo</h3>
                <p className="opacity-80">Visualize todas as suas informações em um painel personalizado.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-white bg-opacity-20 rounded-full p-2 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1v16M4 7l8 8 8-8" />
                  <path d="M4 17h16" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Exportação de relatórios</h3>
                <p className="opacity-80">Exporte seus dados em diversos formatos para análise detalhada.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Formulário de login */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Acesso ao Sistema</h2>
            <p className="text-gray-500 mt-2">Faça login para acessar sua conta</p>
          </div>
          
          <Tabs defaultValue="admin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="admin">Administrador</TabsTrigger>
              <TabsTrigger value="partner">Parceiro</TabsTrigger>
            </TabsList>
            
            <TabsContent value="admin">
              <Card>
                <form onSubmit={handleAdminLogin}>
                  <CardHeader>
                    <CardTitle>Login de Administrador</CardTitle>
                    <CardDescription>
                      Acesse o painel administrativo para gerenciar todas as propostas e parceiros.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-username">Nome de Usuário</Label>
                      <Input
                        id="admin-username"
                        type="text"
                        placeholder="Usuário admin"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-password">Senha</Label>
                      <Input
                        id="admin-password"
                        type="password"
                        placeholder="********"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full">Entrar</Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
            
            <TabsContent value="partner">
              <Card>
                <form onSubmit={handlePartnerLogin}>
                  <CardHeader>
                    <CardTitle>Login de Parceiro</CardTitle>
                    <CardDescription>
                      Acesse o portal de parceiros para visualizar suas propostas e comissões.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="partner-username">Nome de Usuário</Label>
                      <Input
                        id="partner-username"
                        type="text"
                        placeholder="Usuário parceiro"
                        value={partnerUsername}
                        onChange={(e) => setPartnerUsername(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="partner-password">Senha</Label>
                      <Input
                        id="partner-password"
                        type="password"
                        placeholder="********"
                        value={partnerPassword}
                        onChange={(e) => setPartnerPassword(e.target.value)}
                      />
                    </div>

                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full">Entrar</Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
          
          <p className="text-center text-gray-500 text-sm mt-6">
            Sistema de Gerenciamento de Comissões &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}