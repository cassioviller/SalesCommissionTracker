import { useState, useEffect } from "react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatIntegerPercentage, parseCurrencyToNumber } from "@/lib/utils/format";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, History } from "lucide-react";
import type { SalesProposal, ProposalWithCalculations } from "@shared/schema";
import PaymentHistoryModal from "./payment-history-modal";

interface CommissionTableProps {
  proposals: ProposalWithCalculations[];
  isLoading: boolean;
}

export default function CommissionTable({ proposals, isLoading }: CommissionTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localProposals, setLocalProposals] = useState<ProposalWithCalculations[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentProposal, setCurrentProposal] = useState<ProposalWithCalculations | null>(null);
  const [formData, setFormData] = useState({
    proposta: "",
    valorTotal: "0",
    valorPago: "0",
    percentComissao: "0",
    valorComissaoPaga: "0",
    dataPagamento: ""
  });
  const [comissaoAPagar, setComissaoAPagar] = useState("0");
  const [isPaymentHistoryModalOpen, setIsPaymentHistoryModalOpen] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(null);
  const [selectedProposalName, setSelectedProposalName] = useState("");
  
  // Estado para armazenar os dados da proposta selecionada com os pagamentos
  const { data: selectedProposalDetails } = useQuery({
    queryKey: ['/api/proposals', selectedProposalId],
    queryFn: async () => {
      if (!selectedProposalId) return null;
      const res = await apiRequest('GET', `/api/proposals/${selectedProposalId}`);
      return res.json();
    },
    enabled: !!selectedProposalId && isPaymentHistoryModalOpen,
  });
  
  useEffect(() => {
    setLocalProposals(proposals);
  }, [proposals]);
  
  // Função para abrir o modal de histórico de pagamentos
  const handleOpenPaymentHistory = (proposal: ProposalWithCalculations) => {
    setSelectedProposalId(proposal.id);
    setSelectedProposalName(proposal.proposta);
    setIsPaymentHistoryModalOpen(true);
  };
  
  // Função para abrir o diálogo de edição
  const handleEdit = (proposal: ProposalWithCalculations) => {
    setCurrentProposal(proposal);
    setFormData({
      proposta: proposal.proposta,
      valorTotal: proposal.valorTotal.toString(),
      valorPago: proposal.valorPago.toString(),
      percentComissao: proposal.percentComissao.toString(),
      valorComissaoPaga: proposal.valorComissaoPaga.toString(),
      dataPagamento: new Date().toISOString().split('T')[0]  // Data atual como padrão
    });
    setComissaoAPagar("0"); // Inicializa com zero
    setIsEditDialogOpen(true);
  };
  
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
  
  // Handle input change in the edit form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  // Handle adding a new commission payment
  const handleAddPayment = () => {
    if (!currentProposal) return;
    
    const pagamento = parseFloat(comissaoAPagar);
    if (isNaN(pagamento) || pagamento <= 0) {
      toast({
        title: "Valor inválido",
        description: "Informe um valor válido para o pagamento",
        variant: "destructive",
      });
      return;
    }
    
    const novoValorComissaoPaga = parseFloat(formData.valorComissaoPaga) + pagamento;
    setFormData((prev) => ({
      ...prev,
      valorComissaoPaga: novoValorComissaoPaga.toString()
    }));
    setComissaoAPagar("0"); // Reset
    
    toast({
      title: "Pagamento adicionado",
      description: `Pagamento de ${formatCurrency(pagamento)} adicionado.`,
      variant: "default",
    });
  };
  
  // Handle saving the edited proposal
  const handleSaveProposal = () => {
    if (!currentProposal) return;
    
    // Validar dados do formulário
    const valorTotal = parseFloat(formData.valorTotal);
    const valorPago = parseFloat(formData.valorPago);
    const percentComissao = parseFloat(formData.percentComissao);
    const valorComissaoPaga = parseFloat(formData.valorComissaoPaga);
    
    if (isNaN(valorTotal) || valorTotal < 0 ||
        isNaN(valorPago) || valorPago < 0 ||
        isNaN(percentComissao) || percentComissao < 0 || percentComissao > 100 ||
        isNaN(valorComissaoPaga) || valorComissaoPaga < 0) {
      toast({
        title: "Dados inválidos",
        description: "Verifique os valores informados",
        variant: "destructive",
      });
      return;
    }
    
    // Atualizar a proposta
    const updateData = {
      proposta: formData.proposta,
      valorTotal,
      valorPago,
      percentComissao,
      valorComissaoPaga,
    };
    
    apiRequest("PATCH", `/api/proposals/${currentProposal.id}`, updateData)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/proposals'] });
        setIsEditDialogOpen(false);
        toast({
          title: "Proposta atualizada",
          description: "As alterações foram salvas com sucesso",
          variant: "default",
        });
      })
      .catch((error) => {
        toast({
          title: "Erro ao salvar",
          description: `Não foi possível atualizar a proposta: ${error.message}`,
          variant: "destructive",
        });
      });
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
      {/* Modal de histórico de pagamentos */}
      {selectedProposalDetails && (
        <PaymentHistoryModal 
          isOpen={isPaymentHistoryModalOpen}
          onClose={() => setIsPaymentHistoryModalOpen(false)}
          propostaId={selectedProposalId}
          propostaNome={selectedProposalName}
          pagamentosProposta={selectedProposalDetails.pagamentosProposta || []}
          pagamentosComissao={selectedProposalDetails.pagamentosComissao || []}
        />
      )}
      
      {/* Dialog de edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Proposta</DialogTitle>
            <DialogDescription>
              Edite os detalhes da proposta e registre pagamentos de comissão.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="proposta">Proposta</Label>
                <Input 
                  id="proposta" 
                  name="proposta" 
                  value={formData.proposta} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="percentComissao">Percentual de Comissão (%)</Label>
                <Input 
                  id="percentComissao" 
                  name="percentComissao" 
                  type="number" 
                  min="0" 
                  max="100" 
                  step="0.1" 
                  value={formData.percentComissao} 
                  onChange={handleInputChange} 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valorTotal">Valor Total (R$)</Label>
                <Input 
                  id="valorTotal" 
                  name="valorTotal" 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  value={formData.valorTotal} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valorPago">Valor Pago (R$)</Label>
                <Input 
                  id="valorPago" 
                  name="valorPago" 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  value={formData.valorPago} 
                  onChange={handleInputChange} 
                />
              </div>
            </div>
            
            <div className="border-t pt-4 mt-2">
              <h3 className="text-lg font-medium mb-4">Pagamentos de Comissão</h3>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="valorComissaoPaga">Valor Total de Comissão Paga (R$)</Label>
                  <Input 
                    id="valorComissaoPaga" 
                    name="valorComissaoPaga" 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    value={formData.valorComissaoPaga} 
                    onChange={handleInputChange} 
                    className="font-semibold"
                    readOnly 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dataPagamento">Data de Pagamento</Label>
                  <Input 
                    id="dataPagamento" 
                    name="dataPagamento" 
                    type="date" 
                    value={formData.dataPagamento} 
                    onChange={handleInputChange} 
                  />
                </div>
              </div>
              
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="comissaoAPagar">Adicionar Pagamento (R$)</Label>
                  <Input 
                    id="comissaoAPagar" 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    value={comissaoAPagar} 
                    onChange={(e) => setComissaoAPagar(e.target.value)} 
                    className="w-full"
                  />
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleAddPayment}
                  className="mb-0.5"
                  disabled={!comissaoAPagar || parseFloat(comissaoAPagar) <= 0}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>
            
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveProposal}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-white">
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
                  <td className="py-3 px-4 text-sm">{formatCurrency(Number(proposal.valorTotal))}</td>
                  <td className="py-3 px-4 text-sm">{formatCurrency(Number(proposal.valorPago))}</td>
                  <td className="py-3 px-4 text-sm">{formatCurrency(Number(proposal.saldoAberto))}</td>
                  <td className="py-3 px-3 text-center text-sm">{formatIntegerPercentage(Number(proposal.percentComissao))}</td>
                  <td className="py-3 px-4 text-sm">{formatCurrency(Number(proposal.valorComissaoTotal))}</td>
                  <td className="py-3 px-4 text-sm">{formatCurrency(Number(proposal.valorComissaoPaga))}</td>
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
                          onClick={() => handleEdit(proposal)}
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
                            className="mr-2 text-blue-500"
                          >
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            <path d="m15 5 4 4" />
                          </svg>
                          <span>Editar</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-neutral-700 cursor-pointer"
                          onClick={() => handleOpenPaymentHistory(proposal)}
                        >
                          <History className="mr-2 text-green-500 h-4 w-4" />
                          <span>Histórico de Pagamentos</span>
                        </DropdownMenuItem>
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
          <tfoot className="bg-gray-50 font-semibold">
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