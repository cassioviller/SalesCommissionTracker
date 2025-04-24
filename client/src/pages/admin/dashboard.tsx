import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import CommissionTable from "@/components/commission/table";
import ChartPanel from "@/components/commission/chart-panel";
import AddProposalModal from "@/components/commission/add-proposal-modal";
import type { SalesProposal, ProposalWithCalculations } from "@shared/schema";
import { useAuth } from "../../context/AuthContext";
import { Link } from "wouter";
import { SearchFilter } from "@/components/ui/search-filter";

export default function AdminDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(null);
  const [selectedProposalName, setSelectedProposalName] = useState("");
  const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = useState(false);
  const auth = useAuth();
  
  // Fetch proposals from API
  const { data: proposals, isLoading } = useQuery<SalesProposal[]>({
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

  // Filtrar propostas baseado na busca
  const filteredProposals = useMemo(() => {
    if (!searchQuery.trim()) return proposalsWithCalculations;
    
    return proposalsWithCalculations.filter(proposal => 
      proposal.proposta.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(proposal.valorTotal).includes(searchQuery)
    );
  }, [proposalsWithCalculations, searchQuery]);

  const handleLogout = () => {
    auth.logout();
    window.location.href = "/";
  };
  
  const handleShowPaymentHistory = (proposalId: number, proposalName: string) => {
    setSelectedProposalId(proposalId);
    setSelectedProposalName(proposalName);
    setIsPaymentHistoryOpen(true);
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-neutral-100">
      {/* Header/Navbar */}
      <header className="bg-white shadow-sm py-3 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-primary rounded-md text-white h-8 w-8 flex items-center justify-center mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 6.37v11.26a.9.9 0 0 1-1.33.83l-1.47-.87a1.17 1.17 0 0 0-1.21.04l-3.11 2.14a1.17 1.17 0 0 1-1.21.04L7.6 17.9a1.17 1.17 0 0 0-1.21.04l-2.72 1.87A.9.9 0 0 1 2 19V5.5a.9.9 0 0 1 .33-.7l2.72-1.87a1.17 1.17 0 0 1 1.21-.04l3.07 1.91a1.17 1.17 0 0 0 1.21-.04l3.11-2.14a1.17 1.17 0 0 1 1.21-.04l1.47.87a.9.9 0 0 1 .67.92z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-primary text-md">Sistema de Comissões</h1>
              <p className="text-xs text-neutral-500">Admin Dashboard</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/admin/gerenciar-parceiros">
              <Button variant="outline" size="sm">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Gerenciar Parceiros
              </Button>
            </Link>
            
            <Link href="/admin/propostas">
              <Button variant="outline" size="sm">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M16 13H8" />
                  <path d="M16 17H8" />
                  <path d="M10 9H8" />
                </svg>
                Propostas
              </Button>
            </Link>

            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pt-6 pb-20">
        {/* Page header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-neutral-800">Comissões de Vendas</h1>
                <p className="text-neutral-500 text-sm">Gerencie todas as propostas e acompanhe as comissões</p>
              </div>
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Nova Proposta
              </Button>
            </div>
          </div>
          
          {/* Content area */}
          <div className="flex flex-col gap-6 mb-6">
            {/* Chart Panel - now on top horizontally */}
            <div>
              <ChartPanel proposals={filteredProposals} />
            </div>
            
            {/* Search Filter */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <h2 className="text-lg font-medium text-neutral-800">Lista de Propostas</h2>
                <SearchFilter
                  placeholder="Buscar por proposta, parceiro ou valor..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                  className="md:w-80"
                />
              </div>
            </div>
            
            {/* Commission Table - takes full width */}
            <div>
              <CommissionTable 
                proposals={filteredProposals} 
                isLoading={isLoading} 
              />
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t py-4 mt-auto">
        <div className="container mx-auto text-center">
          <p className="text-sm font-medium text-gray-600">Estruturas do Vale</p>
        </div>
      </footer>
      
      {/* Add Proposal Modal */}
      <AddProposalModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}