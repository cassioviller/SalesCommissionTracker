import { useState, useEffect } from "react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatIntegerPercentage, parseCurrencyToNumber } from "@/lib/utils/format";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SalesProposal, ProposalWithCalculations } from "@shared/schema";

interface CommissionTableProps {
  proposals: ProposalWithCalculations[];
  isLoading: boolean;
}

export default function CommissionTable({ proposals, isLoading }: CommissionTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localProposals, setLocalProposals] = useState<ProposalWithCalculations[]>([]);
  
  useEffect(() => {
    setLocalProposals(proposals);
  }, [proposals]);
  
  // Calculate totals for the footer
  const totalValor = localProposals.reduce((sum, proposal) => sum + Number(proposal.valorTotal), 0);
  const totalPago = localProposals.reduce((sum, proposal) => sum + Number(proposal.valorPago), 0);
  const totalAberto = localProposals.reduce((sum, proposal) => sum + Number(proposal.saldoAberto), 0);
  const totalComissao = localProposals.reduce((sum, proposal) => sum + Number(proposal.valorComissaoTotal), 0);
  const totalComissaoPaga = localProposals.reduce((sum, proposal) => sum + Number(proposal.valorComissaoPaga), 0);
  const totalComissaoEmAberto = localProposals.reduce((sum, proposal) => sum + Number(proposal.valorComissaoEmAberto), 0);
  const percentComissaoPaga = totalComissao > 0 ? (totalComissaoPaga / totalComissao) * 100 : 0;
  
  // Update field mutation
  const updateProposalMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: number, field: string, value: number }) => {
      const response = await apiRequest("PATCH", `/api/proposals/${id}`, { [field]: value });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proposals'] });
      toast({
        title: "Proposta atualizada",
        description: "O valor foi atualizado com sucesso.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível atualizar o valor: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Delete proposal mutation
  const deleteProposalMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/proposals/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proposals'] });
      toast({
        title: "Proposta removida",
        description: "A proposta foi removida com sucesso.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível remover a proposta: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle field value change
  const handleFieldChange = (id: number, field: string, value: string) => {
    const numValue = parseFloat(value);
    
    if (!isNaN(numValue) && numValue >= 0) {
      // Update locally first for immediate feedback
      setLocalProposals(prev => 
        prev.map(proposal => {
          if (proposal.id === id) {
            const updatedProposal = { ...proposal, [field]: numValue };
            
            // Recalculate derived fields
            if (field === 'valorTotal' || field === 'valorPago') {
              updatedProposal.saldoAberto = Number(updatedProposal.valorTotal) - Number(updatedProposal.valorPago);
            }
            
            if (field === 'valorTotal' || field === 'percentComissao') {
              updatedProposal.valorComissaoTotal = Number(updatedProposal.valorTotal) * (Number(updatedProposal.percentComissao) / 100);
            }
            
            if (field === 'valorTotal' || field === 'percentComissao' || field === 'valorComissaoPaga') {
              const valorComissaoTotal = Number(updatedProposal.valorTotal) * (Number(updatedProposal.percentComissao) / 100);
              updatedProposal.valorComissaoEmAberto = valorComissaoTotal - Number(updatedProposal.valorComissaoPaga);
              updatedProposal.percentComissaoPaga = valorComissaoTotal > 0 
                ? (Number(updatedProposal.valorComissaoPaga) / valorComissaoTotal) * 100
                : 0;
            }
            
            return updatedProposal;
          }
          return proposal;
        })
      );
      
      // Then update on the server
      updateProposalMutation.mutate({ id, field, value: numValue });
    }
  };
  
  // Handle delete proposal
  const handleDelete = (id: number) => {
    if (window.confirm("Tem certeza que deseja remover esta proposta?")) {
      deleteProposalMutation.mutate(id);
    }
  };
  
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-2 text-neutral-600">Carregando dados...</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto" style={{ minHeight: "200px", maxHeight: "60vh" }}>
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b">
              <th className="py-3 px-4 text-left text-sm uppercase font-medium text-gray-600">Proposta</th>
              <th className="py-3 px-4 text-left text-sm uppercase font-medium text-gray-600">Valor Total</th>
              <th className="py-3 px-4 text-left text-sm uppercase font-medium text-gray-600">Valor Pago</th>
              <th className="py-3 px-4 text-left text-sm uppercase font-medium text-gray-600">Saldo Aberto</th>
              <th className="py-3 px-3 text-center text-sm uppercase font-medium text-gray-600">% Comissão</th>
              <th className="py-3 px-4 text-left text-sm uppercase font-medium text-gray-600">Valor Comissão Total</th>
              <th className="py-3 px-4 text-left text-sm uppercase font-medium text-gray-600">Valor Comissão Paga</th>
              <th className="py-3 px-4 text-left text-sm uppercase font-medium text-gray-600">Comissão em Aberto</th>
              <th className="py-3 px-3 text-center text-sm uppercase font-medium text-gray-600">% Paga</th>
              <th className="py-3 px-2 text-center text-sm uppercase font-medium text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody>
            {localProposals.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-6 text-sm text-neutral-500">
                  Nenhuma proposta encontrada
                </td>
              </tr>
            ) : (
              localProposals.map((proposal) => (
                <tr key={proposal.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-sm">{proposal.proposta}</td>
                  <td className="py-3 px-4">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={proposal.valorTotal}
                      onChange={(e) => handleFieldChange(proposal.id, 'valorTotal', e.target.value)}
                      className="w-[110px] py-1 px-2 border border-neutral-300 rounded-md bg-neutral-50 text-right focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={proposal.valorPago}
                      onChange={(e) => handleFieldChange(proposal.id, 'valorPago', e.target.value)}
                      className="w-[110px] py-1 px-2 border border-neutral-300 rounded-md bg-neutral-50 text-right focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </td>
                  <td className="py-3 px-4 text-sm">{formatCurrency(Number(proposal.saldoAberto))}</td>
                  <td className="py-3 px-3 text-center">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={proposal.percentComissao}
                      onChange={(e) => handleFieldChange(proposal.id, 'percentComissao', e.target.value)}
                      className="w-[60px] py-1 px-2 border border-neutral-300 rounded-md bg-neutral-50 text-center focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </td>
                  <td className="py-3 px-4 text-sm">{formatCurrency(Number(proposal.valorComissaoTotal))}</td>
                  <td className="py-3 px-4">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={proposal.valorComissaoPaga}
                      onChange={(e) => handleFieldChange(proposal.id, 'valorComissaoPaga', e.target.value)}
                      className="w-[110px] py-1 px-2 border border-neutral-300 rounded-md bg-neutral-50 text-right focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </td>
                  <td className="py-3 px-4 text-sm">{formatCurrency(Number(proposal.valorComissaoEmAberto))}</td>
                  <td className="py-3 px-3 text-center text-sm">{formatIntegerPercentage(Number(proposal.percentComissaoPaga))}</td>
                  <td className="py-3 px-2 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="18" 
                            height="18" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                            className="text-neutral-500"
                          >
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="12" cy="5" r="1" />
                            <circle cx="12" cy="19" r="1" />
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="text-neutral-700 cursor-pointer"
                          onClick={() => handleDelete(proposal.id)}
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
                            className="mr-2 text-red-500"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                          <span>Excluir</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="sticky bottom-0 bg-gray-50 font-semibold">
            <tr className="border-t">
              <td className="py-3 px-4 text-sm">Total</td>
              <td className="py-3 px-4 text-sm">{formatCurrency(totalValor)}</td>
              <td className="py-3 px-4 text-sm">{formatCurrency(totalPago)}</td>
              <td className="py-3 px-4 text-sm">{formatCurrency(totalAberto)}</td>
              <td className="py-3 px-3 text-sm text-center">-</td>
              <td className="py-3 px-4 text-sm">{formatCurrency(totalComissao)}</td>
              <td className="py-3 px-4 text-sm">{formatCurrency(totalComissaoPaga)}</td>
              <td className="py-3 px-4 text-sm">{formatCurrency(totalComissaoEmAberto)}</td>
              <td className="py-3 px-3 text-sm text-center">{formatIntegerPercentage(percentComissaoPaga)}</td>
              <td className="py-3 px-2 text-sm text-center">-</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}