import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { CalendarIcon, ArrowLeft, Trash2, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  InsertProposal,
  SalesProposal,
  TIPOS_CLIENTE,
  TIPOS_CONTRATO,
  TIPOS_PROJETO,
  TIPOS_SERVICO,
  insertProposalSchema
} from "@shared/schema";
import { Link, useLocation } from "wouter";
import ServiceSelector from "./service-selector";

// Estendendo o schema para validação de formulário
const formSchema = insertProposalSchema.extend({
  // Campo customizado caso precise de validações específicas para o formulário
  // Ex: proposta: z.string().min(1, "Número da proposta é obrigatório"),
});

type Props = {
  editMode?: boolean;
  proposal?: SalesProposal;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function AddEditProposalForm({ editMode = false, proposal, onSuccess, onCancel }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [_, navigate] = useLocation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Estado para controlar se os campos de comissão estão habilitados
  const [comissaoHabilitada, setComissaoHabilitada] = useState<boolean>(
    editMode ? (proposal?.percentComissao ? Number(proposal.percentComissao) > 0 : false) : false
  );
  
  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: editMode ? {
      proposta: proposal?.proposta || "",
      valorTotal: String(proposal?.valorTotal || ""),
      valorPago: String(proposal?.valorPago || ""),
      percentComissao: String(proposal?.percentComissao || ""),
      valorComissaoPaga: String(proposal?.valorComissaoPaga || ""),
      nomeCliente: proposal?.nomeCliente || "",
      tipoCliente: proposal?.tipoCliente as any || undefined,
      tiposServico: proposal?.tiposServico as any || [],
      dataProposta: proposal?.dataProposta ? proposal.dataProposta.toString() : undefined,
      tipoProjeto: proposal?.tipoProjeto as any || undefined,
      tipoContrato: proposal?.tipoContrato as any || undefined,
      pesoEstrutura: proposal?.pesoEstrutura ? String(proposal.pesoEstrutura) : "",
      valorPorQuilo: proposal?.valorPorQuilo ? String(proposal.valorPorQuilo) : "",
      valorTotalMaterial: proposal?.valorTotalMaterial ? String(proposal.valorTotalMaterial) : "",
      recomendacaoDireta: proposal?.recomendacaoDireta as "sim" | "nao" || "nao",
      faturamentoDireto: proposal?.faturamentoDireto as "sim" | "nao" || "nao",
      tempoNegociacao: proposal?.tempoNegociacao ? String(proposal.tempoNegociacao) : "",
      clienteRecompra: proposal?.clienteRecompra as "sim" | "nao" || "nao",
    } : {
      proposta: "",
      valorTotal: "",
      valorPago: "0",
      percentComissao: "",
      valorComissaoPaga: "0",
      tiposServico: [],
      recomendacaoDireta: "nao",
      faturamentoDireto: "nao",
      clienteRecompra: "nao",
    },
  });
  
  // Estado para data e serviços selecionados  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    proposal?.dataProposta ? new Date(proposal.dataProposta) : undefined
  );
  const [selectedServices, setSelectedServices] = useState<(typeof TIPOS_SERVICO)[number][]>(
    (proposal?.tiposServico as (typeof TIPOS_SERVICO)[number][]) || []
  );
  
  // Atualizar o formulário quando a proposta mudar (importante para edições)
  useEffect(() => {
    if (editMode && proposal) {
      console.log("Atualizando formulário com proposta:", proposal);
      
      // Reset do formulário com os dados novos
      form.reset({
        proposta: proposal.proposta || "",
        valorTotal: String(proposal.valorTotal || ""),
        valorPago: String(proposal.valorPago || ""),
        percentComissao: String(proposal.percentComissao || ""),
        valorComissaoPaga: String(proposal.valorComissaoPaga || ""),
        nomeCliente: proposal.nomeCliente || "",
        tipoCliente: proposal.tipoCliente as any || undefined,
        tiposServico: proposal.tiposServico as any || [],
        dataProposta: proposal.dataProposta ? proposal.dataProposta.toString() : undefined,
        tipoProjeto: proposal.tipoProjeto as any || undefined,
        tipoContrato: proposal.tipoContrato as any || undefined,
        pesoEstrutura: proposal.pesoEstrutura ? String(proposal.pesoEstrutura) : "",
        valorPorQuilo: proposal.valorPorQuilo ? String(proposal.valorPorQuilo) : "",
        valorTotalMaterial: proposal.valorTotalMaterial ? String(proposal.valorTotalMaterial) : "",
        recomendacaoDireta: proposal.recomendacaoDireta as "sim" | "nao" || "nao",
        faturamentoDireto: proposal.faturamentoDireto as "sim" | "nao" || "nao",
        tempoNegociacao: proposal.tempoNegociacao ? String(proposal.tempoNegociacao) : "",
        clienteRecompra: proposal.clienteRecompra as "sim" | "nao" || "nao",
      });
      
      // Atualizar estados derivados
      setSelectedDate(proposal.dataProposta ? new Date(proposal.dataProposta) : undefined);
      setSelectedServices((proposal.tiposServico as (typeof TIPOS_SERVICO)[number][]) || []);
    }
  }, [proposal, editMode, form]);

  const { watch } = form;
  
  // Observar valores para cálculos em tempo real
  const watchValorTotal = watch("valorTotal");
  const watchPercentComissao = watch("percentComissao");
  const watchValorPago = watch("valorPago");
  const watchValorComissaoPaga = watch("valorComissaoPaga");

  // Cálculos em tempo real
  const valorTotalNum = Number(watchValorTotal) || 0;
  const percentComissaoNum = Number(watchPercentComissao) || 0;
  const valorComissaoTotal = valorTotalNum * (percentComissaoNum / 100);
  const saldoAberto = valorTotalNum - (Number(watchValorPago) || 0);
  const valorComissaoEmAberto = valorComissaoTotal - (Number(watchValorComissaoPaga) || 0);
  const percentComissaoPaga = valorComissaoTotal > 0 
    ? (Number(watchValorComissaoPaga || 0) / valorComissaoTotal) * 100
    : 0;
    
  // Cálculo de valor total de material é agora feito diretamente no ServiceSelector

  // Mutation para criar/editar proposta
  const mutation = useMutation({
    mutationFn: async (data: InsertProposal) => {
      const url = editMode ? `/api/proposals/${proposal?.id}` : "/api/proposals";
      const method = editMode ? "PATCH" : "POST";
      const res = await apiRequest(method, url, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: editMode ? "Proposta atualizada" : "Proposta criada",
        description: editMode 
          ? "A proposta foi atualizada com sucesso" 
          : "A nova proposta foi criada com sucesso",
      });
      
      // Invalidar cache para atualizar lista
      queryClient.invalidateQueries({ queryKey: ['/api/proposals'] });
      
      // Callback de sucesso ou navegação
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/propostas");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Não foi possível ${editMode ? "atualizar" : "criar"} a proposta: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Mutation para excluir proposta
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!proposal?.id) {
        throw new Error("ID da proposta não encontrado");
      }
      
      await apiRequest("DELETE", `/api/proposals/${proposal.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Proposta excluída",
        description: "A proposta foi excluída com sucesso",
      });
      
      // Invalidar cache para atualizar lista
      queryClient.invalidateQueries({ queryKey: ['/api/proposals'] });
      
      // Navegar de volta para a lista de propostas
      navigate("/propostas");
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Não foi possível excluir a proposta: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Função para manipular serviços removida, agora tratada pelo componente ServiceSelector

  // Atualizar o form quando a data for selecionada
  useEffect(() => {
    if (selectedDate) {
      form.setValue('dataProposta', format(selectedDate, 'yyyy-MM-dd'));
    }
  }, [selectedDate, form]);

  // Atualizar o form quando os serviços forem selecionados
  useEffect(() => {
    form.setValue('tiposServico', selectedServices);
  }, [selectedServices, form]);

  // Submit form
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    // Processar os dados para garantir que campos numéricos vazios sejam enviados como "0"
    const processedData = Object.entries(data).reduce((acc: any, [key, value]) => {
      // Se for um campo numérico e estiver vazio, substitua por "0"
      if (
        ['valorTotal', 'valorPago', 'percentComissao', 'valorComissaoPaga', 
         'pesoEstrutura', 'valorPorQuilo', 'valorTotalMaterial', 'tempoNegociacao'].includes(key) && 
        (value === "" || value === undefined || value === null)
      ) {
        acc[key] = "0";
      } else {
        acc[key] = value;
      }
      return acc;
    }, {});

    // Precisamos manter os dados no formato correto para cada modo
    const dataToSend = { ...processedData };
    
    // Lista de campos numéricos
    const numericFields = [
      'valorTotal', 'valorPago', 'percentComissao', 'valorComissaoPaga', 
      'pesoEstrutura', 'valorPorQuilo', 'valorTotalMaterial', 'tempoNegociacao'
    ];
    
    // Se estiver no modo de edição, converte para numbers
    // Se estiver criando, garante que sejam strings
    if (editMode) {
      // Para edição, convertemos todos os campos numéricos para number
      numericFields.forEach(field => {
        if (field in dataToSend) {
          dataToSend[field] = Number(dataToSend[field]);
        }
      });
    } else {
      // Para criação, garantimos que todos os campos numéricos sejam strings
      numericFields.forEach(field => {
        if (field in dataToSend) {
          // Se já for string, mantém. Se for number, converte para string
          if (typeof dataToSend[field] === 'number') {
            dataToSend[field] = String(dataToSend[field]);
          }
        }
      });
    }
    
    // Converter para o formato esperado pela API
    const formattedData: any = {
      ...dataToSend,
      tiposServico: selectedServices,
      comissaoHabilitada: comissaoHabilitada ? "true" : "false" // Enviar como string conforme esperado pelo schema
    };
    
    console.log("Enviando dados para API:", formattedData);
    mutation.mutate(formattedData);
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (onCancel) {
                  onCancel();
                } else {
                  navigate("/propostas");
                }
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <CardTitle>{editMode ? "Editar Proposta" : "Nova Proposta"}</CardTitle>
          </div>
          
          {/* Botões de ação (apenas no modo de edição) */}
          {editMode && (
            <div className="flex flex-col gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Excluir Proposta
              </Button>
              <Link href={`/pagamentos-proposta/${proposal?.id}`}>
                <Button
                  variant="default"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 w-full"
                >
                  <Receipt className="h-4 w-4 mr-1" />
                  Pagamentos
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardHeader>
      
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {/* Seção de dados básicos */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Informações Básicas</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="proposta">Número da Proposta</Label>
                <Input
                  id="proposta"
                  placeholder="Ex: P2023-001"
                  {...form.register("proposta")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nomeCliente">Nome do Cliente</Label>
                <Input
                  id="nomeCliente"
                  placeholder="Nome do cliente"
                  {...form.register("nomeCliente")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipoCliente">Tipo de Cliente</Label>
                <Select
                  onValueChange={(value) => form.setValue("tipoCliente", value as any)}
                  defaultValue={form.getValues("tipoCliente")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_CLIENTE.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data da Proposta</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        format(selectedDate, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Tipos de Serviço */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Tipos de Serviço e Materiais</h2>
            <ServiceSelector
              initialServices={selectedServices}
              initialMaterialValue={form.getValues("valorTotalMaterial")}
              onChange={(services, valorTotalMaterial) => {
                setSelectedServices(services);
                form.setValue("valorTotalMaterial", valorTotalMaterial.toString());
              }}
            />
          </div>

          {/* Detalhes do Projeto */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Detalhes do Projeto</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipoProjeto">Tipo de Projeto</Label>
                <Select
                  onValueChange={(value) => form.setValue("tipoProjeto", value as any)}
                  defaultValue={form.getValues("tipoProjeto")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_PROJETO.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoContrato">Tipo de Contrato</Label>
                <Select
                  onValueChange={(value) => form.setValue("tipoContrato", value as any)}
                  defaultValue={form.getValues("tipoContrato")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de contrato" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_CONTRATO.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Os valores de peso e material são agora gerenciados pelo ServiceSelector */}
            <div className="hidden">
              <input
                id="pesoEstrutura"
                type="hidden"
                {...form.register("pesoEstrutura")}
              />
              <input
                id="valorPorQuilo"
                type="hidden"
                {...form.register("valorPorQuilo")}
              />
              <input
                id="valorTotalMaterial"
                type="hidden"
                {...form.register("valorTotalMaterial")}
              />
            </div>
          </div>

          {/* Valores e Comissões */}
          <div className="space-y-4">
            <div className="flex flex-row items-center justify-between">
              <h2 className="text-lg font-medium">Valores e Comissões</h2>
              <div className="flex items-center space-x-2">
                <Label htmlFor="comissaoSwitch" className="text-sm font-medium">
                  {comissaoHabilitada ? "Comissão habilitada" : "Comissão desabilitada"}
                </Label>
                <Switch
                  id="comissaoSwitch"
                  checked={comissaoHabilitada}
                  onCheckedChange={(checked) => {
                    setComissaoHabilitada(checked);
                    if (!checked) {
                      form.setValue("percentComissao", "0");
                      form.setValue("valorComissaoPaga", "0");
                    }
                  }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valorTotal">Valor Total da Proposta (R$)</Label>
                <Input
                  id="valorTotal"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  {...form.register("valorTotal")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valorPago">Valor Pago pelo Cliente (R$)</Label>
                <Input
                  id="valorPago"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  disabled
                  title="Este valor só pode ser editado no Histórico de Pagamentos"
                  className="bg-gray-50"
                  {...form.register("valorPago")}
                />
                <p className="text-xs text-neutral-500 italic">Valor editável apenas no histórico de pagamentos</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="percentComissao">Percentual de Comissão (%)</Label>
                <Input
                  id="percentComissao"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="0.00"
                  disabled={!comissaoHabilitada}
                  className={!comissaoHabilitada ? "bg-gray-50" : ""}
                  {...form.register("percentComissao")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valorComissaoPaga">Valor de Comissão Paga (R$)</Label>
                <Input
                  id="valorComissaoPaga"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  disabled
                  title="Este valor só pode ser editado no Histórico de Pagamentos"
                  className="bg-gray-50"
                  {...form.register("valorComissaoPaga")}
                />
                <p className="text-xs text-neutral-500 italic">Valor editável apenas no histórico de pagamentos</p>
              </div>
            </div>

            {/* Valores calculados */}
            <div className="bg-neutral-50 p-4 rounded-md space-y-3">
              <h3 className="text-sm font-medium text-neutral-700">Valores Calculados</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-neutral-500">Saldo Aberto</p>
                  <p className="font-medium">R$ {saldoAberto.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Valor Total da Comissão</p>
                  <p className="font-medium">R$ {valorComissaoTotal.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Comissão em Aberto</p>
                  <p className="font-medium">R$ {valorComissaoEmAberto.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">% Comissão Paga</p>
                  <p className="font-medium">{percentComissaoPaga.toFixed(2)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Informações Adicionais</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tempoNegociacao">Tempo de Negociação (dias)</Label>
                <Input
                  id="tempoNegociacao"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...form.register("tempoNegociacao")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label>Recomendação Direta</Label>
                <RadioGroup
                  defaultValue={form.getValues("recomendacaoDireta") || "nao"}
                  onValueChange={(value) => form.setValue("recomendacaoDireta", value as "sim" | "nao")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="recomendacao-sim" />
                    <Label htmlFor="recomendacao-sim" className="font-normal">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="recomendacao-nao" />
                    <Label htmlFor="recomendacao-nao" className="font-normal">Não</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Faturamento Direto</Label>
                <RadioGroup
                  defaultValue={form.getValues("faturamentoDireto") || "nao"}
                  onValueChange={(value) => form.setValue("faturamentoDireto", value as "sim" | "nao")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="faturamento-sim" />
                    <Label htmlFor="faturamento-sim" className="font-normal">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="faturamento-nao" />
                    <Label htmlFor="faturamento-nao" className="font-normal">Não</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Cliente de Recompra</Label>
                <RadioGroup
                  defaultValue={form.getValues("clienteRecompra") || "nao"}
                  onValueChange={(value) => form.setValue("clienteRecompra", value as "sim" | "nao")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="recompra-sim" />
                    <Label htmlFor="recompra-sim" className="font-normal">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="recompra-nao" />
                    <Label htmlFor="recompra-nao" className="font-normal">Não</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-6">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => {
              if (onCancel) {
                onCancel();
              } else {
                navigate("/propostas");
              }
            }}
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending 
              ? "Salvando..." 
              : editMode ? "Atualizar Proposta" : "Salvar Proposta"
            }
          </Button>
        </CardFooter>
      </form>
      
      {/* Diálogo de confirmação para excluir proposta */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a proposta {proposal?.proposta}? 
              Esta ação não pode ser desfeita e todos os registros de pagamentos 
              associados a esta proposta serão excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}