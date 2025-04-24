import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import NavigationHeader from "@/components/navigation-header";
import { BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Bar, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { Loader2 } from "lucide-react";
import type { ProposalWithCalculations } from "@shared/schema";
import { formatCurrency } from "@/lib/utils/format";

// Cores para gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function KPIs() {
  const [activeTab, setActiveTab] = useState("geral");
  
  // Buscar dados das propostas
  const { data: proposals, isLoading } = useQuery<ProposalWithCalculations[]>({
    queryKey: ['/api/proposals'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/proposals");
      return res.json();
    },
  });
  
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
    
    // Calculando propostas por mês (simplificado)
    const hoje = new Date();
    // Como não temos acesso ao createdAt, usamos 6 meses como padrão
    const mesesAtivos = 6;
    
    // Peso médio por mês
    const pesoTotal = proposals.reduce((sum, p) => sum + (Number(p.pesoEstrutura) || 0), 0);
    const pesoMedioPorMes = pesoTotal / mesesAtivos;
    
    // Tempo médio de negociação
    const tempoNegociacaoTotal = proposals.reduce((sum, p) => sum + (Number(p.tempoNegociacao) || 0), 0);
    const tempoMedioNegociacao = tempoNegociacaoTotal / totalPropostas;
    
    // Propostas com recompra
    const propostasComRecompra = proposals.filter(p => p.clienteRecompra === "sim").length;
    const percentRecompra = (propostasComRecompra / totalPropostas) * 100;
    
    // Contando clientes com mais de uma proposta
    const propostasPorCliente = proposals.reduce((acc, p) => {
      if (p.nomeCliente) {
        acc[p.nomeCliente] = (acc[p.nomeCliente] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const clientesComRecompra = Object.values(propostasPorCliente).filter(count => count > 1).length;
    
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
                      <CardTitle className="text-base font-medium">Clientes Atendidos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{kpisGerais.clientesUnicos}</p>
                      <p className="text-xs text-gray-500">Total de clientes únicos</p>
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
                
                {/* KPIs de Recompra */}
                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-4">KPIs de Recompra</h2>
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
                
                {/* KPIs de Performance */}
                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-4">KPIs de Performance e Impacto</h2>
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
                        <CardTitle className="text-base">Receita por Tipo de Cliente</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={kpisGerais.percentPorTipoCliente}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
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
            {kpisPorProjeto ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="col-span-1">
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
                
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>KPIs por Tipo de Projeto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>% com projeto executivo (PE)</span>
                        <span className="font-medium">{kpisPorProjeto.pe.toFixed(1)}%</span>
                      </div>
                      <div className="relative pt-1">
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                          <div style={{ width: `${kpisPorProjeto.pe}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>% com PE + PC</span>
                        <span className="font-medium">{kpisPorProjeto.pePc.toFixed(1)}%</span>
                      </div>
                      <div className="relative pt-1">
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                          <div style={{ width: `${kpisPorProjeto.pePc}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>% sem projeto</span>
                        <span className="font-medium">{kpisPorProjeto.semProjeto.toFixed(1)}%</span>
                      </div>
                      <div className="relative pt-1">
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                          <div style={{ width: `${kpisPorProjeto.semProjeto}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-orange-500"></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">Sem dados suficientes para análise de projetos</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}