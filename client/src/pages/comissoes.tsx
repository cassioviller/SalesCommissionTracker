import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import CommissionTable from "@/components/commission/table";
import ChartPanel from "@/components/commission/chart-panel";
import type { SalesProposal, ProposalWithCalculations } from "@shared/schema";
import NavigationHeader from "@/components/navigation-header";
import ServiceManagerModal from "@/components/proposal/service-manager-modal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Comissoes() {
  // Ref para o componente da tabela
  const tableRef = useRef<any>(null);
  
  // Estado para controlar o modal de gerenciamento de serviços
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  
  // Fetch proposals from API
  const { data: proposals = [], isLoading } = useQuery<SalesProposal[]>({
    queryKey: ['/api/proposals'],
  });
  
  // Calculate derived fields for each proposal and filter out proposals without commission or with disabled commission
  const proposalsWithCalculations: ProposalWithCalculations[] = (proposals || [])
    .filter(proposal => {
      // Para debug
      console.log("Proposta:", proposal.proposta, "comissaoHabilitada:", proposal.comissaoHabilitada, typeof proposal.comissaoHabilitada);
      
      // Filtro duplo: verifica se tem percentual de comissão E se comissão está habilitada
      const comissaoString = String(proposal.comissaoHabilitada);
      return proposal.percentComissao && 
        Number(proposal.percentComissao) > 0 && 
        (comissaoString === "true");
    })
    .map(proposal => {
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
    });
  

  
  return (
    <div className="h-screen overflow-hidden bg-neutral-100">
      <NavigationHeader />
      {/* Main content */}
      <main className="h-[calc(100vh-64px)] overflow-auto bg-neutral-100">
        {/* Page header */}
        <header className="bg-white shadow-sm py-4 px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-800">Comissões de Vendas</h1>
            <p className="text-neutral-500 text-sm">Visualização de comissões sobre vendas</p>
            <div className="mt-2 flex gap-2">
              <a href="/admin-login" className="text-primary text-sm hover:underline">Login Administrador</a>
              <span className="text-gray-300">|</span>
              <a href="/partner-login" className="text-primary text-sm hover:underline">Portal do Parceiro</a>
            </div>
          </div>
          
          {/* Botão "+" para gerenciar serviços */}
          <Button
            variant="default"
            size="icon"
            className="w-10 h-10 bg-blue-500 hover:bg-blue-600 flex items-center justify-center"
            onClick={() => setIsServiceModalOpen(true)}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </header>
        
        {/* Content area */}
        <div className="p-6">
          <div className="flex flex-col gap-6">
            {/* Chart Panel - agora posicionado acima da tabela */}
            <div className="w-full max-w-md mx-auto">
              <ChartPanel proposals={proposalsWithCalculations} />
            </div>
            
            {/* Commission Table - ocupa toda a largura da tela */}
            <div className="w-full">
              <CommissionTable 
                ref={tableRef}
                proposals={proposalsWithCalculations} 
                isLoading={isLoading} 
              />
            </div>
          </div>
        </div>
      </main>

      
      {/* Modal de Gerenciamento de Serviços */}
      <ServiceManagerModal 
        isOpen={isServiceModalOpen} 
        onClose={() => setIsServiceModalOpen(false)} 
      />
    </div>
  );
}
