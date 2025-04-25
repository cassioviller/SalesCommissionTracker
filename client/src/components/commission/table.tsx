import { useState, useEffect, forwardRef, useImperativeHandle, Ref } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ProposalWithCalculations, SalesProposal } from '@shared/schema';
import { Edit, FileText, FilePdf, History } from 'lucide-react';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import PaymentHistoryModal from './payment-history-modal';

interface CommissionTableProps {
  proposals: ProposalWithCalculations[];
  isLoading: boolean;
}

interface TableRefHandle {
  handleOpenPaymentHistoryById: (proposalId: number, proposalName: string) => void;
}

const CommissionTable = forwardRef<TableRefHandle, CommissionTableProps>(function ({ proposals, isLoading }, ref) {
  // Obter o papel do usuário para mostrar controles diferentes baseado no papel
  const { userRole } = useAuth();

  // Função para determinar a classe de cor da linha com base na porcentagem de comissão paga
  const getRowColorClass = (percentComissaoPaga: number): string => {
    if (percentComissaoPaga <= 0) return 'bg-red-50'; // Vermelho só quando 0%
    if (percentComissaoPaga >= 100) return 'bg-green-50'; // Verde só quando 100%
    return 'bg-yellow-50'; // Amarelo para todos os valores entre 1% e 99%
  };

  // Função para determinar a classe de cor do texto da porcentagem
  const getPercentageColorClass = (percentComissaoPaga: number): string => {
    if (percentComissaoPaga <= 0) return 'text-red-600 font-medium';
    if (percentComissaoPaga >= 100) return 'text-green-600 font-medium';
    // Tons sutis de amarelo para valores parciais
    if (percentComissaoPaga > 75) return 'text-amber-600 font-medium';
    if (percentComissaoPaga > 50) return 'text-amber-500 font-medium';
    if (percentComissaoPaga > 25) return 'text-yellow-600 font-medium';
    return 'text-yellow-700 font-medium';
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
      `R$ ${Number(proposal.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${Number(proposal.valorPago).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${Number(proposal.saldoAberto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `${Number(proposal.percentComissao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}%`,
      `R$ ${Number(proposal.valorComissaoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${Number(proposal.valorComissaoPaga).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${Number(proposal.valorComissaoEmAberto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `${Number(proposal.percentComissaoPaga).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}%`,
    ]);

    // Adicionar linha de totais
    tableData.push([
      "TOTAL",
      `R$ ${totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${totalAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      "-",
      `R$ ${totalComissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${totalComissaoPaga.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${totalComissaoEmAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `${percentComissaoPaga.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}%`,
    ]);

    // Gerar tabela PDF
    autoTable(doc, {
      head: [["Proposta", "Valor Total", "Valor Pago", "Saldo Aberto", "% Comissão", "Valor Comissão", "Comissão Paga", "Comissão em Aberto", "% Comissão Paga"]],
      body: tableData,
      foot: [], // Não precisamos definir um rodapé, pois já adicionamos a linha de totais ao corpo
      theme: 'striped',
      headStyles: { fillColor: [53, 151, 255] },
      footStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
      margin: { top: 30 },
    });

    // Salvar o documento
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
      {/* Barra de ferramentas */}
      <div className="flex justify-end items-center gap-2 p-3 border-b">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1 text-sm"
          onClick={exportToCSV}
        >
          <FileText className="h-4 w-4" />
          Exportar CSV
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1 text-sm"
          onClick={exportToPDF}
        >
          <FilePdf className="h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 text-neutral-500 text-xs uppercase">
              <th className="px-4 py-3 text-left font-medium">Proposta</th>
              <th className="px-2 py-3 text-right font-medium">Valor Total</th>
              <th className="px-2 py-3 text-right font-medium">Valor Pago</th>
              <th className="px-2 py-3 text-right font-medium">Saldo Aberto</th>
              <th className="px-2 py-3 text-right font-medium">% Comissão</th>
              <th className="px-2 py-3 text-right font-medium">Valor Comissão</th>
              <th className="px-2 py-3 text-right font-medium">Comissão Paga</th>
              <th className="px-2 py-3 text-right font-medium">Comissão em Aberto</th>
              <th className="px-2 py-3 text-right font-medium">% Comissão Paga</th>
              <th className="px-2 py-3 text-center font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {localProposals.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-6 text-neutral-500">
                  Nenhuma proposta encontrada
                </td>
              </tr>
            ) : (
              localProposals.map((proposal) => (
                <tr 
                  key={proposal.id} 
                  className={`border-t hover:bg-neutral-50 ${getRowColorClass(proposal.percentComissaoPaga)}`}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{proposal.proposta}</div>
                    {proposal.nomeCliente && (
                      <div className="text-xs text-neutral-500">{proposal.nomeCliente}</div>
                    )}
                  </td>
                  <td className="px-2 py-3 text-right">
                    R$ {Number(proposal.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-2 py-3 text-right">
                    {userRole === 'admin' ? (
                      <Input
                        value={proposal.valorPago.toString()}
                        onChange={(e) => handleFieldChange(proposal.id, 'valorPago', e.target.value)}
                        type="number"
                        step="0.01"
                        min="0"
                        className="h-8 w-28 text-right"
                      />
                    ) : (
                      <span>R$ {Number(proposal.valorPago).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    )}
                  </td>
                  <td className="px-2 py-3 text-right">
                    R$ {Number(proposal.saldoAberto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-2 py-3 text-right">
                    {Number(proposal.percentComissao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}%
                  </td>
                  <td className="px-2 py-3 text-right">
                    R$ {Number(proposal.valorComissaoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-2 py-3 text-right">
                    {userRole === 'admin' ? (
                      <Input
                        value={proposal.valorComissaoPaga.toString()}
                        onChange={(e) => handleFieldChange(proposal.id, 'valorComissaoPaga', e.target.value)}
                        type="number"
                        step="0.01"
                        min="0"
                        className="h-8 w-28 text-right"
                      />
                    ) : (
                      <span>R$ {Number(proposal.valorComissaoPaga).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    )}
                  </td>
                  <td className="px-2 py-3 text-right">
                    R$ {Number(proposal.valorComissaoEmAberto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`px-2 py-3 text-right ${getPercentageColorClass(proposal.percentComissaoPaga)}`}>
                    {Number(proposal.percentComissaoPaga).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}%
                  </td>
                  <td className="px-2 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenPaymentHistory(proposal)}
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      {userRole === 'admin' && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(proposal)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="bg-neutral-100 font-medium">
              <td className="px-4 py-3">TOTAL</td>
              <td className="px-2 py-3 text-right">
                R$ {totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-2 py-3 text-right">
                R$ {totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-2 py-3 text-right">
                R$ {totalAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-2 py-3 text-right">-</td>
              <td className="px-2 py-3 text-right">
                R$ {totalComissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-2 py-3 text-right">
                R$ {totalComissaoPaga.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-2 py-3 text-right">
                R$ {totalComissaoEmAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className={`px-2 py-3 text-right ${getPercentageColorClass(percentComissaoPaga)}`}>
                {percentComissaoPaga.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}%
              </td>
              <td className="px-2 py-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Diálogo de edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Proposta</DialogTitle>
            <DialogDescription>
              Edite os detalhes básicos da proposta. Campos de pagamento podem ser alterados diretamente na tabela.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="proposta">Nome da Proposta</Label>
              <Input
                id="proposta"
                name="proposta"
                value={formData.proposta}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="valorTotal">Valor Total</Label>
              <Input
                id="valorTotal"
                name="valorTotal"
                type="number"
                value={formData.valorTotal}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="percentComissao">Percentual de Comissão (%)</Label>
              <Input
                id="percentComissao"
                name="percentComissao"
                type="number"
                value={formData.percentComissao}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSaveProposal}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de histórico de pagamentos */}
      {selectedProposalId && (
        <PaymentHistoryModal
          isOpen={isPaymentHistoryModalOpen}
          onClose={() => setIsPaymentHistoryModalOpen(false)}
          propostaId={selectedProposalId}
          propostaNome={selectedProposalName}
          pagamentosProposta={selectedProposalDetails?.pagamentosProposta || []}
          pagamentosComissao={selectedProposalDetails?.pagamentosComissao || []}
        />
      )}
    </div>
  );
});

export default CommissionTable;