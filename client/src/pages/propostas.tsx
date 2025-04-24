import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, Grid3X3 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import ProposalTable from "@/components/proposal/proposal-table";
import type { ProposalWithCalculations } from "@shared/schema";
import { Link } from "wouter";

export default function Propostas() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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

  return (
    <div className="h-screen overflow-hidden bg-neutral-100">
      {/* Main content */}
      <main className="h-full overflow-auto bg-neutral-100">
        {/* Page header */}
        <header className="bg-white shadow-sm py-4 px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-800">Propostas</h1>
            <p className="text-neutral-500 text-sm">Gerenciamento de propostas com informações detalhadas</p>
          </div>
          <div className="flex gap-3 mt-3 sm:mt-0">
            <Link href="/propostas-cards">
              <Button variant="outline" size="sm">
                <Grid3X3 className="h-4 w-4 mr-1" />
                Ver em Cards
              </Button>
            </Link>
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Nova Proposta
            </Button>
          </div>
        </header>
        
        {/* Content area - Full width with padding */}
        <div className="p-6">
          <div className="w-full">
            {/* Main table component */}
            <ProposalTable 
              proposals={proposalsWithCalculations} 
              isLoading={isLoading} 
            />
          </div>
        </div>
      </main>
      
      {/* Add Proposal Modal - To be implemented */}
      {/* 
      <AddProposalModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
      />
      */}
    </div>
  );
}