import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash, UserPlus } from "lucide-react";
import NavigationHeader from "@/components/navigation-header";
import { apiRequest, queryClient } from "@/lib/queryClient";
// Definição da interface do parceiro
interface Partner {
  id: number;
  username: string;
  name: string;
  nome?: string;
  email: string;
  telefone?: string;
  endereco?: string;
  percentComissaoPadrao?: number;
  proposalIds: number[] | null;
}
import { useToast } from "@/hooks/use-toast";

export default function GerenciarParceiros() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [newPartner, setNewPartner] = useState({
    username: "",
    nome: "",
    email: "",
    telefone: "",
    endereco: "",
    percentComissaoPadrao: "10",
  });

  // Buscar parceiros do backend
  const { data: partners = [], isLoading } = useQuery<Partner[]>({
    queryKey: ['/api/partners'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/partners");
      if (!res.ok) throw new Error("Falha ao carregar parceiros");
      return res.json();
    }
  });

  // Funções para manipular parceiros
  const handleAddPartner = async () => {
    try {
      await apiRequest("POST", "/api/partners", {
        ...newPartner,
        percentComissaoPadrao: Number(newPartner.percentComissaoPadrao)
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/partners'] });
      setIsAddDialogOpen(false);
      setNewPartner({
        username: "",
        nome: "",
        email: "",
        telefone: "",
        endereco: "",
        percentComissaoPadrao: "10",
      });
      
      toast({
        title: "Parceiro adicionado",
        description: "O parceiro foi adicionado com sucesso",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Erro ao adicionar parceiro",
        description: `${error}`,
        variant: "destructive",
      });
    }
  };

  const handleEditPartner = async () => {
    if (!selectedPartner) return;
    
    try {
      await apiRequest("PATCH", `/api/partners/${selectedPartner.id}`, {
        ...selectedPartner,
        percentComissaoPadrao: Number(selectedPartner.percentComissaoPadrao)
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/partners'] });
      setIsEditDialogOpen(false);
      setSelectedPartner(null);
      
      toast({
        title: "Parceiro atualizado",
        description: "As informações do parceiro foram atualizadas com sucesso",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar parceiro",
        description: `${error}`,
        variant: "destructive",
      });
    }
  };

  const handleDeletePartner = async () => {
    if (!selectedPartner) return;
    
    try {
      await apiRequest("DELETE", `/api/partners/${selectedPartner.id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/partners'] });
      setIsDeleteDialogOpen(false);
      setSelectedPartner(null);
      
      toast({
        title: "Parceiro removido",
        description: "O parceiro foi removido com sucesso",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Erro ao remover parceiro",
        description: `${error}`,
        variant: "destructive",
      });
    }
  };

  // Renderização principal
  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationHeader />
      
      <main className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gerenciar Parceiros</h1>
            <p className="text-gray-500">Adicione, edite ou remova parceiros comerciais</p>
          </div>
          
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-1">
            <UserPlus className="h-4 w-4" />
            Adicionar Parceiro
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Parceiros Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-10 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-2 text-gray-500">Carregando parceiros...</p>
              </div>
            ) : partners.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-gray-500">Nenhum parceiro cadastrado</p>
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Parceiro
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>% Comissão</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partners.map((partner) => (
                      <TableRow key={partner.id}>
                        <TableCell className="font-medium">{partner.nome}</TableCell>
                        <TableCell>{partner.username}</TableCell>
                        <TableCell>
                          {partner.email}<br />
                          <span className="text-gray-500 text-sm">{partner.telefone}</span>
                        </TableCell>
                        <TableCell>{partner.percentComissaoPadrao}%</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setSelectedPartner(partner);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => {
                                setSelectedPartner(partner);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      
      {/* Modal para adicionar parceiro */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Parceiro</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuário</Label>
                <Input 
                  id="username" 
                  value={newPartner.username}
                  onChange={(e) => setNewPartner({...newPartner, username: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="percentComissao">% Comissão Padrão</Label>
                <Input 
                  id="percentComissao" 
                  type="number"
                  value={newPartner.percentComissaoPadrao}
                  onChange={(e) => setNewPartner({...newPartner, percentComissaoPadrao: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input 
                id="nome" 
                value={newPartner.nome}
                onChange={(e) => setNewPartner({...newPartner, nome: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email"
                value={newPartner.email}
                onChange={(e) => setNewPartner({...newPartner, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input 
                id="telefone" 
                value={newPartner.telefone}
                onChange={(e) => setNewPartner({...newPartner, telefone: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input 
                id="endereco" 
                value={newPartner.endereco}
                onChange={(e) => setNewPartner({...newPartner, endereco: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddPartner}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal para editar parceiro */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Parceiro</DialogTitle>
          </DialogHeader>
          {selectedPartner && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-username">Usuário</Label>
                  <Input 
                    id="edit-username" 
                    value={selectedPartner.username}
                    onChange={(e) => setSelectedPartner({...selectedPartner, username: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-percentComissao">% Comissão Padrão</Label>
                  <Input 
                    id="edit-percentComissao" 
                    type="number"
                    value={selectedPartner.percentComissaoPadrao}
                    onChange={(e) => setSelectedPartner({...selectedPartner, percentComissaoPadrao: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-nome">Nome Completo</Label>
                <Input 
                  id="edit-nome" 
                  value={selectedPartner.nome}
                  onChange={(e) => setSelectedPartner({...selectedPartner, nome: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input 
                  id="edit-email" 
                  type="email"
                  value={selectedPartner.email}
                  onChange={(e) => setSelectedPartner({...selectedPartner, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-telefone">Telefone</Label>
                <Input 
                  id="edit-telefone" 
                  value={selectedPartner.telefone}
                  onChange={(e) => setSelectedPartner({...selectedPartner, telefone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endereco">Endereço</Label>
                <Input 
                  id="edit-endereco" 
                  value={selectedPartner.endereco}
                  onChange={(e) => setSelectedPartner({...selectedPartner, endereco: e.target.value})}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditPartner}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de confirmação para excluir parceiro */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Tem certeza que deseja excluir o parceiro <strong>{selectedPartner?.nome}</strong>?</p>
            <p className="text-gray-500 text-sm mt-2">Esta ação não pode ser desfeita.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeletePartner}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}