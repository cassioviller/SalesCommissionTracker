import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Search } from "lucide-react";
import { Link } from "wouter";
import { SearchFilter } from "@/components/ui/search-filter";
import { ProposalCombobox } from "@/components/ui/proposal-combobox";
import { SalesProposal } from "@shared/schema";

// Interface para parceiros
interface Partner {
  id: number;
  name: string;
  username: string;
  email: string;
  password?: string;
  proposalIds: number[];
}

export default function GerenciarParceiros() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Estados para gerenciar dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPartner, setCurrentPartner] = useState<Partner | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dados do formulário de adicionar/editar
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: ""
  });
  
  // Estado para as propostas selecionadas
  const [selectedProposalIds, setSelectedProposalIds] = useState<number[]>([]);
  
  // Fetch da lista de parceiros
  const { data: partners, isLoading, error } = useQuery({
    queryKey: ['/api/partners'],
    queryFn: async () => {
      const response = await fetch('/api/partners');
      if (!response.ok) {
        throw new Error('Erro ao buscar parceiros');
      }
      return response.json();
    }
  });
  
  // Mutação para adicionar parceiro
  const addPartnerMutation = useMutation({
    mutationFn: async (newPartner: Omit<Partner, 'id'>) => {
      const response = await fetch('/api/partners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPartner),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao adicionar parceiro');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidar a query para atualizar a lista de parceiros
      queryClient.invalidateQueries({ queryKey: ['/api/partners'] });
      setIsAddDialogOpen(false);
      
      toast({
        title: "Sucesso",
        description: "Parceiro adicionado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar parceiro",
        variant: "destructive",
      });
    }
  });
  
  // Mutação para editar parceiro
  const editPartnerMutation = useMutation({
    mutationFn: async ({ id, partner }: { id: number, partner: Partial<Partner> }) => {
      const response = await fetch(`/api/partners/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(partner),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar parceiro');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/partners'] });
      setIsEditDialogOpen(false);
      
      toast({
        title: "Sucesso",
        description: "Parceiro atualizado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar parceiro",
        variant: "destructive",
      });
    }
  });
  
  // Mutação para excluir parceiro
  const deletePartnerMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/partners/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir parceiro');
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/partners'] });
      setIsDeleteDialogOpen(false);
      
      toast({
        title: "Sucesso",
        description: "Parceiro removido com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir parceiro",
        variant: "destructive",
      });
    }
  });
  
  const handleStartAdd = () => {
    setFormData({ name: "", username: "", email: "", password: "" });
    setIsAddDialogOpen(true);
  };
  
  const handleStartEdit = (partner: Partner) => {
    setCurrentPartner(partner);
    setFormData({
      name: partner.name,
      username: partner.username,
      email: partner.email,
      password: "" // Não queremos preencher a senha para editar
    });
    setIsEditDialogOpen(true);
  };
  
  const handleStartDelete = (partner: Partner) => {
    setCurrentPartner(partner);
    setIsDeleteDialogOpen(true);
  };
  
  const handleAddPartner = () => {
    // Validação simples
    if (!formData.name || !formData.username || !formData.email || !formData.password) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios",
        variant: "destructive",
      });
      return;
    }
    
    // Adicionar novo parceiro
    const newPartner = {
      name: formData.name,
      username: formData.username,
      email: formData.email,
      password: formData.password,
      proposalIds: []
    };
    
    addPartnerMutation.mutate(newPartner);
  };
  
  const handleEditPartner = () => {
    if (!currentPartner) return;
    
    // Validação simples
    if (!formData.name || !formData.username || !formData.email) {
      toast({
        title: "Erro",
        description: "Nome, usuário e email são obrigatórios",
        variant: "destructive",
      });
      return;
    }
    
    // Preparar dados para update
    const updateData: Partial<Partner> = {
      name: formData.name,
      username: formData.username,
      email: formData.email,
    };
    
    // Apenas incluir a senha se houver alguma coisa no campo
    if (formData.password) {
      updateData.password = formData.password;
    }
    
    editPartnerMutation.mutate({ 
      id: currentPartner.id, 
      partner: updateData 
    });
  };
  
  const handleDeletePartner = () => {
    if (!currentPartner) return;
    deletePartnerMutation.mutate(currentPartner.id);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  // Filtrar parceiros baseado na busca
  const filteredPartners = useMemo(() => {
    if (!searchQuery.trim() || !partners) return partners;
    
    return partners.filter((partner: Partner) => 
      partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [partners, searchQuery]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Carregando parceiros...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 m-6">
        <h3 className="text-lg font-semibold">Erro ao carregar parceiros</h3>
        <p>{(error as Error).message}</p>
      </div>
    );
  }
  
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
              <p className="text-xs text-neutral-500">Gerenciamento de Parceiros</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/admin">
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
                  <rect x="3" y="3" width="7" height="9" />
                  <rect x="14" y="3" width="7" height="5" />
                  <rect x="14" y="12" width="7" height="9" />
                  <rect x="3" y="16" width="7" height="5" />
                </svg>
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 pt-6 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <div className="flex flex-col gap-6 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-semibold text-neutral-800">Gerenciar Parceiros</h1>
                  <p className="text-neutral-500 text-sm">Adicione, edite ou remova parceiros do sistema</p>
                </div>
                <Button onClick={handleStartAdd} className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Parceiro
                </Button>
              </div>
              
              {/* Search Filter */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <h2 className="text-lg font-medium text-neutral-800">Lista de Parceiros</h2>
                <SearchFilter
                  placeholder="Buscar por nome, usuário ou email..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                  className="md:w-80"
                />
              </div>
            </div>
            
            {partners?.length === 0 ? (
              <div className="text-center p-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Nenhum parceiro cadastrado. Clique em "Adicionar Parceiro" para começar.</p>
              </div>
            ) : filteredPartners?.length === 0 ? (
              <div className="text-center p-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Nenhum parceiro encontrado para essa busca.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPartners?.map((partner: Partner) => (
                  <Card key={partner.id} className="transition-all hover:shadow-lg">
                    <CardHeader>
                      <CardTitle>{partner.name}</CardTitle>
                      <CardDescription>{partner.email}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground">Usuário: {partner.username}</p>
                        <p className="text-sm text-muted-foreground">
                          Propostas associadas: {partner.proposalIds?.length || 0}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleStartEdit(partner)}>Editar</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleStartDelete(partner)}>Excluir</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer com logo da Estruturas do Vale */}
          <div className="mt-16 border-t pt-6 text-center text-gray-500">
            <p className="text-sm">© {new Date().getFullYear()} - Estruturas do Vale - Sistema de Gerenciamento de Comissões</p>
          </div>
        </div>
      </main>
      
      {/* Dialog para adicionar parceiro */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Parceiro</DialogTitle>
            <DialogDescription>
              Preencha as informações para adicionar um novo parceiro.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input id="username" name="username" value={formData.username} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" value={formData.password} onChange={handleInputChange} />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
            <Button 
              onClick={handleAddPartner}
              disabled={addPartnerMutation.isPending}
            >
              {addPartnerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog para editar parceiro */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Parceiro</DialogTitle>
            <DialogDescription>
              Atualize as informações do parceiro.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input id="edit-name" name="name" value={formData.name} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-username">Usuário</Label>
              <Input id="edit-username" name="username" value={formData.username} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Nova Senha (deixe em branco para manter)</Label>
              <Input id="edit-password" name="password" type="password" value={formData.password} onChange={handleInputChange} />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button 
              onClick={handleEditPartner}
              disabled={editPartnerMutation.isPending}
            >
              {editPartnerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog para confirmar exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza de que deseja excluir o parceiro "{currentPartner?.name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
            <Button 
              variant="destructive" 
              onClick={handleDeletePartner}
              disabled={deletePartnerMutation.isPending}
            >
              {deletePartnerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}