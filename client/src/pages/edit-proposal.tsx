import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { SalesProposal } from "@shared/schema";
import AddEditProposalForm from "@/components/proposal/add-edit-proposal-form";
import NavigationHeader from "@/components/navigation-header";

export default function EditProposalPage() {
  const [, params] = useRoute<{ id: string }>("/edit-proposal/:id");
  const proposalId = params?.id;
  const [proposal, setProposal] = useState<SalesProposal | null>(null);
  
  const { data, isLoading, error } = useQuery<SalesProposal>({
    queryKey: [`/api/proposals/${proposalId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/proposals/${proposalId}`);
      return res.json();
    },
    enabled: !!proposalId,
  });
  
  useEffect(() => {
    if (data) {
      setProposal(data);
    }
  }, [data]);
  
  if (isLoading) {
    return (
      <div className="h-screen bg-neutral-100">
        <NavigationHeader />
        <div className="h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="ml-2 text-neutral-600">Carregando proposta...</p>
        </div>
      </div>
    );
  }
  
  if (error || !proposal) {
    return (
      <div className="h-screen bg-neutral-100">
        <NavigationHeader />
        <div className="h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-sm max-w-lg w-full text-center">
            <h1 className="text-2xl font-semibold text-red-600 mb-2">Erro</h1>
            <p className="text-neutral-600 mb-4">
              Não foi possível carregar a proposta. Por favor, tente novamente mais tarde.
            </p>
            <a href="/propostas" className="text-primary hover:underline">
              Voltar para lista de propostas
            </a>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-screen bg-neutral-100 overflow-auto">
      <NavigationHeader />
      <div className="py-6 px-4 md:px-6">
        <AddEditProposalForm editMode proposal={proposal} />
      </div>
    </div>
  );
}