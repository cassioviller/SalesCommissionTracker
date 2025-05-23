import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Filter, ChevronDown, Edit, Eye, List, Trash2, Banknote } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatIntegerPercentage } from "@/lib/utils/format";
import type { ProposalWithCalculations } from "@shared/schema";
import { useAuth } from "@/context/AuthContext";
import { Link } from "wouter";
import NavigationHeader from "@/components/navigation-header";
import PaymentButtonModal from "@/components/commission/payment-button-modal";
import { CalendarIcon } from "lucide-react";

export default function PropostasCards() {
  const { userRole } = useAuth();
  // Debug: verificar o papel do usuário
  console.log("UserRole na página de propostas:", userRole);
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [proposalToDelete, setProposalToDelete] = useState<ProposalWithCalculations | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Buscar dados das propostas
  const queryClient = useQueryClient();
  const { data: proposals, isLoading, error } = useQuery<ProposalWithCalculations[]>({
    queryKey: ['/api/proposals'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/proposals");
      return res.json();
    },
  });
  
  // Mutation para excluir proposta
  const deleteMutation = useMutation({
    mutationFn: async (proposalId: number) => {
      const res = await apiRequest("DELETE", `/api/proposals/${proposalId}`);
      return res.status === 204 ? null : res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proposals'] });
      toast({
        title: "Proposta excluída",
        description: "A proposta foi excluída com sucesso",
      });
      setProposalToDelete(null);
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir proposta",
        description: `Erro: ${error.message}`,
        variant: "destructive",
      });
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
  
  // Filtrar propostas pela busca
  const filteredProposals = proposals?.filter(proposal => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      proposal.proposta.toLowerCase().includes(query) ||
      (proposal.nomeCliente && proposal.nomeCliente.toLowerCase().includes(query))
    );
  }) || [];
  
  // Função para determinar a cor do badge com base na porcentagem de comissão paga
  const getStatusColor = (percentComissaoPaga: number): string => {
    if (percentComissaoPaga <= 0) return 'bg-red-100 text-red-800 hover:bg-red-200';
    if (percentComissaoPaga >= 100) return 'bg-green-100 text-green-800 hover:bg-green-200';
    return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
  };
  
  const handleViewProposal = (proposal: ProposalWithCalculations) => {
    toast({
      title: "Ver Proposta",
      description: `Visualizando detalhes da proposta ${proposal.proposta}`,
      variant: "default",
    });
  };

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

  return (
    <div className="h-screen overflow-hidden bg-neutral-100">
      <NavigationHeader />
      {/* Main content */}
      <main className="h-[calc(100vh-64px)] overflow-auto bg-neutral-100">
        {/* Page header */}
        <header className="bg-white shadow-sm py-4 px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-800">Propostas em Cards</h1>
            <p className="text-neutral-500 text-sm">Visualização de propostas em formato de cartões</p>
          </div>
          <div className="flex gap-3 mt-3 sm:mt-0">
            <Link href="/propostas">
              <Button variant="outline" size="sm">
                <List className="h-4 w-4 mr-1" />
                Ver em Tabela
              </Button>
            </Link>
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Nova Proposta
            </Button>
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
                    <CardTitle className="text-lg font-medium flex justify-between">
                      <span>{proposal.proposta}</span>
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(Number(proposal.percentComissaoPaga))}
                      >
                        {formatIntegerPercentage(Number(proposal.percentComissaoPaga))}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {proposal.nomeCliente || "Sem cliente"}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pb-2 text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Valor Total:</span>
                      <span className="font-medium">{formatCurrency(Number(proposal.valorTotal))}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Comissão:</span>
                      <span className="font-medium">{formatCurrency(Number(proposal.valorComissaoTotal))}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Pago:</span>
                      <span className="font-medium">{formatCurrency(Number(proposal.valorComissaoPaga))}</span>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex justify-between">
                    {/* Botão único de editar */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.location.href = `/edit-proposal/${proposal.id}`}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    
                    {/* Botão de pagamentos direcionando para página dedicada */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-green-600"
                      onClick={() => window.location.href = `/pagamentos-proposta/${proposal.id}`}
                    >
                      <Banknote className="h-4 w-4 mr-1" />
                      Pagamentos
                    </Button>
                    
                    {/* Botão de excluir */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600"
                      onClick={() => {
                        setProposalToDelete(proposal);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
      
      {/* Diálogo de confirmação para excluir proposta */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a proposta {proposalToDelete?.proposta}? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (proposalToDelete?.id) {
                  deleteMutation.mutate(proposalToDelete.id);
                }
              }}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Modal para adicionar proposta será implementado posteriormente */}
      
      {/* Modal de histórico de pagamentos removido, agora usando PaymentButtonModal */}
    </div>
  );
}