import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
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
import { Loader2, MoreHorizontal, History, Edit, Trash, Eye, FileText, Download } from "lucide-react";
import type { SalesProposal, ProposalWithCalculations } from "@shared/schema";
import PaymentHistoryModal from "./payment-history-modal";
import { useAuth } from "@/context/AuthContext";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Interface para as propriedades da tabela
interface CommissionTableProps {
  proposals: ProposalWithCalculations[];
  isLoading: boolean;
}

// Interface para as funções expostas para o componente pai
interface TableRefHandle {
  handleOpenPaymentHistoryById: (proposalId: number, proposalName: string) => void;
}

const CommissionTable = forwardRef<TableRefHandle, CommissionTableProps>(({ proposals, isLoading }, ref) => {
  // Obter o papel do usuário para mostrar controles diferentes baseado no papel
  const { userRole } = useAuth();
  
  // Função para determinar a classe de cor da linha com base na porcentagem de comissão paga
  const getRowColorClass = (percentComissaoPaga: number): string => {
    if (percentComissaoPaga <= 0) return 'bg-red-50';
    if (percentComissaoPaga >= 100) return 'bg-green-50';
    if (percentComissaoPaga > 70) return 'bg-green-50/50';
    if (percentComissaoPaga > 30) return 'bg-yellow-50';
    return 'bg-orange-50';
  };
  
  // Função para determinar a classe de cor do texto da porcentagem
  const getPercentageColorClass = (percentComissaoPaga: number): string => {
    if (percentComissaoPaga <= 0) return 'text-red-600 font-medium';
    if (percentComissaoPaga >= 100) return 'text-green-600 font-medium';
    if (percentComissaoPaga > 70) return 'text-green-500 font-medium';
    if (percentComissaoPaga > 30) return 'text-yellow-600 font-medium';
    return 'text-orange-500 font-medium';
  };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localProposals, setLocalProposals] = useState<ProposalWithCalculations[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentProposal, setCurrentProposal] = useState<ProposalWithCalculations | null>(null);
  const [formData, setFormData] = useState({
    proposta: "",
    valorTotal: "0",
    percentComissao: "0"
  });
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
  
  // Funções para abrir o modal de histórico de pagamentos
  const handleOpenPaymentHistory = (proposal: ProposalWithCalculations) => {
    setSelectedProposalId(proposal.id);
    setSelectedProposalName(proposal.proposta);
    setIsPaymentHistoryModalOpen(true);
  };
  
  // Função para abrir o histórico de pagamentos pelo ID (usada pelo componente pai)
  const handleOpenPaymentHistoryById = (proposalId: number, proposalName: string) => {
    setSelectedProposalId(proposalId);
    setSelectedProposalName(proposalName);
    setIsPaymentHistoryModalOpen(true);
  };
  
  // Expondo funções para o componente pai
  useImperativeHandle(ref, () => ({
    handleOpenPaymentHistoryById
  }));
  
  // Função para abrir o diálogo de edição
  const handleEdit = (proposal: ProposalWithCalculations) => {
    setCurrentProposal(proposal);
    setFormData({
      proposta: proposal.proposta,
      valorTotal: proposal.valorTotal.toString(),
      percentComissao: proposal.percentComissao.toString()
    });
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
  
  // Handle saving the edited proposal
  const handleSaveProposal = () => {
    if (!currentProposal) return;
    
    // Validar dados do formulário
    const valorTotal = parseFloat(formData.valorTotal);
    const percentComissao = parseFloat(formData.percentComissao);
    
    if (isNaN(valorTotal) || valorTotal < 0 ||
        isNaN(percentComissao) || percentComissao < 0 || percentComissao > 100) {
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
      percentComissao,
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
  
  // Função para exportar dados para CSV
  const exportToCSV = () => {
    if (localProposals.length === 0) {
      toast({
        title: "Sem dados",
        description: "Não há dados para exportar",
        variant: "destructive",
      });
      return;
    }
    
    // Cabeçalhos do CSV
    const headers = [
      "Proposta",
      "Valor Total",
      "Valor Pago",
      "Saldo Aberto",
      "% Comissão",
      "Valor Comissão",
      "Comissão Paga",
      "Comissão em Aberto",
      "% Comissão Paga"
    ];
    
    // Preparar dados
    const csvData = localProposals.map(proposal => [
      proposal.proposta,
      Number(proposal.valorTotal).toFixed(2),
      Number(proposal.valorPago).toFixed(2),
      Number(proposal.saldoAberto).toFixed(2),
      Number(proposal.percentComissao).toFixed(2),
      Number(proposal.valorComissaoTotal).toFixed(2),
      Number(proposal.valorComissaoPaga).toFixed(2),
      Number(proposal.valorComissaoEmAberto).toFixed(2),
      Number(proposal.percentComissaoPaga).toFixed(2),
    ]);
    
    // Adicionar linha de totais
    csvData.push([
      "TOTAL",
      totalValor.toFixed(2),
      totalPago.toFixed(2),
      totalAberto.toFixed(2),
      "-",
      totalComissao.toFixed(2),
      totalComissaoPaga.toFixed(2),
      totalComissaoEmAberto.toFixed(2),
      percentComissaoPaga.toFixed(2),
    ]);
    
    // Converter para string CSV
    const csvContent = 
      headers.join(",") + "\n" + 
      csvData.map(row => row.join(",")).join("\n");
    
    // Criar blob e salvar
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `comissoes_${new Date().toISOString().split('T')[0]}.csv`);
    
    toast({
      title: "Exportação concluída",
      description: "Os dados foram exportados para CSV com sucesso",
      variant: "default",
    });
  };
  
  // Função para exportar dados para PDF
  const exportToPDF = () => {
    if (localProposals.length === 0) {
      toast({
        title: "Sem dados",
        description: "Não há dados para exportar",
        variant: "destructive",
      });
      return;
    }
    
    // Criar documento PDF
    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Adicionar título
    doc.setFontSize(18);
    doc.text("Relatório de Comissões", pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 22, { align: 'center' });
    
    // Preparar dados para a tabela
    const tableData = localProposals.map(proposal => [
      proposal.proposta,
      formatCurrency(Number(proposal.valorTotal)),
      formatCurrency(Number(proposal.valorPago)),
      formatCurrency(Number(proposal.saldoAberto)),
      formatIntegerPercentage(Number(proposal.percentComissao)),
      formatCurrency(Number(proposal.valorComissaoTotal)),
      formatCurrency(Number(proposal.valorComissaoPaga)),
      formatCurrency(Number(proposal.valorComissaoEmAberto)),
      formatIntegerPercentage(Number(proposal.percentComissaoPaga)),
    ]);
    
    // Adicionar linha de totais
    tableData.push([
      "TOTAL",
      formatCurrency(totalValor),
      formatCurrency(totalPago),
      formatCurrency(totalAberto),
      "-",
      formatCurrency(totalComissao),
      formatCurrency(totalComissaoPaga),
      formatCurrency(totalComissaoEmAberto),
      formatIntegerPercentage(percentComissaoPaga),
    ]);
    
    // Definir cabeçalhos
    const headers = [
      "Proposta",
      "Valor Total",
      "Valor Pago",
      "Saldo Aberto",
      "% Comissão",
      "Valor Comissão",
      "Comissão Paga",
      "Comissão em Aberto",
      "% Comissão Paga"
    ];
    
    // Criar a tabela
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 30,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
      footStyles: {
        fillColor: [200, 200, 200],
        fontStyle: 'bold',
      }
    });
    
    // Salvar o PDF
    doc.save(`comissoes_${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "Exportação concluída",
      description: "Os dados foram exportados para PDF com sucesso",
      variant: "default",
    });
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
            
            <div className="space-y-2">
              <Label htmlFor="valorTotal">Valor Total do Contrato (R$)</Label>
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
              <div className="flex justify-between items-center">
                <Label htmlFor="percentComissao">Percentual de Comissão (%)</Label>
                <span className="text-xs text-muted-foreground">
                  Comissão Total: {formData.valorTotal && formData.percentComissao ? 
                    formatCurrency(Number(formData.valorTotal) * (Number(formData.percentComissao) / 100)) : 
                    formatCurrency(0)}
                </span>
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
                <tr 
                  key={proposal.id} 
                  className={`border-b hover:bg-gray-50 ${getRowColorClass(Number(proposal.percentComissaoPaga))}`}
                >
                  <td className="py-3 px-4 font-medium text-sm">{proposal.proposta}</td>
                  <td className="py-3 px-4 text-sm">{formatCurrency(Number(proposal.valorTotal))}</td>
                  <td className="py-3 px-4 text-sm">{formatCurrency(Number(proposal.valorPago))}</td>
                  <td className="py-3 px-4 text-sm">{formatCurrency(Number(proposal.saldoAberto))}</td>
                  <td className="py-3 px-3 text-center text-sm">{formatIntegerPercentage(Number(proposal.percentComissao))}</td>
                  <td className="py-3 px-4 text-sm">{formatCurrency(Number(proposal.valorComissaoTotal))}</td>
                  <td className="py-3 px-4 text-sm">{formatCurrency(Number(proposal.valorComissaoPaga))}</td>
                  <td className="py-3 px-4 text-sm">{formatCurrency(Number(proposal.valorComissaoEmAberto))}</td>
                  <td className="py-3 px-3 text-center text-sm">
                    <span className={getPercentageColorClass(Number(proposal.percentComissaoPaga))}>
                      {formatIntegerPercentage(Number(proposal.percentComissaoPaga))}
                    </span>
                  </td>
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
                        {/* Item comum a todos os usuários */}
                        <DropdownMenuItem 
                          className="text-neutral-700 cursor-pointer"
                          onClick={() => handleOpenPaymentHistory(proposal)}
                        >
                          <History className="mr-2 text-green-500 h-4 w-4" />
                          <span>Histórico de Pagamentos</span>
                        </DropdownMenuItem>
                        
                        {/* Items apenas para administradores */}
                        {(userRole === 'admin' || !userRole) && (
                          <>
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
                          </>
                        )}
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
              <td className="py-3 px-3 text-sm text-center">
                <span className={getPercentageColorClass(percentComissaoPaga)}>
                  {formatIntegerPercentage(percentComissaoPaga)}
                </span>
              </td>
              <td className="py-3 px-2 text-sm text-center">-</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
});

export default CommissionTable;