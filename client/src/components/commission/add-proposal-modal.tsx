import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { InsertProposal } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AddProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowPaymentHistory: (proposalId: number, proposalName: string) => void;
}

export default function AddProposalModal({ isOpen, onClose, onShowPaymentHistory }: AddProposalModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    proposta: "",
    valorTotal: "",
    percentComissao: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addProposalMutation = useMutation({
    mutationFn: async (data: InsertProposal) => {
      const response = await apiRequest("POST", "/api/proposals", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Proposta adicionada",
        description: "A proposta foi adicionada com sucesso.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/proposals'] });
      resetForm();
      onClose();
      
      // Redirecionar para o histórico de pagamentos após criar a proposta
      if (data && data.id) {
        setTimeout(() => {
          onShowPaymentHistory(data.id, data.proposta);
        }, 300); // Pequeno atraso para garantir que o modal seja fechado primeiro
      }
    },
    onError: (error: any) => {
      console.error("Erro ao adicionar proposta:", error);
      toast({
        title: "Erro",
        description: `Não foi possível adicionar a proposta: ${error.message || 'Verifique os dados informados'}`,
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      proposta: "",
      valorTotal: "",
      percentComissao: ""
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Preparando os dados para envio - valor pago e comissão paga iniciam com zero
    const proposalData: InsertProposal = {
      proposta: formData.proposta,
      valorTotal: formData.valorTotal,
      valorPago: "0", // Valor pago inicia zerado
      percentComissao: formData.percentComissao,
      valorComissaoPaga: "0" // Valor comissão paga inicia zerado
    };
    
    addProposalMutation.mutate(proposalData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Proposta</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="proposta">Proposta</Label>
                <Input
                  id="proposta"
                  name="proposta"
                  placeholder="Ex: 123.45 - Cliente"
                  value={formData.proposta}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="valorTotal">Valor Total do Contrato (R$)</Label>
                <Input
                  id="valorTotal"
                  name="valorTotal"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={formData.valorTotal}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="percentComissao">Percentual de Comissão (%)</Label>
                <Input
                  id="percentComissao"
                  name="percentComissao"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={formData.percentComissao}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Valor da Comissão</Label>
                  <span className="text-sm text-muted-foreground">
                    {formData.valorTotal && formData.percentComissao ? 
                      `R$ ${(parseFloat(formData.valorTotal) * (parseFloat(formData.percentComissao) / 100)).toFixed(2)}` : 
                      "R$ 0,00"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Após criar a proposta, você poderá registrar os pagamentos no histórico.
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={addProposalMutation.isPending}>
              {addProposalMutation.isPending ? "Salvando..." : "Salvar Proposta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
