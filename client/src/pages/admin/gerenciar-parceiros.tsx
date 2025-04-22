import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../../context/AuthContext";
import type { SalesProposal, ProposalWithCalculations } from "@shared/schema";
import { Edit, Trash2, Plus, Check, X } from "lucide-react";

// Interface para representar um parceiro no sistema
interface Partner {
  id: string;
  name: string;
  username: string;
  email: string;
  proposalIds: number[];
}

export default function GerenciarParceiros() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const auth = useAuth();
  
  // Mock de parceiros (seria substituído por dados do backend)
  const [partners, setPartners] = useState<Partner[]>([
    { 
      id: "PARTNER-1001", 
      name: "João Silva",
      username: "parceiro1",
      email: "joao@example.com",
      proposalIds: [1, 2]
    },
    { 
      id: "PARTNER-1002", 
      name: "Maria Oliveira",
      username: "parceiro2",
      email: "maria@example.com",
      proposalIds: [3]
    }
  ]);
  
  // Estado para edição
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editProposalIds, setEditProposalIds] = useState<number[]>([]);

  // Para adicionar novo parceiro
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newProposalIds, setNewProposalIds] = useState<number[]>([]);
  
  // Fetch de propostas
  const { data: proposals, isLoading } = useQuery<SalesProposal[]>({
    queryKey: ['/api/proposals'],
  });
  
  // Função para iniciar edição de um parceiro
  const handleStartEdit = (partner: Partner) => {
    setEditingPartnerId(partner.id);
    setEditName(partner.name);
    setEditEmail(partner.email);
    setEditUsername(partner.username);
    setEditProposalIds([...partner.proposalIds]);
  };
  
  // Função para salvar edição
  const handleSaveEdit = () => {
    if (!editName || !editEmail || !editUsername) {
      toast({
        title: "Erro",
        description: "Todos os campos devem ser preenchidos.",
        variant: "destructive",
      });
      return;
    }
    
    setPartners(partners.map(partner => 
      partner.id === editingPartnerId
        ? { ...partner, name: editName, email: editEmail, username: editUsername, proposalIds: editProposalIds }
        : partner
    ));
    
    toast({
      title: "Sucesso",
      description: "Dados do parceiro atualizados.",
    });
    
    // Limpar estado de edição
    setEditingPartnerId(null);
  };
  
  // Função para cancelar edição
  const handleCancelEdit = () => {
    setEditingPartnerId(null);
  };
  
  // Função para remover um parceiro
  const handleRemovePartner = (id: string) => {
    const confirmDelete = window.confirm("Tem certeza que deseja remover este parceiro?");
    if (confirmDelete) {
      setPartners(partners.filter(partner => partner.id !== id));
      
      toast({
        title: "Parceiro removido",
        description: "O parceiro foi removido com sucesso.",
      });
    }
  };
  
  // Função para adicionar novo parceiro
  const handleAddPartner = () => {
    if (!newName || !newEmail || !newUsername || !newPassword) {
      toast({
        title: "Erro",
        description: "Todos os campos devem ser preenchidos.",
        variant: "destructive",
      });
      return;
    }
    
    const newPartnerId = `PARTNER-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const newPartner: Partner = {
      id: newPartnerId,
      name: newName,
      email: newEmail,
      username: newUsername,
      proposalIds: newProposalIds
    };
    
    setPartners([...partners, newPartner]);
    
    // Limpar formulário
    setNewName("");
    setNewEmail("");
    setNewUsername("");
    setNewPassword("");
    setNewProposalIds([]);
    
    toast({
      title: "Parceiro adicionado",
      description: "O parceiro foi adicionado com sucesso.",
    });
  };

  // Função para alternar a seleção de uma proposta para um parceiro
  const toggleProposalSelection = (proposalId: number, isEditing: boolean) => {
    if (isEditing) {
      setEditProposalIds(current => 
        current.includes(proposalId)
          ? current.filter(id => id !== proposalId)
          : [...current, proposalId]
      );
    } else {
      setNewProposalIds(current => 
        current.includes(proposalId)
          ? current.filter(id => id !== proposalId)
          : [...current, proposalId]
      );
    }
  };
  
  // Função para sair
  const handleLogout = () => {
    auth.logout();
    window.location.href = "/";
  };
  
  return (
    <div className="h-screen overflow-hidden bg-neutral-100">
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
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/admin")}
            >
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
      <main className="h-full overflow-auto bg-neutral-100 pt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h1 className="text-2xl font-semibold text-neutral-800">Gerenciar Parceiros</h1>
            <p className="text-neutral-500 text-sm mb-4">Adicione, edite ou remova parceiros e associe propostas</p>

            <Tabs defaultValue="lista" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 max-w-md">
                <TabsTrigger value="lista">Listar Parceiros</TabsTrigger>
                <TabsTrigger value="adicionar">Adicionar Parceiro</TabsTrigger>
              </TabsList>
              
              <TabsContent value="lista">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Propostas Associadas</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partners.map((partner) => (
                        <TableRow key={partner.id}>
                          {editingPartnerId === partner.id ? (
                            <>
                              <TableCell>
                                <Input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="max-w-[200px]"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={editUsername}
                                  onChange={(e) => setEditUsername(e.target.value)}
                                  className="max-w-[200px]"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={editEmail}
                                  onChange={(e) => setEditEmail(e.target.value)}
                                  className="max-w-[200px]"
                                />
                              </TableCell>
                              <TableCell>
                                <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                                  {isLoading ? (
                                    <div className="p-2 text-center text-neutral-500">Carregando propostas...</div>
                                  ) : proposals?.length === 0 ? (
                                    <div className="p-2 text-center text-neutral-500">Nenhuma proposta disponível</div>
                                  ) : (
                                    <div className="space-y-1">
                                      {proposals?.map((proposal) => (
                                        <div key={proposal.id} className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`edit-proposal-${proposal.id}`}
                                            checked={editProposalIds.includes(proposal.id)}
                                            onCheckedChange={() => toggleProposalSelection(proposal.id, true)}
                                          />
                                          <Label
                                            htmlFor={`edit-proposal-${proposal.id}`}
                                            className="text-sm cursor-pointer"
                                          >
                                            {proposal.proposta}
                                          </Label>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex space-x-2 justify-end">
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={handleSaveEdit}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCancelEdit}
                                    className="h-8 w-8 p-0"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell>{partner.name}</TableCell>
                              <TableCell>{partner.username}</TableCell>
                              <TableCell>{partner.email}</TableCell>
                              <TableCell>
                                {proposals
                                  ?.filter((p) => partner.proposalIds.includes(p.id))
                                  .map((p) => p.proposta)
                                  .join(", ") || "Nenhuma proposta"}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex space-x-2 justify-end">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleStartEdit(partner)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemovePartner(partner.id)}
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                      
                      {partners.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4 text-neutral-500">
                            Nenhum parceiro cadastrado. Adicione um parceiro na aba "Adicionar Parceiro".
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="adicionar">
                <Card>
                  <CardHeader>
                    <CardTitle>Novo Parceiro</CardTitle>
                    <CardDescription>
                      Adicione um novo parceiro e associe propostas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="new-name">Nome Completo</Label>
                            <Input
                              id="new-name"
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              placeholder="Nome do parceiro"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="new-email">Email</Label>
                            <Input
                              id="new-email"
                              type="email"
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              placeholder="email@exemplo.com"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="new-username">Nome de Usuário</Label>
                            <Input
                              id="new-username"
                              value={newUsername}
                              onChange={(e) => setNewUsername(e.target.value)}
                              placeholder="nome_usuario"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="new-password">Senha</Label>
                            <Input
                              id="new-password"
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="********"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="block mb-2">Selecione as propostas</Label>
                        <div className="border rounded-md p-3 h-64 overflow-y-auto">
                          {isLoading ? (
                            <div className="flex justify-center items-center h-full">
                              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {proposals?.map((proposal) => (
                                <div key={proposal.id} className="flex items-start space-x-2 p-2 hover:bg-gray-50 rounded">
                                  <Checkbox
                                    id={`new-proposal-${proposal.id}`}
                                    checked={newProposalIds.includes(proposal.id)}
                                    onCheckedChange={() => toggleProposalSelection(proposal.id, false)}
                                  />
                                  <div className="grid grid-cols-1 gap-1 flex-1">
                                    <Label
                                      htmlFor={`new-proposal-${proposal.id}`}
                                      className="font-medium cursor-pointer"
                                    >
                                      {proposal.proposta}
                                    </Label>
                                    <div className="flex gap-6 text-xs text-gray-500">
                                      <span>Valor: R$ {Number(proposal.valorTotal).toLocaleString('pt-BR')}</span>
                                      <span>Comissão: {proposal.percentComissao}%</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              {proposals?.length === 0 && (
                                <div className="text-center py-4 text-gray-500">
                                  Nenhuma proposta disponível.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={handleAddPartner}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Parceiro
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}