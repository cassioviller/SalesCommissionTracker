import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import NavigationHeader from "@/components/navigation-header";
import { BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Bar, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from "recharts";
import { Loader2 } from "lucide-react";
import type { ProposalWithCalculations } from "@shared/schema";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

// Cores para os gráficos
const COLORS = [
  "#8884d8", "#83a6ed", "#8dd1e1", "#82ca9d", "#a4de6c", 
  "#d0ed57", "#ffc658", "#ff8042", "#ff5151", "#7c1fff",
  "#50C878", "#9370DB", "#5F9EA0", "#FF7F50", "#6495ED"
];

export default function KPIs() {
  const [activeTab, setActiveTab] = useState("geral");
  const [propostasEmitidas, setPropostasEmitidas] = useState<number>(0);
  const [dataInicio, setDataInicio] = useState<Date | undefined>(undefined);
  const [dataFim, setDataFim] = useState<Date | undefined>(undefined);
  
  // Handler para mudança no número de propostas emitidas
  const handlePropostasEmitidasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    const newValue = isNaN(value) ? 0 : value;
    setPropostasEmitidas(newValue);
    
    // Salvar no localStorage para persistir entre navegações
    localStorage.setItem('propostasEmitidas', newValue.toString());
  };
  
  // Carregar valor salvo do localStorage ao montar o componente
  useEffect(() => {
    const savedValue = localStorage.getItem('propostasEmitidas');
    if (savedValue) {
      setPropostasEmitidas(parseInt(savedValue));
    }
  }, []);

  // Limpar filtros de data
  const limparFiltros = () => {
    setDataInicio(undefined);
    setDataFim(undefined);
  };
  
  // Buscar dados das propostas
  const { data: allProposals = [], isLoading } = useQuery<ProposalWithCalculations[]>({
    queryKey: ['/api/proposals'],
  });

  // Filtrar propostas por período se as datas estiverem definidas
  const proposals = useMemo(() => {
    if (!allProposals.length) return [];
    
    // Se nenhuma data for selecionada, retorna todas as propostas
    if (!dataInicio && !dataFim) return allProposals;
    
    return allProposals.filter(proposta => {
      // Se a proposta não tem data, não podemos filtrar
      if (!proposta.dataProposta) return false;
      
      const dataPropostaObj = new Date(proposta.dataProposta);
      
      // Verificar se a data da proposta está dentro do intervalo selecionado
      const passaDataInicio = !dataInicio || dataPropostaObj >= dataInicio;
      const passaDataFim = !dataFim || dataPropostaObj <= dataFim;
      
      return passaDataInicio && passaDataFim;
    });
  }, [allProposals, dataInicio, dataFim]);
  
  // KPIs Gerais
  const kpisGerais = useMemo(() => {
    if (!proposals || proposals.length === 0) return null;
    
    const totalPropostas = proposals.length;
    const valorTotalPropostas = proposals.reduce((sum, p) => sum + Number(p.valorTotal), 0);
    const ticketMedio = valorTotalPropostas / totalPropostas;
    const totalPago = proposals.reduce((sum, p) => sum + Number(p.valorPago), 0);
    const totalEmAberto = valorTotalPropostas - totalPago;
    
    // Contagem de clientes únicos
    const clientesUnicos = new Set(proposals.map(p => p.nomeCliente).filter(Boolean)).size;
    
    // Filtrar propostas com data válida para calcular intervalo de tempo
    const propostasComData = proposals.filter(p => p.dataProposta);
    
    // Calculando intervalo de tempo entre a proposta mais antiga e a mais recente
    let mesesAtivos = 6; // Valor padrão como fallback
    
    if (propostasComData.length > 0) {
      // Converter strings de data para objetos Date
      const datas = propostasComData.map(p => new Date(p.dataProposta as string));
      
      // Encontrar a data mais antiga e a mais recente
      const dataInicial = new Date(Math.min(...datas.map(d => d.getTime())));
      const dataFinal = new Date(Math.max(...datas.map(d => d.getTime())));
      
      // Calcular a diferença em meses
      const mesesDiferenca = 
        (dataFinal.getFullYear() - dataInicial.getFullYear()) * 12 + 
        (dataFinal.getMonth() - dataInicial.getMonth()) + 1; // +1 para incluir o mês atual
      
      // Usar pelo menos 1 mês para evitar divisão por zero
      mesesAtivos = Math.max(1, mesesDiferenca);
    }
    
    // Peso médio por mês com base no intervalo real e na soma dos itens com unidade "kg"
    // Se temos detalhes de serviço, usamos eles para cálculos mais precisos
    let pesoTotal = 0;
    
    for (const p of proposals) {
      if (p.detalhesServicos && p.detalhesServicos.length > 0) {
        // Soma apenas os serviços com unidade "kg"
        const pesoServicos = p.detalhesServicos
          .filter(s => s.unidade === 'kg')
          .reduce((sum, s) => sum + s.quantidade, 0);
          
        pesoTotal += pesoServicos;
      } else if (p.pesoEstrutura) {
        // Fallback para o campo pesoEstrutura se não houver detalhes
        pesoTotal += Number(p.pesoEstrutura);
      }
    }
    
    const pesoMedioPorMes = pesoTotal / mesesAtivos;
    
    // Tempo médio de negociação
    const tempoNegociacaoTotal = proposals.reduce((sum, p) => sum + (Number(p.tempoNegociacao) || 0), 0);
    const tempoMedioNegociacao = tempoNegociacaoTotal / totalPropostas;
    
    // Propostas com recompra
    const propostasComRecompra = proposals.filter(p => p.clienteRecompra === "sim").length;
    const percentRecompra = (propostasComRecompra / totalPropostas) * 100;
    
    // Contando clientes com recompra - usando o campo clienteRecompra
    const clientesComRecompra = proposals.filter(p => p.clienteRecompra === "sim").length;
    
    // Top 10 vendas
    const propostasOrdenadas = [...proposals].sort((a, b) => Number(b.valorTotal) - Number(a.valorTotal));
    const top10Vendas = propostasOrdenadas.slice(0, 10);
    const valorTop10 = top10Vendas.reduce((sum, p) => sum + Number(p.valorTotal), 0);
    const percentTop10 = (valorTop10 / valorTotalPropostas) * 100;
    
    // Receita por tipo de cliente
    const receitaPorTipoCliente = proposals.reduce((acc, p) => {
      const tipo = p.tipoCliente || "Não especificado";
      acc[tipo] = (acc[tipo] || 0) + Number(p.valorTotal);
      return acc;
    }, {} as Record<string, number>);
    
    // Porcentagem por tipo de cliente
    const percentPorTipoCliente = Object.entries(receitaPorTipoCliente).map(([tipo, valor]) => ({
      tipo,
      valor,
      percentual: (valor / valorTotalPropostas) * 100
    }));
    
    return {
      totalPropostas,
      valorTotalPropostas,
      ticketMedio,
      totalPago,
      totalEmAberto,
      clientesUnicos,
      pesoMedioPorMes,
      tempoMedioNegociacao,
      percentRecompra,
      clientesComRecompra,
      percentTop10,
      percentPorTipoCliente
    };
  }, [proposals]);
  
  // KPIs de Taxa de Conversão
  const kpisTaxaConversao = useMemo(() => {
    if (!proposals || proposals.length === 0 || propostasEmitidas <= 0) return null;
    
    const totalPropostasFechadas = proposals.length;
    const taxaConversao = (totalPropostasFechadas / propostasEmitidas) * 100;
    
    return {
      totalPropostasFechadas,
      propostasEmitidas,
      taxaConversao
    };
  }, [proposals, propostasEmitidas]);
  
  // KPIs por Tipo de Projeto
  const kpisPorProjeto = useMemo(() => {
    if (!proposals || proposals.length === 0) return null;
    
    const totalPropostas = proposals.length;
    const projetosCount = proposals.reduce((acc, p) => {
      const tipo = p.tipoProjeto || "Não especificado";
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const percentPorProjeto = Object.entries(projetosCount).map(([tipo, count]) => ({
      tipo,
      count,
      percentual: (count / totalPropostas) * 100
    }));
    
    // Porcentagens específicas
    const pe = percentPorProjeto.find(p => p.tipo === "PE")?.percentual || 0;
    const pePc = percentPorProjeto.find(p => p.tipo === "PE + PC")?.percentual || 0;
    const semProjeto = percentPorProjeto.find(p => p.tipo === "Nenhum" || p.tipo === "Não especificado")?.percentual || 0;
    
    return {
      percentPorProjeto,
      pe,
      pePc,
      semProjeto
    };
  }, [proposals]);
  
  // KPIs por Tipo de Serviço
  const kpisPorServico = useMemo(() => {
    if (!proposals || proposals.length === 0) return null;
    
    // Contagem de serviços
    const servicosCount: Record<string, number> = {};
    
    // Para cada proposta, iterar sobre os serviços e contá-los
    proposals.forEach(proposta => {
      if (proposta.tiposServico && Array.isArray(proposta.tiposServico)) {
        proposta.tiposServico.forEach(servico => {
          servicosCount[servico] = (servicosCount[servico] || 0) + 1;
        });
      }
    });
    
    // Converter para array para ordenar por quantidade
    const servicosData = Object.entries(servicosCount)
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);
    
    return {
      servicosData
    };
  }, [proposals]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-100">
        <NavigationHeader />
        <div className="h-[calc(100vh-64px)] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando dados...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-neutral-100">
      <NavigationHeader />
      
      <main className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">KPIs - Indicadores de Desempenho</h1>
          <p className="text-gray-500">Análise detalhada das métricas de negócio</p>
        </div>
        
        {/* Filtro de período */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-medium mb-2">Filtrar por período</h3>
              <div className="flex flex-wrap gap-2">
                <div className="flex-1">
                  <Label htmlFor="dataInicio" className="text-xs mb-1 block">Data Início</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="dataInicio"
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal h-9"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataInicio ? (
                          format(dataInicio, "dd/MM/yyyy")
                        ) : (
                          <span className="text-muted-foreground">Selecionar</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dataInicio}
                        onSelect={setDataInicio}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="flex-1">
                  <Label htmlFor="dataFim" className="text-xs mb-1 block">Data Fim</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="dataFim"
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal h-9"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataFim ? (
                          format(dataFim, "dd/MM/yyyy")
                        ) : (
                          <span className="text-muted-foreground">Selecionar</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dataFim}
                        onSelect={setDataFim}
                        initialFocus
                        locale={ptBR}
                        disabled={(date) => dataInicio ? date < dataInicio : false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="flex items-end">
                  <Button variant="outline" size="sm" onClick={limparFiltros} className="h-9">
                    Limpar filtros
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex-none text-sm">
              {dataInicio || dataFim ? (
                <div className="p-2 bg-blue-50 rounded border border-blue-100">
                  <p className="font-medium">Mostrando {proposals.length} propostas</p>
                  <p className="text-xs text-gray-500">
                    Período: {dataInicio ? format(dataInicio, "dd/MM/yyyy") : "Início"} 
                    {' - '} 
                    {dataFim ? format(dataFim, "dd/MM/yyyy") : "Hoje"}
                  </p>
                </div>
              ) : (
                <div className="p-2 bg-gray-50 rounded border border-gray-100">
                  <p className="font-medium">Mostrando todas as propostas</p>
                  <p className="text-xs text-gray-500">Total: {proposals.length} propostas</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="geral" onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 grid grid-cols-3 max-w-md">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="canal">Canal de Venda</TabsTrigger>
            <TabsTrigger value="projeto">Tipo de Projeto</TabsTrigger>
          </TabsList>
          
          {/* Tab: KPIs Gerais */}
          <TabsContent value="geral" className="space-y-6">
            {kpisGerais ? (
              <>
                {/* Cards de KPIs Comerciais */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">Ticket Médio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{formatCurrency(kpisGerais.ticketMedio)}</p>
                      <p className="text-xs text-gray-500">Média do valor das propostas</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">Peso Médio/Mês</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{kpisGerais.pesoMedioPorMes.toFixed(2)} kg</p>
                      <p className="text-xs text-gray-500">Média mensal de peso das estruturas</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">Propostas Emitidas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          value={propostasEmitidas}
                          onChange={handlePropostasEmitidasChange}
                          className="w-24 h-9 text-lg"
                          min="0"
                        />
                        <p className="text-xs text-gray-500">Editar valor</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Propostas emitidas (total)</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">Propostas Fechadas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{kpisGerais.totalPropostas}</p>
                      <p className="text-xs text-gray-500">Total de propostas no sistema</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">Taxa de Conversão</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {propostasEmitidas > 0 
                          ? ((kpisGerais.totalPropostas / propostasEmitidas) * 100).toFixed(1) + '%' 
                          : 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">Propostas fechadas / emitidas</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">Total Faturado</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{formatCurrency(kpisGerais.valorTotalPropostas)}</p>
                      <p className="text-xs text-gray-500">Soma do valor de todas as propostas</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">Total Pago</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{formatCurrency(kpisGerais.totalPago)}</p>
                      <p className="text-xs text-gray-500">Valor já recebido dos clientes</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">Total em Aberto</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{formatCurrency(kpisGerais.totalEmAberto)}</p>
                      <p className="text-xs text-gray-500">Valor a receber</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">Tempo Médio Negociação</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{kpisGerais.tempoMedioNegociacao.toFixed(1)} dias</p>
                      <p className="text-xs text-gray-500">Média do tempo de fechamento</p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* KPIs de Recompra e Performance - sem subtítulos */}
                <div className="mt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Clientes com Recompra</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-2xl font-bold">{kpisGerais.clientesComRecompra}</p>
                            <p className="text-xs text-gray-500">Clientes com mais de uma proposta</p>
                          </div>
                          <div className="h-24 w-24">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={[
                                    { name: 'Com Recompra', value: kpisGerais.clientesComRecompra },
                                    { name: 'Sem Recompra', value: kpisGerais.clientesUnicos - kpisGerais.clientesComRecompra }
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={30}
                                  outerRadius={40}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  <Cell fill="#4F46E5" />
                                  <Cell fill="#E5E7EB" />
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Percentual de Recompra</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-2xl font-bold">{kpisGerais.percentRecompra.toFixed(1)}%</p>
                            <p className="text-xs text-gray-500">% de clientes que voltaram a comprar</p>
                          </div>
                          <div className="w-36 h-24">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={[
                                  { name: 'Recompra', valor: kpisGerais.percentRecompra },
                                  { name: 'Primeira Compra', valor: 100 - kpisGerais.percentRecompra }
                                ]}
                              >
                                <XAxis dataKey="name" tick={false} />
                                <Tooltip />
                                <Bar dataKey="valor" fill="#4F46E5" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                {/* KPIs de Performance - sem subtítulo */}
                <div className="mt-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Top 10 Vendas (%)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{kpisGerais.percentTop10.toFixed(1)}%</p>
                        <p className="text-xs text-gray-500 mb-4">Participação das 10 maiores vendas</p>
                        
                        <div className="relative pt-1">
                          <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                            <div
                              style={{ width: `${kpisGerais.percentTop10}%` }}
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                            ></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="col-span-1 lg:col-span-1 h-full">
                      <CardHeader>
                        <CardTitle className="text-base">Top 10 Vendas por Tipo de Cliente</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="mb-4 text-sm">
                          {kpisGerais.percentPorTipoCliente.length > 0 && (
                            <>
                              Top 10 vendas vieram{' '}
                              {kpisGerais.percentPorTipoCliente
                                .filter(item => item.tipo === 'Arquiteto' || item.tipo === 'Cliente Final')
                                .map(item => `${item.percentual.toFixed(1)}% de ${item.tipo.toLowerCase()}`)
                                .join(' e ')}
                            </>
                          )}
                        </p>
                        
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                              data={kpisGerais.percentPorTipoCliente} 
                              layout="vertical"
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <XAxis type="number" />
                              <YAxis dataKey="tipo" type="category" width={100} />
                              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                              <Legend />
                              <Bar dataKey="valor" fill="#8884d8" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">Sem dados suficientes para KPIs</p>
              </div>
            )}
          </TabsContent>
          
          {/* Tab: Canal de Venda */}
          <TabsContent value="canal">
            {kpisGerais ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de pizza Receita por Tipo de Cliente */}
                <Card className="col-span-1 lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Receita por Tipo de Cliente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={kpisGerais.percentPorTipoCliente}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="valor"
                            nameKey="tipo"
                            label={({ tipo, percentual }) => `${tipo}: ${percentual.toFixed(1)}%`}
                          >
                            {kpisGerais.percentPorTipoCliente.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Gráfico de barras Distribuição da Receita por Canal */}
                <Card className="col-span-1 lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Distribuição da Receita por Canal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={kpisGerais.percentPorTipoCliente}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <XAxis dataKey="tipo" />
                          <YAxis />
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Legend />
                          <Bar dataKey="valor" name="Valor Total" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="mt-6 space-y-2">
                      {kpisGerais.percentPorTipoCliente.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-3 h-3 mr-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                            <span>{item.tipo}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{item.percentual.toFixed(1)}%</p>
                            <p className="text-xs text-gray-500">{formatCurrency(item.valor)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">Sem dados suficientes para análise de canais</p>
              </div>
            )}
          </TabsContent>
          
          {/* Tab: Tipo de Projeto */}
          <TabsContent value="projeto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {kpisPorProjeto ? (
                <Card className="col-span-1 lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Distribuição por Tipo de Projeto</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={kpisPorProjeto.percentPorProjeto}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                            nameKey="tipo"
                            label={({ tipo, percentual }) => `${tipo}: ${percentual.toFixed(1)}%`}
                          >
                            {kpisPorProjeto.percentPorProjeto.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-10 col-span-1">
                  <p className="text-gray-500">Sem dados suficientes para análise de projetos</p>
                </div>
              )}
              
              {kpisPorServico ? (
                <Card className="col-span-1 lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Distribuição por Tipo de Serviço</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={kpisPorServico.servicosData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                          <XAxis 
                            dataKey="nome" 
                            angle={-45} 
                            textAnchor="end" 
                            tick={{ fontSize: 12 }}
                            height={60}
                          />
                          <YAxis 
                            tickCount={Math.max(...kpisPorServico.servicosData.map(s => s.quantidade)) + 1}
                            allowDecimals={false}
                          />
                          <Tooltip />
                          <Legend />
                          <Bar 
                            dataKey="quantidade" 
                            name="Quantidade"
                            barSize={40}
                          >
                            {kpisPorServico.servicosData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-10 col-span-1">
                  <p className="text-gray-500">Sem dados suficientes para análise de serviços</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}