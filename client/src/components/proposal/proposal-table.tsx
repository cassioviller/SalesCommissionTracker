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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { formatCurrency, formatIntegerPercentage } from "@/lib/utils/format";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Download, 
  Filter, 
  History, 
  Edit, 
  Trash, 
  Search,
  ChevronDown,
  MoreHorizontal
} from "lucide-react";
import type { SalesProposal, ProposalWithCalculations } from "@shared/schema";
import { TIPOS_CLIENTE, TIPOS_SERVICO, TIPOS_PROJETO, TIPOS_CONTRATO } from "@shared/schema";
import { useAuth } from "@/context/AuthContext";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Interface para as propriedades da tabela
interface ProposalTableProps {
  proposals: ProposalWithCalculations[];
  isLoading: boolean;
}

export default function ProposalTable({ proposals, isLoading }: ProposalTableProps) {
  // Obter o papel do usuário para mostrar controles diferentes baseado no papel
  const { userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localProposals, setLocalProposals] = useState<ProposalWithCalculations[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentProposal, setCurrentProposal] = useState<ProposalWithCalculations | null>(null);
  const [formData, setFormData] = useState({
    proposta: "",
    nomeCliente: "",
    tipoCliente: TIPOS_CLIENTE[0],
    tiposServico: [] as string[],
    dataProposta: "",
    tipoProjeto: TIPOS_PROJETO[0],
    tipoContrato: TIPOS_CONTRATO[0],
    pesoEstrutura: "",
    valorPorQuilo: "",
    valorTotal: "",
    valorPago: "",
    percentComissao: "",
    recomendacaoDireta: "nao",
    faturamentoDireto: "nao",
    tempoNegociacao: "",
    clienteRecompra: "nao"
  });
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    tipoCliente: "",
    tipoProjeto: "",
    tipoContrato: "",
    statusComissao: "" // "total", "parcial", "nenhuma"
  });
  
  useEffect(() => {
    setLocalProposals(proposals);
  }, [proposals]);
  
  // Filtragem de propostas
  useEffect(() => {
    let filtered = [...proposals];
    
    // Filtro de busca textual
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(proposal => 
        proposal.proposta.toLowerCase().includes(query) || 
        (proposal.nomeCliente && proposal.nomeCliente.toLowerCase().includes(query))
      );
    }
    
    // Filtros específicos
    if (filters.tipoCliente) {
      filtered = filtered.filter(proposal => proposal.tipoCliente === filters.tipoCliente);
    }
    
    if (filters.tipoProjeto) {
      filtered = filtered.filter(proposal => proposal.tipoProjeto === filters.tipoProjeto);
    }
    
    if (filters.tipoContrato) {
      filtered = filtered.filter(proposal => proposal.tipoContrato === filters.tipoContrato);
    }
    
    if (filters.statusComissao) {
      filtered = filtered.filter(proposal => {
        const percentPago = proposal.percentComissaoPaga;
        if (filters.statusComissao === "total") return percentPago >= 100;
        if (filters.statusComissao === "parcial") return percentPago > 0 && percentPago < 100;
        if (filters.statusComissao === "nenhuma") return percentPago <= 0;
        return true;
      });
    }
    
    setLocalProposals(filtered);
  }, [proposals, searchQuery, filters]);
  
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

  // Função para abrir o modal de edição
  const handleEdit = (proposal: ProposalWithCalculations) => {
    setCurrentProposal(proposal);
    
    // Verificamos se o tipo é válido ou usamos o primeiro valor do array
    const tipoClienteValue = proposal.tipoCliente && TIPOS_CLIENTE.includes(proposal.tipoCliente as any) 
      ? proposal.tipoCliente as any
      : TIPOS_CLIENTE[0];
      
    const tipoProjetoValue = proposal.tipoProjeto && TIPOS_PROJETO.includes(proposal.tipoProjeto as any)
      ? proposal.tipoProjeto as any
      : TIPOS_PROJETO[0];
      
    const tipoContratoValue = proposal.tipoContrato && TIPOS_CONTRATO.includes(proposal.tipoContrato as any)
      ? proposal.tipoContrato as any
      : TIPOS_CONTRATO[0];
    
    // Preparar dados do formulário
    setFormData({
      proposta: proposal.proposta,
      nomeCliente: proposal.nomeCliente || "",
      tipoCliente: tipoClienteValue,
      tiposServico: proposal.tiposServico || [],
      dataProposta: proposal.dataProposta ? new Date(proposal.dataProposta).toISOString().split('T')[0] : "",
      tipoProjeto: tipoProjetoValue,
      tipoContrato: tipoContratoValue,
      pesoEstrutura: proposal.pesoEstrutura?.toString() || "",
      valorPorQuilo: proposal.valorPorQuilo?.toString() || "",
      valorTotal: proposal.valorTotal.toString(),
      valorPago: proposal.valorPago.toString(),
      percentComissao: proposal.percentComissao.toString(),
      recomendacaoDireta: proposal.recomendacaoDireta || "nao",
      faturamentoDireto: proposal.faturamentoDireto || "nao",
      tempoNegociacao: proposal.tempoNegociacao?.toString() || "",
      clienteRecompra: proposal.clienteRecompra || "nao"
    });
    
    setIsEditDialogOpen(true);
  };
  
  // Manipulador de visualização de histórico de pagamentos
  const handleViewPaymentHistory = (proposalId: number) => {
    // Implementar lógica para visualizar histórico de pagamentos
    toast({
      title: "Histórico de Pagamentos",
      description: `Visualizando histórico da proposta ID: ${proposalId}`,
    });
  };
  
  // Handle input change in the edit form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  // Handle select change
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  // Handle checkbox change for service types
  const handleServiceTypeChange = (serviceType: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        tiposServico: [...prev.tiposServico, serviceType]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        tiposServico: prev.tiposServico.filter(type => type !== serviceType)
      }));
    }
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
    
    // Preparar dados para atualização
    const updateData = {
      proposta: formData.proposta,
      valorTotal,
      percentComissao,
      nomeCliente: formData.nomeCliente,
      tipoCliente: formData.tipoCliente,
      tiposServico: formData.tiposServico,
      dataProposta: formData.dataProposta,
      tipoProjeto: formData.tipoProjeto,
      tipoContrato: formData.tipoContrato,
      pesoEstrutura: formData.pesoEstrutura ? parseFloat(formData.pesoEstrutura) : undefined,
      valorPorQuilo: formData.valorPorQuilo ? parseFloat(formData.valorPorQuilo) : undefined,
      recomendacaoDireta: formData.recomendacaoDireta,
      faturamentoDireto: formData.faturamentoDireto,
      tempoNegociacao: formData.tempoNegociacao ? parseInt(formData.tempoNegociacao) : undefined,
      clienteRecompra: formData.clienteRecompra
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
        description: "A proposta foi removida com sucesso",
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
      "Cliente",
      "Tipo Cliente",
      "Tipo Projeto",
      "Tipo Contrato",
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
      proposal.nomeCliente || "",
      proposal.tipoCliente || "",
      proposal.tipoProjeto || "",
      proposal.tipoContrato || "",
      Number(proposal.valorTotal).toFixed(2),
      Number(proposal.valorPago).toFixed(2),
      Number(proposal.saldoAberto).toFixed(2),
      Number(proposal.percentComissao).toFixed(2),
      Number(proposal.valorComissaoTotal).toFixed(2),
      Number(proposal.valorComissaoPaga).toFixed(2),
      Number(proposal.valorComissaoEmAberto).toFixed(2),
      Number(proposal.percentComissaoPaga).toFixed(2),
    ]);
    
    // Converter para string CSV
    const csvContent = 
      headers.join(",") + "\n" + 
      csvData.map(row => row.join(",")).join("\n");
    
    // Criar blob e salvar
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `propostas_${new Date().toISOString().split('T')[0]}.csv`);
    
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
    doc.text("Relatório de Propostas", pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 22, { align: 'center' });
    
    // Preparar dados para a tabela
    const tableData = localProposals.map(proposal => [
      proposal.proposta,
      proposal.nomeCliente || "",
      proposal.tipoCliente || "",
      proposal.tipoProjeto || "",
      proposal.tipoContrato || "",
      formatCurrency(Number(proposal.valorTotal)),
      formatCurrency(Number(proposal.valorPago)),
      formatCurrency(Number(proposal.saldoAberto)),
      formatIntegerPercentage(Number(proposal.percentComissao)),
      formatCurrency(Number(proposal.valorComissaoTotal)),
      formatCurrency(Number(proposal.valorComissaoPaga)),
      formatCurrency(Number(proposal.valorComissaoEmAberto)),
      formatIntegerPercentage(Number(proposal.percentComissaoPaga)),
    ]);
    
    // Definir cabeçalhos
    const headers = [
      "Proposta",
      "Cliente",
      "Tipo Cliente",
      "Tipo Projeto",
      "Tipo Contrato",
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
        fontSize: 6,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      }
    });
    
    // Salvar o PDF
    doc.save(`propostas_${new Date().toISOString().split('T')[0]}.pdf`);
    
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
      {/* Barra de busca e filtros */}
      <div className="p-4 border-b">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              placeholder="Buscar proposta..." 
              className="pl-10" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Filtros
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={exportToCSV}
            >
              <FileText className="h-4 w-4" />
              CSV
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={exportToPDF}
            >
              <Download className="h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>
        
        {/* Painel de filtros */}
        {showFilters && (
          <div className="mt-3 p-3 border rounded-md bg-gray-50 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label htmlFor="tipoClienteFilter" className="text-xs">Tipo de Cliente</Label>
              <Select 
                value={filters.tipoCliente} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, tipoCliente: value }))}
              >
                <SelectTrigger id="tipoClienteFilter">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {TIPOS_CLIENTE.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="tipoProjetoFilter" className="text-xs">Tipo de Projeto</Label>
              <Select 
                value={filters.tipoProjeto} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, tipoProjeto: value }))}
              >
                <SelectTrigger id="tipoProjetoFilter">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {TIPOS_PROJETO.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="tipoContratoFilter" className="text-xs">Tipo de Contrato</Label>
              <Select 
                value={filters.tipoContrato} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, tipoContrato: value }))}
              >
                <SelectTrigger id="tipoContratoFilter">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {TIPOS_CONTRATO.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="statusComissaoFilter" className="text-xs">Status da Comissão</Label>
              <Select 
                value={filters.statusComissao} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, statusComissao: value }))}
              >
                <SelectTrigger id="statusComissaoFilter">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="total">100% Paga</SelectItem>
                  <SelectItem value="parcial">Parcialmente Paga</SelectItem>
                  <SelectItem value="nenhuma">Não Paga</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
      
      {/* Tabela de propostas */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-white">
            <tr className="border-b">
              <th className="py-3 px-4 text-left text-sm uppercase font-medium text-gray-600">Proposta</th>
              <th className="py-3 px-4 text-left text-sm uppercase font-medium text-gray-600">Cliente</th>
              <th className="py-3 px-4 text-left text-sm uppercase font-medium text-gray-600">Tipo Cliente</th>
              <th className="py-3 px-4 text-left text-sm uppercase font-medium text-gray-600">Valor Total</th>
              <th className="py-3 px-4 text-left text-sm uppercase font-medium text-gray-600">Valor Pago</th>
              <th className="py-3 px-4 text-left text-sm uppercase font-medium text-gray-600">Saldo Aberto</th>
              <th className="py-3 px-3 text-center text-sm uppercase font-medium text-gray-600">% Comissão</th>
              <th className="py-3 px-4 text-left text-sm uppercase font-medium text-gray-600">Comissão Total</th>
              <th className="py-3 px-4 text-left text-sm uppercase font-medium text-gray-600">Comissão Paga</th>
              <th className="py-3 px-3 text-center text-sm uppercase font-medium text-gray-600">% Paga</th>
              <th className="py-3 px-2 text-center text-sm uppercase font-medium text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody>
            {localProposals.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-6 text-sm text-neutral-500">
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
                  <td className="py-3 px-4 text-sm">{proposal.nomeCliente || "-"}</td>
                  <td className="py-3 px-4 text-sm">
                    {proposal.tipoCliente ? (
                      <Badge variant="outline" className="font-normal">
                        {proposal.tipoCliente}
                      </Badge>
                    ) : "-"}
                  </td>
                  <td className="py-3 px-4 text-sm">{formatCurrency(Number(proposal.valorTotal))}</td>
                  <td className="py-3 px-4 text-sm">{formatCurrency(Number(proposal.valorPago))}</td>
                  <td className="py-3 px-4 text-sm">{formatCurrency(Number(proposal.saldoAberto))}</td>
                  <td className="py-3 px-3 text-center text-sm">{formatIntegerPercentage(Number(proposal.percentComissao))}</td>
                  <td className="py-3 px-4 text-sm">{formatCurrency(Number(proposal.valorComissaoTotal))}</td>
                  <td className="py-3 px-4 text-sm">{formatCurrency(Number(proposal.valorComissaoPaga))}</td>
                  <td className="py-3 px-3 text-center text-sm">
                    <span className={getPercentageColorClass(Number(proposal.percentComissaoPaga))}>
                      {formatIntegerPercentage(Number(proposal.percentComissaoPaga))}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4 text-neutral-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {/* Item comum a todos os usuários */}
                        <DropdownMenuItem 
                          className="text-neutral-700 cursor-pointer"
                          onClick={() => handleViewPaymentHistory(proposal.id)}
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
                              <Edit className="mr-2 text-blue-500 h-4 w-4" />
                              <span>Editar</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-neutral-700 cursor-pointer"
                              onClick={() => handleDelete(proposal.id)}
                            >
                              <Trash className="mr-2 text-red-500 h-4 w-4" />
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
        </table>
      </div>
      
      {/* Dialog de edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Editar Proposta</DialogTitle>
            <DialogDescription>
              Edite os detalhes da proposta e suas informações complementares
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 pt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="proposta">Número da Proposta</Label>
                <Input 
                  id="proposta" 
                  name="proposta" 
                  value={formData.proposta} 
                  onChange={handleInputChange} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nomeCliente">Nome do Cliente</Label>
                <Input 
                  id="nomeCliente" 
                  name="nomeCliente" 
                  value={formData.nomeCliente} 
                  onChange={handleInputChange} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tipoCliente">Tipo de Cliente</Label>
                <Select 
                  value={formData.tipoCliente} 
                  onValueChange={(value) => handleSelectChange("tipoCliente", value)}
                >
                  <SelectTrigger id="tipoCliente">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_CLIENTE.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dataProposta">Data da Proposta</Label>
                <Input 
                  id="dataProposta" 
                  name="dataProposta"
                  type="date"
                  value={formData.dataProposta} 
                  onChange={handleInputChange} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tipoProjeto">Tipo de Projeto</Label>
                <Select 
                  value={formData.tipoProjeto} 
                  onValueChange={(value) => handleSelectChange("tipoProjeto", value)}
                >
                  <SelectTrigger id="tipoProjeto">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_PROJETO.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tipoContrato">Tipo de Contrato</Label>
                <Select 
                  value={formData.tipoContrato} 
                  onValueChange={(value) => handleSelectChange("tipoContrato", value)}
                >
                  <SelectTrigger id="tipoContrato">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_CONTRATO.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Tipos de serviço - Seleção múltipla */}
            <div className="space-y-2">
              <Label>Tipos de Serviço</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border rounded-md p-3 max-h-32 overflow-y-auto">
                {TIPOS_SERVICO.map((servico) => (
                  <div key={servico} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`servico-${servico}`} 
                      checked={formData.tiposServico.includes(servico)}
                      onCheckedChange={(checked) => 
                        handleServiceTypeChange(servico, checked as boolean)
                      }
                    />
                    <label 
                      htmlFor={`servico-${servico}`}
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {servico}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pesoEstrutura">Peso da Estrutura (kg)</Label>
                <Input 
                  id="pesoEstrutura" 
                  name="pesoEstrutura" 
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.pesoEstrutura}
                  onChange={handleInputChange} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="valorPorQuilo">Valor por Quilo (R$)</Label>
                <Input 
                  id="valorPorQuilo" 
                  name="valorPorQuilo" 
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.valorPorQuilo} 
                  onChange={handleInputChange} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tempoNegociacao">Tempo de Negociação (dias)</Label>
                <Input 
                  id="tempoNegociacao" 
                  name="tempoNegociacao" 
                  type="number"
                  min="0"
                  value={formData.tempoNegociacao} 
                  onChange={handleInputChange} 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recomendacaoDireta">Recomendação Direta</Label>
                <Select 
                  value={formData.recomendacaoDireta} 
                  onValueChange={(value) => handleSelectChange("recomendacaoDireta", value)}
                >
                  <SelectTrigger id="recomendacaoDireta">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">Sim</SelectItem>
                    <SelectItem value="nao">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="faturamentoDireto">Faturamento Direto</Label>
                <Select 
                  value={formData.faturamentoDireto} 
                  onValueChange={(value) => handleSelectChange("faturamentoDireto", value)}
                >
                  <SelectTrigger id="faturamentoDireto">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">Sim</SelectItem>
                    <SelectItem value="nao">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clienteRecompra">Cliente de Recompra</Label>
                <Select 
                  value={formData.clienteRecompra} 
                  onValueChange={(value) => handleSelectChange("clienteRecompra", value)}
                >
                  <SelectTrigger id="clienteRecompra">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">Sim</SelectItem>
                    <SelectItem value="nao">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              
              <div className="space-y-2">
                <Label>Valor da Comissão</Label>
                <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted flex items-center text-sm">
                  {formData.valorTotal && formData.percentComissao
                    ? formatCurrency(
                        parseFloat(formData.valorTotal) * 
                        (parseFloat(formData.percentComissao) / 100)
                      )
                    : "R$ 0,00"}
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveProposal}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}