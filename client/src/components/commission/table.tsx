import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  TableFooter
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
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
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow className="bg-neutral-50">
              <TableHead className="font-medium text-xs text-neutral-600 uppercase w-[12%]">Proposta</TableHead>
              <TableHead className="font-medium text-xs text-neutral-600 uppercase w-[10%] text-right">Valor Total</TableHead>
              <TableHead className="font-medium text-xs text-neutral-600 uppercase w-[10%] text-right">Valor Pago</TableHead>
              <TableHead className="font-medium text-xs text-neutral-600 uppercase w-[10%] text-right">Saldo Aberto</TableHead>
              <TableHead className="font-medium text-xs text-neutral-600 uppercase w-[8%] text-right">% Comissão</TableHead>
              <TableHead className="font-medium text-xs text-neutral-600 uppercase w-[12%] text-right">Comissão Total</TableHead>
              <TableHead className="font-medium text-xs text-neutral-600 uppercase w-[12%] text-right">Comissão Paga</TableHead>
              <TableHead className="font-medium text-xs text-neutral-600 uppercase w-[12%] text-right">Comis. em Aberto</TableHead>
              <TableHead className="font-medium text-xs text-neutral-600 uppercase w-[8%] text-right">% Comis. Paga</TableHead>
              <TableHead className="font-medium text-xs text-neutral-600 uppercase w-[6%] text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localProposals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-6 text-sm text-neutral-500">
                  Nenhuma proposta encontrada
                </TableCell>
              </TableRow>
            ) : (
              localProposals.map((proposal) => (
                <TableRow key={proposal.id}>
                  <TableCell className="font-medium text-sm">{proposal.proposta}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={proposal.valorTotal}
                      onChange={(e) => handleFieldChange(proposal.id, 'valorTotal', e.target.value)}
                      className="w-full py-1 px-2 border border-neutral-300 rounded-md bg-neutral-50 text-right focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={proposal.valorPago}
                      onChange={(e) => handleFieldChange(proposal.id, 'valorPago', e.target.value)}
                      className="w-full py-1 px-2 border border-neutral-300 rounded-md bg-neutral-50 text-right focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </TableCell>
                  <TableCell className="text-sm text-right">{formatCurrency(Number(proposal.saldoAberto))}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={proposal.percentComissao}
                      onChange={(e) => handleFieldChange(proposal.id, 'percentComissao', e.target.value)}
                      className="w-full py-1 px-2 border border-neutral-300 rounded-md bg-neutral-50 text-right focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </TableCell>
                  <TableCell className="text-sm text-right">{formatCurrency(Number(proposal.valorComissaoTotal))}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={proposal.valorComissaoPaga}
                      onChange={(e) => handleFieldChange(proposal.id, 'valorComissaoPaga', e.target.value)}
                      className="w-full py-1 px-2 border border-neutral-300 rounded-md bg-neutral-50 text-right focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </TableCell>
                  <TableCell className="text-sm text-right">{formatCurrency(Number(proposal.valorComissaoEmAberto))}</TableCell>
                  <TableCell className="text-sm text-right">{formatIntegerPercentage(Number(proposal.percentComissaoPaga))}</TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter className="bg-neutral-50">
            <TableRow>
              <TableCell className="font-semibold text-sm">Total</TableCell>
              <TableCell className="font-semibold text-sm text-right">{formatCurrency(totalValor)}</TableCell>
              <TableCell className="font-semibold text-sm text-right">{formatCurrency(totalPago)}</TableCell>
              <TableCell className="font-semibold text-sm text-right">{formatCurrency(totalAberto)}</TableCell>
              <TableCell className="font-semibold text-sm text-center">-</TableCell>
              <TableCell className="font-semibold text-sm text-right">{formatCurrency(totalComissao)}</TableCell>
              <TableCell className="font-semibold text-sm text-right">{formatCurrency(totalComissaoPaga)}</TableCell>
              <TableCell className="font-semibold text-sm text-right">{formatCurrency(totalComissaoEmAberto)}</TableCell>
              <TableCell className="font-semibold text-sm text-right">{formatIntegerPercentage(percentComissaoPaga)}</TableCell>
              <TableCell className="font-semibold text-sm text-center">-</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
