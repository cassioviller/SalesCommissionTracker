import { useState, useEffect } from "react";
import { X, Search, Trash, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { TIPOS_SERVICO } from "@shared/schema";

// Precisamos manter uma versão editável dos serviços
interface ServiceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ServiceManagerModal({
  isOpen,
  onClose,
}: ServiceManagerModalProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [services, setServices] = useState<string[]>([...TIPOS_SERVICO]);
  const [newServiceName, setNewServiceName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Filtra os serviços com base no termo de busca
  const filteredServices = services.filter((service) =>
    service.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para remover um serviço
  const removeService = (serviceName: string) => {
    // Aqui precisaria de uma chamada de API para remover efetivamente o serviço
    // Por enquanto, apenas atualizamos a lista local
    setServices((prev) => prev.filter((s) => s !== serviceName));
    
    toast({
      title: "Serviço removido",
      description: `O serviço "${serviceName}" foi removido com sucesso.`,
    });
  };

  // Função para adicionar um novo serviço
  const addService = () => {
    if (!newServiceName.trim()) {
      toast({
        title: "Nome inválido",
        description: "Por favor, insira um nome para o serviço.",
        variant: "destructive",
      });
      return;
    }

    // Verificar se o serviço já existe
    if (services.includes(newServiceName)) {
      toast({
        title: "Serviço já existe",
        description: `O serviço "${newServiceName}" já está cadastrado.`,
        variant: "destructive",
      });
      return;
    }

    // Adicionar o serviço à lista global TIPOS_SERVICO
    // Esta é uma modificação temporária da lista em memória
    // Uma solução completa exigiria que esses serviços fossem armazenados no banco de dados
    // @ts-ignore - Isso permite modificar TIPOS_SERVICO mesmo sendo const
    TIPOS_SERVICO.push(newServiceName);
    
    // Atualizar a lista local de serviços
    setServices((prev) => [...prev, newServiceName]);
    
    toast({
      title: "Serviço adicionado",
      description: `O serviço "${newServiceName}" foi adicionado com sucesso.`,
    });

    // Limpar o formulário
    setNewServiceName("");
    setIsAdding(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Gerenciar Tipos de Serviço
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 my-4">
          {/* Barra de pesquisa */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              placeholder="Buscar serviço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Lista de serviços */}
          <div className="border rounded-md overflow-hidden">
            <div className="max-h-[200px] overflow-y-auto">
              {filteredServices.length > 0 ? (
                <div className="divide-y">
                  {filteredServices.map((service) => (
                    <div
                      key={service}
                      className="flex justify-between items-center p-3 hover:bg-gray-50"
                    >
                      <span className="text-sm font-medium">{service}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => removeService(service)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  Nenhum serviço encontrado
                </div>
              )}
            </div>
          </div>

          {/* Formulário para adicionar novo serviço */}
          {isAdding ? (
            <div className="border rounded-md p-3 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Novo Serviço</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setIsAdding(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Nome do serviço"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="default"
                  size="sm"
                  onClick={addService}
                >
                  OK
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full flex justify-center items-center gap-1"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="h-4 w-4" />
              Adicionar Novo Serviço
            </Button>
          )}
        </div>

        <div className="flex justify-end">
          <DialogClose asChild>
            <Button variant="outline">Fechar</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}