import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format";
import type { 
  ProposalWithCalculations, 
  PagamentoProposta, 
  PagamentoComissao 
} from "@shared/schema";

export default function PagamentosProposta() {
  const { id } = useParams();
  const propostaId = parseInt(id || "0");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pagamentos");
  
  // Estados para formulário de novo pagamento
  const [novoValor, setNovoValor] = useState("");
  const [novaData, setNovaData] = useState<Date | undefined>(new Date());
  const [novaObservacao, setNovaObservacao] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Buscar dados da proposta
  const { data: proposta, isLoading, error } = useQuery<ProposalWithCalculations>({
    queryKey: ['/api/proposals', propostaId],
    queryFn: async () => {
      if (!propostaId) throw new Error("ID da proposta não informado");
      const res = await apiRequest("GET", `/api/proposals/${propostaId}`);
      return res.json();
    },
    enabled: !!propostaId,
  });

  // Buscar pagamentos da proposta
  const { data: pagamentosProposta = [] } = useQuery<PagamentoProposta[]>({
    queryKey: ['/api/propostas', propostaId, 'pagamentos'],
    queryFn: async () => {
      if (!propostaId) throw new Error("ID da proposta não informado");
      const res = await apiRequest("GET", `/api/propostas/${propostaId}/pagamentos`);
      return res.json();
    },
    enabled: !!propostaId,
  });

  // Buscar pagamentos de comissão da proposta
  const { data: pagamentosComissao = [] } = useQuery<PagamentoComissao[]>({
    queryKey: ['/api/propostas', propostaId, 'comissoes'],
    queryFn: async () => {
      if (!propostaId) throw new Error("ID da proposta não informado");
      const res = await apiRequest("GET", `/api/propostas/${propostaId}/comissoes`);
      return res.json();
    },
    enabled: !!propostaId,
  });

  // Mutation para adicionar pagamento
  const addPagamentoMutation = useMutation({
    mutationFn: async (data: { valor: number; dataPagamento: string; observacao?: string }) => {
      if (!propostaId) throw new Error("ID da proposta não informado");
      const res = await apiRequest("POST", `/api/propostas/${propostaId}/pagamentos`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Pagamento adicionado",
        description: "O pagamento foi registrado com sucesso",
      });
      
      // Limpar formulário
      setNovoValor("");
      setNovaData(new Date());
      setNovaObservacao("");
      
      // Atualizar dados
      queryClient.invalidateQueries({ queryKey: ['/api/propostas', propostaId, 'pagamentos'] });
      queryClient.invalidateQueries({ queryKey: ['/api/proposals', propostaId] });
      queryClient.invalidateQueries({ queryKey: ['/api/proposals'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Não foi possível adicionar o pagamento: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation para adicionar pagamento de comissão
  const addPagamentoComissaoMutation = useMutation({
    mutationFn: async (data: { valor: number; dataPagamento: string; observacao?: string }) => {
      if (!propostaId) throw new Error("ID da proposta não informado");
      const res = await apiRequest("POST", `/api/propostas/${propostaId}/comissoes`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Pagamento de comissão adicionado",
        description: "O pagamento foi registrado com sucesso",
      });
      
      // Limpar formulário
      setNovoValor("");
      setNovaData(new Date());
      setNovaObservacao("");
      
      // Atualizar dados
      queryClient.invalidateQueries({ queryKey: ['/api/propostas', propostaId, 'comissoes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/proposals', propostaId] });
      queryClient.invalidateQueries({ queryKey: ['/api/proposals'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Não foi possível adicionar o pagamento de comissão: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir pagamento
  const deletePagamentoMutation = useMutation({
    mutationFn: async (pagamentoId: number) => {
      const res = await apiRequest("DELETE", `/api/propostas/pagamentos/${pagamentoId}`);
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Pagamento excluído",
        description: "O pagamento foi excluído com sucesso",
      });
      
      // Atualizar dados
      queryClient.invalidateQueries({ queryKey: ['/api/propostas', propostaId, 'pagamentos'] });
      queryClient.invalidateQueries({ queryKey: ['/api/proposals', propostaId] });
      queryClient.invalidateQueries({ queryKey: ['/api/proposals'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Não foi possível excluir o pagamento: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir pagamento de comissão
  const deletePagamentoComissaoMutation = useMutation({
    mutationFn: async (pagamentoId: number) => {
      const res = await apiRequest("DELETE", `/api/propostas/comissoes/${pagamentoId}`);
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Pagamento de comissão excluído",
        description: "O pagamento foi excluído com sucesso",
      });
      
      // Atualizar dados
      queryClient.invalidateQueries({ queryKey: ['/api/propostas', propostaId, 'comissoes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/proposals', propostaId] });
      queryClient.invalidateQueries({ queryKey: ['/api/proposals'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Não foi possível excluir o pagamento de comissão: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!novoValor || !novaData) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, preencha o valor e a data do pagamento",
        variant: "destructive",
      });
      return;
    }
    
    // Converte o valor para número e formata a data
    const valorNumerico = Number(novoValor.replace(',', '.'));
    
    if (isNaN(valorNumerico)) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor numérico válido",
        variant: "destructive",
      });
      return;
    }
    
    const data = {
      valor: valorNumerico,
      dataPagamento: format(novaData, 'yyyy-MM-dd'),
      observacao: novaObservacao || undefined,
    };
    
    if (activeTab === "pagamentos") {
      addPagamentoMutation.mutate(data);
    } else {
      addPagamentoComissaoMutation.mutate(data);
    }
  };
  
  if (isLoading || error || !proposta) {
    return (
      <Dialog open={true}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Carregando...</DialogTitle>
          </DialogHeader>
          <div className="flex justify-end">
            <Link href="/propostas">
              <Button variant="outline">Fechar</Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-auto max-h-[90vh]">
        <DialogHeader className="p-6 pb-3">
          <DialogTitle>Histórico de Pagamentos</DialogTitle>
          <div className="text-sm text-muted-foreground">
            Proposta: {proposta.proposta} - {proposta.nomeCliente || ""}
          </div>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 mx-auto px-6">
            <TabsTrigger value="pagamentos">Pagamentos da Proposta</TabsTrigger>
            <TabsTrigger value="comissoes">Pagamentos de Comissão</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pagamentos" className="px-6 pb-6 space-y-4">
            {/* Lista de pagamentos */}
            <div className="border-b border-gray-200 pb-2">
              <div className="grid grid-cols-3 text-sm font-medium text-gray-500">
                <div>Data</div>
                <div>Valor</div>
                <div>Observação</div>
              </div>
            </div>
            
            {pagamentosProposta.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground text-sm">Nenhum pagamento registrado</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[200px] overflow-auto">
                {pagamentosProposta.map((pagamento: PagamentoProposta) => (
                  <div key={pagamento.id} className="grid grid-cols-3 items-center border-b border-gray-100 pb-3">
                    <div className="text-sm">
                      {format(new Date(pagamento.dataPagamento), "dd/MM/yyyy")}
                    </div>
                    <div className="text-sm font-medium">
                      {formatCurrency(Number(pagamento.valor))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 truncate max-w-[80px]">
                        {pagamento.observacao || "-"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500"
                        onClick={() => deletePagamentoMutation.mutate(pagamento.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Formulário para adicionar pagamento */}
            <div className="pt-4">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-sm font-medium mb-1">Valor</div>
                  <Input
                    type="text"
                    placeholder="0,00"
                    value={novoValor}
                    onChange={(e) => setNovoValor(e.target.value)}
                  />
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Data</div>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !novaData && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {novaData ? (
                          format(novaData, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={novaData}
                        onSelect={(date) => {
                          setNovaData(date);
                          setIsCalendarOpen(false);
                        }}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="text-sm font-medium mb-1">Observação (opcional)</div>
                <Textarea
                  placeholder="Digite uma observação"
                  value={novaObservacao}
                  onChange={(e) => setNovaObservacao(e.target.value)}
                  rows={3}
                />
              </div>
              
              <Button 
                className="w-full bg-blue-500 hover:bg-blue-600" 
                onClick={handleSubmit}
              >
                Adicionar Pagamento
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="comissoes" className="px-6 pb-6 space-y-4">
            {/* Lista de pagamentos de comissão */}
            <div className="border-b border-gray-200 pb-2">
              <div className="grid grid-cols-3 text-sm font-medium text-gray-500">
                <div>Data</div>
                <div>Valor</div>
                <div>Observação</div>
              </div>
            </div>
            
            {pagamentosComissao.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground text-sm">Nenhum pagamento de comissão registrado</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[200px] overflow-auto">
                {pagamentosComissao.map((pagamento: PagamentoComissao) => (
                  <div key={pagamento.id} className="grid grid-cols-3 items-center border-b border-gray-100 pb-3">
                    <div className="text-sm">
                      {format(new Date(pagamento.dataPagamento), "dd/MM/yyyy")}
                    </div>
                    <div className="text-sm font-medium">
                      {formatCurrency(Number(pagamento.valor))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 truncate max-w-[80px]">
                        {pagamento.observacao || "-"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500"
                        onClick={() => deletePagamentoComissaoMutation.mutate(pagamento.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Formulário para adicionar pagamento de comissão */}
            <div className="pt-4">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-sm font-medium mb-1">Valor</div>
                  <Input
                    type="text"
                    placeholder="0,00"
                    value={novoValor}
                    onChange={(e) => setNovoValor(e.target.value)}
                  />
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Data</div>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !novaData && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {novaData ? (
                          format(novaData, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={novaData}
                        onSelect={(date) => {
                          setNovaData(date);
                          setIsCalendarOpen(false);
                        }}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="text-sm font-medium mb-1">Observação (opcional)</div>
                <Textarea
                  placeholder="Digite uma observação"
                  value={novaObservacao}
                  onChange={(e) => setNovaObservacao(e.target.value)}
                  rows={3}
                />
              </div>
              
              <Button 
                className="w-full bg-blue-500 hover:bg-blue-600" 
                onClick={handleSubmit}
              >
                Adicionar Pagamento de Comissão
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end p-4 border-t">
          <DialogClose asChild>
            <Link href="/propostas">
              <Button variant="outline">Fechar</Button>
            </Link>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}