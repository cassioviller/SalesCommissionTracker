import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import CommissionTable from "@/components/commission/table";
import ChartPanel from "@/components/commission/chart-panel";
import AddProposalModal from "@/components/commission/add-proposal-modal";
import type { SalesProposal, ProposalWithCalculations } from "@shared/schema";
import NavigationHeader from "@/components/navigation-header";

export default function Comissoes() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentHistoryModalOpen, setIsPaymentHistoryModalOpen] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(null);
  const [selectedProposalName, setSelectedProposalName] = useState("");
  
  // Ref para o componente da tabela
  const tableRef = useRef<any>(null);
  
  // Fetch proposals from API
  const { data: proposals = [], isLoading } = useQuery<SalesProposal[]>({
    queryKey: ['/api/proposals'],
  });
  
  // Calculate derived fields for each proposal
  const proposalsWithCalculations: ProposalWithCalculations[] = (proposals || []).map(proposal => {
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
  
  // Manipulador para mostrar o histórico de pagamentos
  const handleShowPaymentHistory = (proposalId: number, proposalName: string) => {
    console.log("Função chamada com:", proposalId, proposalName);
    // Chama a função handleOpenPaymentHistoryById do componente CommissionTable através da referência
    if (tableRef.current && tableRef.current.handleOpenPaymentHistoryById) {
      console.log("Ref encontrada, abrindo histórico");
      tableRef.current.handleOpenPaymentHistoryById(proposalId, proposalName);
    } else {
      console.error("Referência da tabela não encontrada ou função não disponível");
    }
  };
  
  return (
    <div className="h-screen overflow-hidden bg-neutral-100">
      <NavigationHeader />
      {/* Main content */}
      <main className="h-[calc(100vh-64px)] overflow-auto bg-neutral-100">
        {/* Page header */}
        <header className="bg-white shadow-sm py-4 px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-800">Comissões de Vendas</h1>
            <p className="text-neutral-500 text-sm">Gerenciamento de comissões sobre vendas</p>
            <div className="mt-2 flex gap-2">
              <a href="/admin-login" className="text-primary text-sm hover:underline">Login Administrador</a>
              <span className="text-gray-300">|</span>
              <a href="/partner-login" className="text-primary text-sm hover:underline">Portal do Parceiro</a>
            </div>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="mt-3 sm:mt-0 bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Nova Proposta
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
      
      {/* Add Proposal Modal */}
      <AddProposalModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onShowPaymentHistory={handleShowPaymentHistory}
      />
    </div>
  );
}
