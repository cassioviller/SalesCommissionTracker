import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, History, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ProposalWithCalculations, PagamentoProposta, PagamentoComissao } from "@shared/schema";

export default function PaymentButtonModal({ proposal }: { proposal: ProposalWithCalculations }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pagamentos");

  const [novoValor, setNovoValor] = useState("");
  const [novaData, setNovaData] = useState<Date | undefined>(new Date());
  const [novaObservacao, setNovaObservacao] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const queryClient = useQueryClient();

  // Carregar os dados da proposta
  const { data: proposalDetails } = useQuery({
    queryKey: ['/api/proposals', proposal.id],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/proposals/${proposal.id}`);
      return res.json();
    },
    enabled: isOpen, // Só carrega quando o modal está aberto
  });

  const adicionarPagamentoMutation = useMutation({
    mutationFn: async () => {
      if (!proposal.id || !novoValor || !novaData) {
        throw new Error("Preencha todos os campos obrigatórios");
      }

      const valorNumerico = parseFloat(novoValor.replace(",", "."));
      if (isNaN(valorNumerico) || valorNumerico <= 0) {
        throw new Error("Valor inválido");
      }

      const endpoint = activeTab === "pagamentos" 
        ? `/api/propostas/${proposal.id}/pagamentos`
        : `/api/propostas/${proposal.id}/comissoes`;

      const response = await apiRequest("POST", endpoint, {
        valor: valorNumerico,
        dataPagamento: format(novaData, "yyyy-MM-dd"),
        observacao: novaObservacao
      });

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proposals'] });
      queryClient.invalidateQueries({ queryKey: [`/api/proposals/${proposal.id}`] });
      
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

  const excluirPagamentoMutation = useMutation({
    mutationFn: async ({ id, tipo }: { id: number; tipo: "pagamento" | "comissao" }) => {
      const endpoint = tipo === "pagamento"
        ? `/api/propostas/pagamentos/${id}`
        : `/api/propostas/comissoes/${id}`;

      await apiRequest("DELETE", endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proposals'] });
      queryClient.invalidateQueries({ queryKey: [`/api/proposals/${proposal.id}`] });
      
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    adicionarPagamentoMutation.mutate();
  };

  const excluirPagamento = (id: number, tipo: "pagamento" | "comissao") => {
    if (window.confirm("Tem certeza que deseja excluir este pagamento?")) {
      excluirPagamentoMutation.mutate({ id, tipo });
    }
  };

  // Arrays de pagamentos
  const pagamentosProposta = proposalDetails?.pagamentosProposta || [];
  const pagamentosComissao = proposalDetails?.pagamentosComissao || [];

  return (
    <>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => {
          console.log("Abrindo modal para proposta:", proposal.id);
          setIsOpen(true);
        }}
      >
        <History className="h-4 w-4 mr-1" />
        Pagamentos
      </Button>

      <Dialog 
        open={isOpen} 
        onOpenChange={(open) => {
          console.log("Dialog onOpenChange:", open);
          setIsOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Histórico de Pagamentos</DialogTitle>
            <DialogDescription>
              Proposta: {proposal.proposta}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pagamentos">Pagamentos da Proposta</TabsTrigger>
              <TabsTrigger value="comissoes">Pagamentos de Comissão</TabsTrigger>
            </TabsList>

            <TabsContent value="pagamentos" className="space-y-4">
              <div className="overflow-y-auto max-h-[300px]">
                {pagamentosProposta.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Observação</TableHead>
                        <TableHead className="w-[60px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagamentosProposta.map((pagamento: PagamentoProposta) => (
                        <TableRow key={pagamento.id}>
                          <TableCell>
                            {format(new Date(pagamento.dataPagamento), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell>
                            {Number(pagamento.valor).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            })}
                          </TableCell>
                          <TableCell>{pagamento.observacao || "-"}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => excluirPagamento(pagamento.id, "pagamento")}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhum pagamento registrado
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor</Label>
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
                    <Label htmlFor="data">Data</Label>
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
                    placeholder="Digite uma observação"
                    value={novaObservacao}
                    onChange={(e) => setNovaObservacao(e.target.value)}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={!novoValor || !novaData || adicionarPagamentoMutation.isPending}
                >
                  {adicionarPagamentoMutation.isPending ? "Adicionando..." : "Adicionar Pagamento"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="comissoes" className="space-y-4">
              <div className="overflow-y-auto max-h-[300px]">
                {pagamentosComissao.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Observação</TableHead>
                        <TableHead className="w-[60px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagamentosComissao.map((pagamento: PagamentoComissao) => (
                        <TableRow key={pagamento.id}>
                          <TableCell>
                            {format(new Date(pagamento.dataPagamento), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell>
                            {Number(pagamento.valor).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            })}
                          </TableCell>
                          <TableCell>{pagamento.observacao || "-"}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => excluirPagamento(pagamento.id, "comissao")}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhum pagamento de comissão registrado
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valorComissao">Valor</Label>
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
                    <Label htmlFor="dataComissao">Data</Label>
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
                    placeholder="Digite uma observação"
                    value={novaObservacao}
                    onChange={(e) => setNovaObservacao(e.target.value)}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={!novoValor || !novaData || adicionarPagamentoMutation.isPending}
                >
                  {adicionarPagamentoMutation.isPending ? "Adicionando..." : "Adicionar Pagamento de Comissão"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}