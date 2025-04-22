import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatPercentage } from "@/lib/utils/format";
import type { ProposalWithCalculations } from "@shared/schema";
import { useAuth } from "../App";

export default function PartnerDashboard() {
  const auth = useAuth();
  const [proposals, setProposals] = useState<ProposalWithCalculations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Fetch proposals from API
  const { data: allProposals, isLoading } = useQuery<ProposalWithCalculations[]>({
    queryKey: ['/api/proposals'],
  });
  
  // Use effect para filtrar apenas as propostas do parceiro
  // (em um sistema real, isso seria feito no backend com uma rota específica)
  useEffect(() => {
    if (allProposals && !isLoading) {
      // Neste exemplo simplificado, estamos apenas filtrando uma proposta
      // com base no ID do parceiro. Em um sistema real, haveria uma tabela
      // de associação no banco de dados.
      const partnerId = auth.partnerId;
      
      // Simulando uma lógica de filtro. Em um sistema real, isso seria
      // determinado pelo relacionamento no banco de dados.
      const filteredProposals = allProposals.filter(proposal => 
        // Exemplo simples: a proposta contém parte do ID do parceiro
        partnerId && proposal.proposta.toLowerCase().includes(partnerId.toLowerCase().substring(0, 5))
      );
      
      if (filteredProposals.length === 0) {
        // Se não encontrarmos propostas, pegar a primeira como exemplo
        // (isto é apenas para demonstração, em um sistema real seria diferente)
        setProposals(allProposals.slice(0, 1));
      } else {
        setProposals(filteredProposals);
      }
      
      setLoading(false);
    }
  }, [allProposals, isLoading, auth.partnerId]);
  
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
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes das Propostas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium">Proposta</th>
                        <th className="text-right py-3 px-2 font-medium">Valor Total</th>
                        <th className="text-right py-3 px-2 font-medium">Valor Pago</th>
                        <th className="text-right py-3 px-2 font-medium">Saldo Aberto</th>
                        <th className="text-right py-3 px-2 font-medium">% Comissão</th>
                        <th className="text-right py-3 px-2 font-medium">Comissão Total</th>
                        <th className="text-right py-3 px-2 font-medium">Comissão Paga</th>
                        <th className="text-right py-3 px-2 font-medium">Comissão em Aberto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proposals.map((proposal) => (
                        <tr key={proposal.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-2">{proposal.proposta}</td>
                          <td className="py-3 px-2 text-right">{formatCurrency(Number(proposal.valorTotal))}</td>
                          <td className="py-3 px-2 text-right">{formatCurrency(Number(proposal.valorPago))}</td>
                          <td className="py-3 px-2 text-right">{formatCurrency(Number(proposal.saldoAberto))}</td>
                          <td className="py-3 px-2 text-right">{formatPercentage(Number(proposal.percentComissao))}</td>
                          <td className="py-3 px-2 text-right">{formatCurrency(Number(proposal.valorComissaoTotal))}</td>
                          <td className="py-3 px-2 text-right">{formatCurrency(Number(proposal.valorComissaoPaga))}</td>
                          <td className="py-3 px-2 text-right font-medium text-primary">
                            {formatCurrency(Number(proposal.valorComissaoEmAberto))}
                          </td>
                        </tr>
                      ))}
                      
                      {proposals.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-4 text-center text-gray-500">
                            Nenhuma proposta encontrada.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
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
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Histórico de Pagamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {proposals.map((proposal) => (
                    <div key={`history-${proposal.id}`} className="border-b pb-4">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{proposal.proposta}</span>
                        <span>{formatCurrency(Number(proposal.valorComissaoPaga))}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Último pagamento em {new Date().toLocaleDateString('pt-BR')}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, Number(proposal.percentComissaoPaga))}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  
                  {proposals.length === 0 && (
                    <div className="py-4 text-center text-gray-500">
                      Nenhum histórico de pagamento disponível.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
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