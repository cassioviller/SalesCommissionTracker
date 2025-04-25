import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function PartnerLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [proposta, setProposta] = useState("");
  const [error, setError] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validação simples
    if (!username || !password || !proposta) {
      setError("Todos os campos são obrigatórios");
      return;
    }
    
    // Em um cenário real, validaríamos as credenciais contra o banco de dados
    // Para fins de demonstração, aceitamos qualquer credencial válida
    navigate(`/partner-dashboard`); // Redireciona para o dashboard do parceiro
    
    toast({
      title: "Login realizado com sucesso",
      description: "Redirecionando para o dashboard de parceiro...",
      variant: "default",
    });
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
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-xl">Portal do Parceiro</CardTitle>
                  <CardDescription>Acesse informações sobre sua comissão</CardDescription>
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
                <div className="space-y-2">
                  <Label htmlFor="proposta">Número da Proposta</Label>
                  <Input 
                    id="proposta"
                    type="text"
                    value={proposta}
                    onChange={(e) => setProposta(e.target.value)}
                    placeholder="Ex: 264.24 – Orlando"
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
                  Acessar
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
        
        {/* Seção informativa */}
        <div className="hidden lg:flex flex-col justify-center p-6">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Portal de Comissões para Parceiros
          </h1>
          <p className="text-gray-500 mb-6">
            Acompanhe o status das suas comissões em tempo real, visualize pagamentos recebidos e valores em aberto.
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-primary bg-opacity-10 p-2 rounded-md mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Acompanhamento de Pagamentos</h3>
                <p className="text-sm text-gray-500">Visualize todos os pagamentos de comissões realizados.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-primary bg-opacity-10 p-2 rounded-md mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Comissões em Aberto</h3>
                <p className="text-sm text-gray-500">Consulte os valores de comissão que ainda estão para receber.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-primary bg-opacity-10 p-2 rounded-md mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Detalhes da Proposta</h3>
                <p className="text-sm text-gray-500">Acesse informações específicas da sua proposta comercial.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}