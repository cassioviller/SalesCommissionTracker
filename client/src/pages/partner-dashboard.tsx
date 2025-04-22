import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatPercentage } from "@/lib/utils/format";
import { ProposalWithCalculations } from "@shared/schema";

export default function PartnerDashboard() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [proposal, setProposal] = useState<ProposalWithCalculations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Extrair o parâmetro "proposta" da URL
  const params = new URLSearchParams(window.location.search);
  const propostaParam = params.get("proposta");
  
  useEffect(() => {
    const fetchProposal = async () => {
      if (!propostaParam) {
        setError("Número de proposta não fornecido");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await apiRequest("GET", "/api/proposals");
        const proposals: ProposalWithCalculations[] = await response.json();
        
        // Encontrar a proposta correspondente
        const matchedProposal = proposals.find(p => 
          p.proposta.toLowerCase().includes(propostaParam.toLowerCase())
        );
        
        if (matchedProposal) {
          setProposal(matchedProposal);
        } else {
          setError("Proposta não encontrada");
          toast({
            title: "Proposta não encontrada",
            description: "Não foi possível encontrar dados para esta proposta.",
            variant: "destructive",
          });
        }
      } catch (err) {
        setError("Erro ao buscar dados da proposta");
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados da proposta.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProposal();
  }, [propostaParam, toast]);
  
  const handleLogout = () => {
    window.location.href = "/partner-login";
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-neutral-600">Carregando dados da proposta...</p>
        </div>
      </div>
    );
  }
  
  if (error || !proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl text-center">Erro</CardTitle>
            <CardDescription className="text-center">
              {error || "Não foi possível carregar os dados da proposta"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 mb-4">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <p className="text-center mb-4">
              Verifique o número da proposta e tente novamente.
            </p>
            <Button onClick={() => window.location.href = "/partner-login"} className="w-full">
              Voltar ao Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Calcular o valor de comissão em aberto
  const valorComissaoEmAberto = proposal.valorComissaoTotal - Number(proposal.valorComissaoPaga);
  const percentComissaoPaga = proposal.valorComissaoTotal > 0 
    ? (Number(proposal.valorComissaoPaga) / proposal.valorComissaoTotal) * 100 
    : 0;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-primary rounded-md text-white h-8 w-8 flex items-center justify-center mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 6.37v11.26a.9.9 0 0 1-1.33.83l-1.47-.87a1.17 1.17 0 0 0-1.21.04l-3.11 2.14a1.17 1.17 0 0 1-1.21.04L7.6 17.9a1.17 1.17 0 0 0-1.21.04l-2.72 1.87A.9.9 0 0 1 2 19V5.5a.9.9 0 0 1 .33-.7l2.72-1.87a1.17 1.17 0 0 1 1.21-.04l3.07 1.91a1.17 1.17 0 0 0 1.21-.04l3.11-2.14a1.17 1.17 0 0 1 1.21-.04l1.47.87a.9.9 0 0 1 .67.92z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Portal de Comissões</h1>
              <p className="text-xs text-gray-500">Dashboard do Parceiro</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout}>Sair</Button>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Detalhes da Proposta: {proposal.proposta}
          </h2>
          <p className="text-gray-500">
            Consulte abaixo os detalhes de sua comissão e valores em aberto.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Valor Total da Proposta
              </CardTitle>
              <CardDescription className="text-2xl font-bold text-gray-900">
                {formatCurrency(Number(proposal.valorTotal))}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-500">
                Valor total contratado pelo cliente
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Comissão Total
              </CardTitle>
              <CardDescription className="text-2xl font-bold text-gray-900">
                {formatCurrency(proposal.valorComissaoTotal)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-500">
                {formatPercentage(Number(proposal.percentComissao))} do valor total
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Comissão em Aberto
              </CardTitle>
              <CardDescription className="text-2xl font-bold text-primary">
                {formatCurrency(valorComissaoEmAberto)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-500">
                Valor que ainda será recebido
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Pagamento</CardTitle>
              <CardDescription>
                Informações sobre os valores pagos e a receber
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-gray-500">Valor Pago ao Cliente:</span>
                  <span className="font-medium">{formatCurrency(Number(proposal.valorPago))}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-gray-500">Saldo Aberto do Cliente:</span>
                  <span className="font-medium">{formatCurrency(Number(proposal.saldoAberto))}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-gray-500">Percentual de Comissão:</span>
                  <span className="font-medium">{formatPercentage(Number(proposal.percentComissao))}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-gray-500">Comissão Total:</span>
                  <span className="font-medium">{formatCurrency(proposal.valorComissaoTotal)}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-gray-500">Comissão Já Paga:</span>
                  <span className="font-medium">{formatCurrency(Number(proposal.valorComissaoPaga))}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-gray-500">Comissão em Aberto:</span>
                  <span className="font-medium text-primary">{formatCurrency(valorComissaoEmAberto)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Percentual de Comissão Pago:</span>
                  <span className="font-medium">{formatPercentage(percentComissaoPaga)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Status do Pagamento</CardTitle>
              <CardDescription>
                Visualize o progresso do pagamento da sua comissão
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="relative w-48 h-48 mb-4">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Círculo de fundo */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                  />
                  {/* Círculo de progresso */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${percentComissaoPaga * 2.51} 251.2`}
                    strokeDashoffset="0"
                    className="text-primary"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{Math.round(percentComissaoPaga)}%</span>
                  <span className="text-sm text-gray-500">Recebido</span>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">
                  {percentComissaoPaga < 100 
                    ? `Falta receber ${formatCurrency(valorComissaoEmAberto)} de comissão`
                    : "Comissão totalmente recebida!"}
                </p>
                <div className="text-xs text-gray-400">
                  {percentComissaoPaga < 100 
                    ? "Os pagamentos são realizados conforme cronograma financeiro"
                    : "Todos os pagamentos foram concluídos"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <footer className="bg-white border-t mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-center text-gray-500">
            © {new Date().getFullYear()} Sistema de Gerenciamento de Comissões. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}