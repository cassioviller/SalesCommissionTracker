import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, CalendarIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import NavigationHeader from "@/components/navigation-header";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format";
import type { ProposalWithCalculations } from "@shared/schema";

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
  
  // Mutation para adicionar pagamento
  const adicionarPagamentoMutation = useMutation({
    mutationFn: async () => {
      if (!propostaId || !novoValor || !novaData) {
        throw new Error("Preencha todos os campos obrigatórios");
      }

      const valorNumerico = parseFloat(novoValor.replace(",", "."));
      if (isNaN(valorNumerico) || valorNumerico <= 0) {
        throw new Error("Valor inválido");
      }

      const endpoint = activeTab === "pagamentos" 
        ? `/api/propostas/${propostaId}/pagamentos`
        : `/api/propostas/${propostaId}/comissoes`;

      const response = await apiRequest("POST", endpoint, {
        valor: valorNumerico,
        dataPagamento: format(novaData, "yyyy-MM-dd"),
        observacao: novaObservacao
      });

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proposals'] });
      queryClient.invalidateQueries({ queryKey: [`/api/proposals/${propostaId}`] });
      
      // Limpar o formulário
      setNovoValor("");
      setNovaData(new Date());
      setNovaObservacao("");
      
      toast({
        title: "Sucesso",
        description: activeTab === "pagamentos"
          ? "Pagamento registrado com sucesso"
          : "Pagamento de comissão registrado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Falha ao registrar pagamento: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutation para excluir pagamento
  const excluirPagamentoMutation = useMutation({
    mutationFn: async ({ id, tipo }: { id: number; tipo: "pagamento" | "comissao" }) => {
      const endpoint = tipo === "pagamento"
        ? `/api/propostas/pagamentos/${id}`
        : `/api/propostas/comissoes/${id}`;

      await apiRequest("DELETE", endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proposals'] });
      queryClient.invalidateQueries({ queryKey: [`/api/proposals/${propostaId}`] });
      
      toast({
        title: "Sucesso",
        description: "Pagamento excluído com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Falha ao excluir pagamento: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Handler para adicionar pagamento
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    adicionarPagamentoMutation.mutate();
  };
  
  // Handler para excluir pagamento
  const excluirPagamento = (id: number, tipo: "pagamento" | "comissao") => {
    if (window.confirm("Tem certeza que deseja excluir este pagamento?")) {
      excluirPagamentoMutation.mutate({ id, tipo });
    }
  };
  
  // Renderização de estados de carregamento e erro
  if (isLoading) {
    return (
      <div className="h-screen overflow-hidden bg-neutral-100">
        <NavigationHeader />
        <div className="h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="ml-2 text-neutral-600">Carregando dados...</p>
        </div>
      </div>
    );
  }
  
  if (error || !proposta) {
    return (
      <div className="h-screen overflow-hidden bg-neutral-100">
        <NavigationHeader />
        <div className="h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold text-red-600 mb-4">Erro ao carregar dados</h2>
            <p className="text-neutral-600 mb-4">{(error as Error)?.message || "Proposta não encontrada"}</p>
            <Link href="/propostas-cards">
              <Button>Voltar para Propostas</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  const pagamentosProposta = proposta.pagamentosProposta || [];
  const pagamentosComissao = proposta.pagamentosComissao || [];
  
  return (
    <div className="h-screen overflow-hidden bg-neutral-100">
      <NavigationHeader />
      <main className="h-[calc(100vh-64px)] overflow-auto">
        <div className="container mx-auto py-6 px-4 md:px-6">
          {/* Cabeçalho */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Link href="/propostas-cards">
                <Button variant="ghost" size="icon" className="h-8 w-8 mr-1">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Histórico de Pagamentos</h1>
            </div>
            <p className="text-neutral-500">Proposta: {proposta.proposta}</p>
          </div>
          
          {/* Card com informações resumidas da proposta */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle>Resumo da Proposta</CardTitle>
              <CardDescription>Valores e status da proposta</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-neutral-500">Valor Total</p>
                  <p className="text-lg font-semibold">{formatCurrency(Number(proposta.valorTotal))}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">Valor Pago</p>
                  <p className="text-lg font-semibold">{formatCurrency(Number(proposta.valorPago))}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">Saldo em Aberto</p>
                  <p className="text-lg font-semibold">{formatCurrency(Number(proposta.saldoAberto))}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">Comissão Total</p>
                  <p className="text-lg font-semibold">{formatCurrency(Number(proposta.valorComissaoTotal))}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">Comissão Paga</p>
                  <p className="text-lg font-semibold">{formatCurrency(Number(proposta.valorComissaoPaga))}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">Comissão em Aberto</p>
                  <p className="text-lg font-semibold">{formatCurrency(Number(proposta.valorComissaoEmAberto))}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Tabs para pagamentos e comissões */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-4">
              <TabsTrigger value="pagamentos">Pagamentos do Cliente</TabsTrigger>
              <TabsTrigger value="comissoes">Pagamentos de Comissão</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pagamentos" className="space-y-6">
              {/* Card para adicionar novo pagamento */}
              <Card>
                <CardHeader>
                  <CardTitle>Adicionar Pagamento</CardTitle>
                  <CardDescription>
                    Registre um novo pagamento do cliente para esta proposta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="valor">Valor do Pagamento</Label>
                        <Input
                          id="valor"
                          type="text"
                          placeholder="0,00"
                          value={novoValor}
                          onChange={(e) => setNovoValor(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="data">Data do Pagamento</Label>
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
                              locale={ptBR}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="observacao">Observação (opcional)</Label>
                      <Textarea
                        id="observacao"
                        placeholder="Digite uma observação sobre este pagamento"
                        value={novaObservacao}
                        onChange={(e) => setNovaObservacao(e.target.value)}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={adicionarPagamentoMutation.isPending || !novoValor || !novaData}
                    >
                      {adicionarPagamentoMutation.isPending ? (
                        <span className="flex items-center">
                          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></span>
                          Adicionando...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar Pagamento
                        </span>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
              
              {/* Tabela de histórico de pagamentos */}
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Pagamentos</CardTitle>
                  <CardDescription>
                    Todos os pagamentos recebidos do cliente para esta proposta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pagamentosProposta.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Observação</TableHead>
                            <TableHead className="w-[100px] text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pagamentosProposta.map((pagamento) => (
                            <TableRow key={pagamento.id}>
                              <TableCell>
                                {format(new Date(pagamento.dataPagamento), "dd/MM/yyyy")}
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(Number(pagamento.valor))}
                              </TableCell>
                              <TableCell>{pagamento.observacao || "-"}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => excluirPagamento(pagamento.id, "pagamento")}
                                  className="h-8"
                                >
                                  Excluir
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-neutral-500">Nenhum pagamento registrado</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="comissoes" className="space-y-6">
              {/* Card para adicionar nova comissão */}
              <Card>
                <CardHeader>
                  <CardTitle>Adicionar Pagamento de Comissão</CardTitle>
                  <CardDescription>
                    Registre um novo pagamento de comissão para esta proposta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="valorComissao">Valor da Comissão</Label>
                        <Input
                          id="valorComissao"
                          type="text"
                          placeholder="0,00"
                          value={novoValor}
                          onChange={(e) => setNovoValor(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dataComissao">Data do Pagamento</Label>
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
                              locale={ptBR}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="observacaoComissao">Observação (opcional)</Label>
                      <Textarea
                        id="observacaoComissao"
                        placeholder="Digite uma observação sobre este pagamento de comissão"
                        value={novaObservacao}
                        onChange={(e) => setNovaObservacao(e.target.value)}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={adicionarPagamentoMutation.isPending || !novoValor || !novaData}
                    >
                      {adicionarPagamentoMutation.isPending ? (
                        <span className="flex items-center">
                          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></span>
                          Adicionando...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar Pagamento de Comissão
                        </span>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
              
              {/* Tabela de histórico de pagamentos de comissão */}
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Pagamentos de Comissão</CardTitle>
                  <CardDescription>
                    Todos os pagamentos de comissão realizados para esta proposta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pagamentosComissao.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Observação</TableHead>
                            <TableHead className="w-[100px] text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pagamentosComissao.map((pagamento) => (
                            <TableRow key={pagamento.id}>
                              <TableCell>
                                {format(new Date(pagamento.dataPagamento), "dd/MM/yyyy")}
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(Number(pagamento.valor))}
                              </TableCell>
                              <TableCell>{pagamento.observacao || "-"}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => excluirPagamento(pagamento.id, "comissao")}
                                  className="h-8"
                                >
                                  Excluir
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-neutral-500">Nenhum pagamento de comissão registrado</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}