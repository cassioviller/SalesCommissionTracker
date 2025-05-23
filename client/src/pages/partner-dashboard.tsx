import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatPercentage } from "@/lib/utils/format";
import type { ProposalWithCalculations } from "@shared/schema";
import { useAuth } from "../context/AuthContext";
import NavigationHeader from "@/components/navigation-header";

export default function PartnerDashboard() {
  const auth = useAuth();
  const [proposals, setProposals] = useState<ProposalWithCalculations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Fetch partner data to get assigned proposals
  const { data: partner, isLoading: isLoadingPartner } = useQuery({
    queryKey: ['/api/partners', auth.partnerId],
    queryFn: async () => {
      if (!auth.partnerId) return null;
      const response = await fetch(`/api/partners/${auth.partnerId}`);
      if (!response.ok) throw new Error('Falha ao carregar dados do parceiro');
      return await response.json();
    },
    enabled: !!auth.partnerId,
    // Refetch sempre que houver qualquer alteração nas propostas
    refetchOnWindowFocus: true,
    refetchInterval: 30000 // Refetch a cada 30 segundos para manter dados atualizados
  });
  
  // Fetch all proposals
  const { data: allProposals, isLoading: isLoadingProposals } = useQuery<ProposalWithCalculations[]>({
    queryKey: ['/api/proposals'],
    // Refetch para manter atualizado
    refetchOnWindowFocus: true,
    refetchInterval: 30000 // Refetch a cada 30 segundos
  });
  
  // Filter proposals based on partner data
  useEffect(() => {
    if (partner && allProposals && !isLoadingPartner && !isLoadingProposals) {
      const partnerId = auth.partnerId;
      
      if (partner.proposalIds && partner.proposalIds.length > 0) {
        // Filter proposals that are assigned to this partner
        const filteredProposals = allProposals.filter(proposal => 
          partner.proposalIds.includes(proposal.id)
        );
        
        setProposals(filteredProposals);
      } else {
        // If no proposals are assigned, show empty list
        setProposals([]);
      }
      
      setLoading(false);
    }
  }, [allProposals, isLoadingProposals, partner, isLoadingPartner, auth.partnerId]);
  
  const handleLogout = () => {
    auth.logout();
    window.location.href = "/";
  };
  
  // Calcular totais para o resumo
  const totalValor = proposals.reduce((sum, proposal) => sum + Number(proposal.valorTotal), 0);
  const totalPago = proposals.reduce((sum, proposal) => sum + Number(proposal.valorPago), 0);
  const totalComissao = proposals.reduce((sum, proposal) => sum + Number(proposal.valorComissaoTotal), 0);
  const totalComissaoPaga = proposals.reduce((sum, proposal) => sum + Number(proposal.valorComissaoPaga), 0);
  const totalComissaoEmAberto = proposals.reduce((sum, proposal) => sum + Number(proposal.valorComissaoEmAberto), 0);
  const percentComissaoPaga = totalComissao > 0 ? (totalComissaoPaga / totalComissao) * 100 : 0;
  
  // Verificamos todos os estados de carregamento
  const isLoading = loading || isLoadingPartner || isLoadingProposals;
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-neutral-600">Carregando dados da proposta...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Suas Comissões
          </h2>
          <p className="text-gray-500">
            Consulte abaixo os detalhes de suas comissões e valores em aberto.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Valor Total das Propostas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalValor)}</div>
              <div className="text-xs text-gray-500 mt-1">
                {proposals.length} proposta(s) ativa(s)
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Comissão Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalComissao)}</div>
              <div className="text-xs text-gray-500 mt-1">
                Valor total de comissões
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Comissão Paga
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalComissaoPaga)}</div>
              <div className="text-xs text-gray-500 mt-1">
                {formatPercentage(percentComissaoPaga)} do total
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Comissão em Aberto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(totalComissaoEmAberto)}</div>
              <div className="text-xs text-gray-500 mt-1">
                Valor para receber
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Status do Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="relative w-48 h-48 mb-6">
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
                    ? `Falta receber ${formatCurrency(totalComissaoEmAberto)} de comissão`
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
        
        {/* Informações sobre propostas e comissões */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-700">Resumo das Propostas</h3>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="space-y-4">
              {proposals.length > 0 ? (
                proposals.map((proposal) => (
                  <div key={proposal.id} className="border-b pb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">{proposal.proposta}</h4>
                      <span className="text-sm bg-blue-100 text-blue-800 py-1 px-2 rounded-full">
                        {formatPercentage(Number(proposal.percentComissao))}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Valor da Proposta</p>
                        <p className="font-medium">{formatCurrency(Number(proposal.valorTotal))}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Comissão Total</p>
                        <p className="font-medium">{formatCurrency(Number(proposal.valorComissaoTotal))}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Comissão Paga</p>
                        <p className="font-medium">{formatCurrency(Number(proposal.valorComissaoPaga))}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Comissão em Aberto</p>
                        <p className="font-medium text-primary">{formatCurrency(Number(proposal.valorComissaoEmAberto))}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  Nenhuma proposta encontrada.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-white border-t mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-center text-gray-500">
            Estruturas do Vale
          </p>
        </div>
      </footer>
    </div>
  );
}