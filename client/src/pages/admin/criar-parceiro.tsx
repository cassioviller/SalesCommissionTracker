import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../../App";
import type { SalesProposal, ProposalWithCalculations } from "@shared/schema";

export default function CriarParceiro() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedProposals, setSelectedProposals] = useState<number[]>([]);
  const [partnerId, setPartnerId] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const auth = useAuth();
  
  // Fetch proposals from API
  const { data: proposals, isLoading } = useQuery<SalesProposal[]>({
    queryKey: ['/api/proposals'],
  });

  // Calculate derived fields for each proposal
  const proposalsWithCalculations: ProposalWithCalculations[] = (proposals || []).map(proposal => {
    const saldoAberto = Number(proposal.valorTotal) - Number(proposal.valorPago);
    const valorComissaoTotal = Number(proposal.valorTotal) * (Number(proposal.percentComissao) / 100);
    const valorComissaoEmAberto = valorComissaoTotal - Number(proposal.valorComissaoPaga);
    const percentComissaoPaga = valorComissaoTotal > 0 
      ? (Number(proposal.valorComissaoPaga) / valorComissaoTotal) * 100
      : 0;
    
    return {
      ...proposal,
      saldoAberto,
      valorComissaoTotal,
      valorComissaoEmAberto,
      percentComissaoPaga
    };
  });

  const handleLogout = () => {
    auth.logout();
    window.location.href = "/";
  };
  
  const handleProposalToggle = (proposalId: number) => {
    setSelectedProposals(current => 
      current.includes(proposalId)
        ? current.filter(id => id !== proposalId)
        : [...current, proposalId]
    );
  };
  
  // Em um sistema real, isso enviaria dados para o backend
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !username || !password || selectedProposals.length === 0) {
      toast({
        title: "Erro no formulário",
        description: "Preencha todos os campos e selecione pelo menos uma proposta.",
        variant: "destructive",
      });
      return;
    }
    
    // Gerar um ID de parceiro simples (em um sistema real, seria feito pelo backend)
    const generatedPartnerId = `PARTNER-${Math.floor(Math.random() * 10000)}`;
    setPartnerId(generatedPartnerId);
    
    toast({
      title: "Parceiro criado com sucesso",
      description: "As credenciais foram geradas com sucesso.",
      variant: "default",
    });
  };
  
  return (
    <div className="h-screen overflow-hidden bg-neutral-100">
      {/* Header/Navbar */}
      <header className="bg-white shadow-sm py-3 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-primary rounded-md text-white h-8 w-8 flex items-center justify-center mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 6.37v11.26a.9.9 0 0 1-1.33.83l-1.47-.87a1.17 1.17 0 0 0-1.21.04l-3.11 2.14a1.17 1.17 0 0 1-1.21.04L7.6 17.9a1.17 1.17 0 0 0-1.21.04l-2.72 1.87A.9.9 0 0 1 2 19V5.5a.9.9 0 0 1 .33-.7l2.72-1.87a1.17 1.17 0 0 1 1.21-.04l3.07 1.91a1.17 1.17 0 0 0 1.21-.04l3.11-2.14a1.17 1.17 0 0 1 1.21-.04l1.47.87a.9.9 0 0 1 .67.92z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-primary text-md">Sistema de Comissões</h1>
              <p className="text-xs text-neutral-500">Admin Dashboard</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/admin")}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="mr-2"
              >
                <rect x="3" y="3" width="7" height="9" />
                <rect x="14" y="3" width="7" height="5" />
                <rect x="14" y="12" width="7" height="9" />
                <rect x="3" y="16" width="7" height="5" />
              </svg>
              Dashboard
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="h-full overflow-auto bg-neutral-100 pt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h1 className="text-2xl font-semibold text-neutral-800">Criar Novo Parceiro</h1>
            <p className="text-neutral-500 text-sm mb-4">Crie um parceiro e associe propostas para controle de comissões</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Formulário de registro */}
              <div>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Parceiro</Label>
                      <Input 
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nome completo"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@exemplo.com"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Nome de Usuário</Label>
                        <Input 
                          id="username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="usuário_parceiro"
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
                          placeholder="********"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <Label className="mb-2 block">Selecione as propostas associadas:</Label>
                      <div className="border rounded-md p-3 h-64 overflow-y-auto">
                        {isLoading ? (
                          <div className="flex justify-center items-center h-full">
                            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {proposalsWithCalculations.map((proposal) => (
                              <div key={proposal.id} className="flex items-start space-x-2 p-2 hover:bg-gray-50 rounded">
                                <Checkbox 
                                  id={`proposal-${proposal.id}`}
                                  checked={selectedProposals.includes(proposal.id)}
                                  onCheckedChange={() => handleProposalToggle(proposal.id)}
                                />
                                <div className="grid grid-cols-2 gap-1 flex-1">
                                  <Label 
                                    htmlFor={`proposal-${proposal.id}`}
                                    className="font-medium cursor-pointer"
                                  >
                                    {proposal.proposta}
                                  </Label>
                                  <span className="text-sm text-gray-500">
                                    Valor Total: R$ {Number(proposal.valorTotal).toLocaleString('pt-BR')}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    Comissão: {Number(proposal.percentComissao)}%
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    Em Aberto: R$ {proposal.valorComissaoEmAberto.toLocaleString('pt-BR')}
                                  </span>
                                </div>
                              </div>
                            ))}
                            
                            {proposalsWithCalculations.length === 0 && (
                              <div className="text-center py-4 text-gray-500">
                                Nenhuma proposta encontrada.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <Button type="submit" className="w-full">
                        Criar Parceiro
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
              
              {/* Resultado */}
              <div className="flex items-center justify-center">
                {partnerId ? (
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle>Parceiro Criado com Sucesso!</CardTitle>
                      <CardDescription>
                        Use as informações abaixo para compartilhar com o parceiro
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-md p-4">
                        <h3 className="font-semibold text-green-700 mb-2">Credenciais de Acesso</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-gray-500">Nome do Parceiro:</div>
                          <div className="font-medium">{name}</div>
                          
                          <div className="text-gray-500">Email:</div>
                          <div className="font-medium">{email}</div>
                          
                          <div className="text-gray-500">Nome de Usuário:</div>
                          <div className="font-medium">{username}</div>
                          
                          <div className="text-gray-500">Senha:</div>
                          <div className="font-medium">*********</div>
                          
                          <div className="text-gray-500">ID do Parceiro:</div>
                          <div className="font-medium">{partnerId}</div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold mb-2">Propostas Associadas</h3>
                        <div className="border rounded-md overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="py-2 px-3 text-left">Proposta</th>
                                <th className="py-2 px-3 text-right">Comissão Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {proposalsWithCalculations
                                .filter(p => selectedProposals.includes(p.id))
                                .map(proposal => (
                                  <tr key={`selected-${proposal.id}`}>
                                    <td className="py-2 px-3">{proposal.proposta}</td>
                                    <td className="py-2 px-3 text-right">
                                      R$ {proposal.valorComissaoTotal.toLocaleString('pt-BR')}
                                    </td>
                                  </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setName("");
                          setEmail("");
                          setUsername("");
                          setPassword("");
                          setSelectedProposals([]);
                          setPartnerId("");
                        }}
                      >
                        Criar Novo
                      </Button>
                      <Button onClick={() => navigate("/admin")}>
                        Voltar ao Dashboard
                      </Button>
                    </CardFooter>
                  </Card>
                ) : (
                  <div className="text-center max-w-md">
                    <div className="bg-primary bg-opacity-10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Criação de Parceiro</h2>
                    <p className="text-gray-500 mb-4">
                      Preencha o formulário ao lado para criar um novo parceiro. Você poderá associar propostas específicas a este parceiro.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="rounded-full bg-green-100 p-1 mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <span className="text-sm">Acesso personalizado por parceiro</span>
                      </div>
                      <div className="flex items-center">
                        <div className="rounded-full bg-green-100 p-1 mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <span className="text-sm">Visualização restrita a propostas específicas</span>
                      </div>
                      <div className="flex items-center">
                        <div className="rounded-full bg-green-100 p-1 mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <span className="text-sm">Acompanhamento em tempo real de comissões</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}