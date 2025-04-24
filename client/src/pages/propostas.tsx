import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Filter, ChevronDown, Edit, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils/format";
import type { ProposalWithCalculations } from "@shared/schema";
import { Link, useLocation } from "wouter";
import NavigationHeader from "@/components/navigation-header";

export default function Propostas() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [, navigate] = useLocation();
  
  // Buscar dados das propostas
  const { data: proposals, isLoading, error } = useQuery<ProposalWithCalculations[]>({
    queryKey: ['/api/proposals'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/proposals");
      return res.json();
    },
  });
  
  // Tratar erros na busca dos dados
  if (error) {
    toast({
      title: "Erro ao carregar propostas",
      description: `${error}`,
      variant: "destructive",
    });
  }
  
  // Processar dados para calcular campos adicionais
  const proposalsWithCalculations = proposals?.map(proposal => {
    const saldoAberto = Number(proposal.valorTotal) - Number(proposal.valorPago);
    const valorComissaoTotal = Number(proposal.valorTotal) * (Number(proposal.percentComissao) / 100);
    const valorComissaoEmAberto = valorComissaoTotal - Number(proposal.valorComissaoPaga);
    const percentComissaoPaga = valorComissaoTotal > 0 
      ? (Number(proposal.valorComissaoPaga) / valorComissaoTotal) * 100
      : 0;
    
    return {
      ...proposal,
      saldoAberto,
      valorComissaoTotal,
      valorComissaoEmAberto,
      percentComissaoPaga
    };
  }) || [];
  
  // Filtrar propostas pela busca
  const filteredProposals = proposalsWithCalculations.filter(proposal => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      proposal.proposta.toLowerCase().includes(query) ||
      (proposal.nomeCliente && proposal.nomeCliente.toLowerCase().includes(query))
    );
  });
  
  // Função para editar proposta
  const handleEditProposal = (proposal: ProposalWithCalculations) => {
    navigate(`/edit-proposal/${proposal.id}`);
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
    <div className="h-screen overflow-hidden bg-neutral-100">
      <NavigationHeader />
      {/* Main content */}
      <main className="h-[calc(100vh-64px)] overflow-auto bg-neutral-100">
        {/* Page header */}
        <header className="bg-white shadow-sm py-4 px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-800">Propostas</h1>
            <p className="text-neutral-500 text-sm">Gerenciamento de propostas fechadas</p>
          </div>
          <div className="flex gap-3 mt-3 sm:mt-0">
            <Link href="/add-proposal">
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Nova Proposta
              </Button>
            </Link>
          </div>
        </header>
        
        {/* Barra de pesquisa e filtros */}
        <div className="p-4 sticky top-0 z-10 bg-neutral-100 border-b">
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
          </div>
        </div>
        
        {/* Grid de cards */}
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProposals.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-neutral-500">Nenhuma proposta encontrada</p>
              </div>
            ) : (
              filteredProposals.map((proposal) => (
                <Card key={proposal.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-medium">{proposal.proposta}</CardTitle>
                    </div>
                    <CardDescription>
                      {proposal.nomeCliente || "Sem cliente"}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pb-2">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Valor Total:</span>
                        <span className="font-medium">{formatCurrency(Number(proposal.valorTotal))}</span>
                      </div>
                      
                      <Separator />
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-2 flex gap-2 justify-between">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditProposal(proposal)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}