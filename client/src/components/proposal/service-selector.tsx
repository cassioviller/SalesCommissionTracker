import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus, Search, ChevronDown, Check, Info } from "lucide-react";
import { TIPOS_SERVICO, TIPOS_UNIDADE, ServicoDetalhe } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Tabela de correspondência padrão para as unidades de medida
const UNIDADES_MEDIDA_PADRÃO: Record<string, typeof TIPOS_UNIDADE[number]> = {
  "Estrutura": "kg",
  "Escada Metálica": "kg",
  "Pergolado": "kg",
  "Manta Termo Plástica": "m²",
  "Escada Helicoidal": "kg",
  "Laje": "m²",
  "Telha": "m²",
  "Cobertura Metálica": "m²",
  "Manta PVC": "m²",
  "Cobertura Policarbonato": "m²",
  "Beiral": "m²",
  "Reforço Metálico": "kg",
  "Mezanino": "kg"
};

// Usando ServicoDetalhe do schema compartilhado

// Props para o componente
interface ServiceSelectorProps {
  initialServices?: Array<string>;
  initialMaterialValue?: string;
  initialDetails?: ServicoDetalhe[];
  onChange: (services: Array<string>, valorTotalMaterial: number, detalhes: ServicoDetalhe[]) => void;
}

// Formatar valores em Reais
const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export default function ServiceSelector({
  initialServices = [],
  initialMaterialValue = "0",
  initialDetails = [],
  onChange
}: ServiceSelectorProps) {
  // Estados
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredServices, setFilteredServices] = useState<Array<string>>([]);
  const [selectedServices, setSelectedServices] = useState<Array<string>>(initialServices || []);
  const [serviceDetails, setServiceDetails] = useState<ServicoDetalhe[]>(initialDetails || []);
  const [currentService, setCurrentService] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState<number>(0);
  const [unidade, setUnidade] = useState<string>("kg");
  const [precoUnitario, setPrecoUnitario] = useState<number>(0);
  const [valorTotalMaterial, setValorTotalMaterial] = useState<number>(Number(initialMaterialValue) || 0);
  const [isEditing, setIsEditing] = useState(false);

  // Atualizar serviços filtrados baseado no termo de busca
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredServices([...TIPOS_SERVICO]);
    } else {
      const filtered = TIPOS_SERVICO.filter(service =>
        service.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredServices([...filtered]);
    }
  }, [searchTerm]);

  // Usar a unidade padrão quando um serviço for selecionado (apenas se não estiver editando)
  useEffect(() => {
    if (currentService && !isEditing) {
      const unidadePadrao = UNIDADES_MEDIDA_PADRÃO[currentService] || "kg";
      setUnidade(unidadePadrao);
    }
  }, [currentService, isEditing]);

  // Calcular subtotal
  const subtotal = quantidade * precoUnitario;

  // Validar campos do formulário
  const validateForm = (): boolean => {
    if (!currentService) {
      toast({
        title: "Erro de validação",
        description: "Selecione um tipo de serviço",
        variant: "destructive"
      });
      return false;
    }
    
    if (quantidade <= 0) {
      toast({
        title: "Erro de validação",
        description: "A quantidade deve ser maior que zero",
        variant: "destructive"
      });
      return false;
    }
    
    if (precoUnitario <= 0) {
      toast({
        title: "Erro de validação",
        description: "O preço unitário deve ser maior que zero",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  // Adicionar ou atualizar serviço
  const addOrUpdateServiceDetail = () => {
    if (!validateForm()) return;

    // Garantir que estamos trabalhando com números
    const qtdNumerica = Number(quantidade);
    const precoNumerico = Number(precoUnitario);
    const subtotalCalculado = qtdNumerica * precoNumerico;

    console.log("Valores sendo usados:", {
      tipo: currentService,
      quantidade: qtdNumerica,
      unidade,
      precoUnitario: precoNumerico,
      subtotal: subtotalCalculado
    });

    const newDetail: ServicoDetalhe = {
      tipo: currentService! as string,
      quantidade: qtdNumerica,
      unidade: unidade,
      precoUnitario: precoNumerico,
      subtotal: subtotalCalculado
    };

    // Verificar se o serviço já existe
    const existingIndex = serviceDetails.findIndex(d => d.tipo === currentService);
    
    let updatedDetails: ServicoDetalhe[];
    
    if (existingIndex >= 0) {
      // Atualizar serviço existente
      updatedDetails = [...serviceDetails];
      updatedDetails[existingIndex] = newDetail;
      
      toast({
        title: "Serviço atualizado",
        description: `${currentService} atualizado com sucesso!`,
      });
    } else {
      // Adicionar novo serviço
      updatedDetails = [...serviceDetails, newDetail];
      
      toast({
        title: "Serviço adicionado",
        description: `${currentService} adicionado com sucesso!`,
      });
    }
    
    // Atualizar o estado em uma única operação para evitar inconsistências
    setServiceDetails(updatedDetails);
    
    // Sempre reconstruir a lista de serviços selecionados a partir dos detalhes
    const updatedServiceTypes = updatedDetails.map(detail => detail.tipo);
    setSelectedServices(updatedServiceTypes);
    
    // Calcular o total correto garantindo valores numéricos
    const total = updatedDetails.reduce((sum, detail) => {
      // Garantir que os valores são numéricos
      const detailSubtotal = Number(detail.quantidade) * Number(detail.precoUnitario);
      return sum + detailSubtotal;
    }, 0);
    
    console.log("Novo total calculado:", total);
    console.log("Detalhes atualizados:", updatedDetails);
    
    // Notificar o componente pai sobre a mudança imediatamente
    onChange(updatedServiceTypes, total, updatedDetails);

    // Limpar campos
    resetForm();
  };

  // Resetar formulário
  const resetForm = () => {
    setCurrentService(null);
    setQuantidade(0);
    setPrecoUnitario(0);
    setIsEditing(false);
  };

  // Remover serviço
  const removeService = (tipo: string) => {
    // Filtrar os arrays em uma única operação para manter consistência
    const updatedDetails = serviceDetails.filter(d => d.tipo !== tipo);
    const updatedServices = updatedDetails.map(d => d.tipo);
    
    // Atualizar ambos os estados
    setServiceDetails(updatedDetails);
    setSelectedServices(updatedServices);
    
    // Calcular o novo total garantindo valores numéricos
    const total = updatedDetails.reduce((sum, detail) => {
      const detailSubtotal = Number(detail.quantidade) * Number(detail.precoUnitario);
      return sum + detailSubtotal;
    }, 0);
    
    console.log("Total após remoção:", total);
    console.log("Detalhes após remoção:", updatedDetails);
    
    // Notificar o componente pai sobre a mudança imediatamente
    onChange(updatedServices, total, updatedDetails);
    
    toast({
      title: "Serviço removido",
      description: `${tipo} removido com sucesso!`,
    });
    
    // Se estiver editando este serviço, limpar o formulário
    if (currentService === tipo) {
      resetForm();
    }
  };
  
  // Editar serviço
  const editService = (detail: ServicoDetalhe) => {
    try {
      // Garantir que estamos trabalhando com valores numéricos
      setCurrentService(detail.tipo);
      setQuantidade(Number(detail.quantidade));
      setUnidade(detail.unidade);
      setPrecoUnitario(Number(detail.precoUnitario));
      setIsEditing(true);
      
      // Rolar para o formulário para facilitar a edição
      const formElement = document.getElementById('service-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (error) {
      console.error("Erro ao editar serviço:", error);
      toast({
        title: "Erro ao editar",
        description: "Não foi possível editar o serviço. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Atualizar valor total material quando os detalhes mudarem
  useEffect(() => {
    // Garantindo que estamos trabalhando com números
    const total = serviceDetails.reduce((sum, detail) => {
      const detailSubtotal = Number(detail.quantidade) * Number(detail.precoUnitario);
      return sum + detailSubtotal;
    }, 0);
    console.log("Atualizando valor total material:", total);
    setValorTotalMaterial(total);
  }, [serviceDetails]);

  // Carregar detalhes iniciais
  const initializedRef = useRef(false);
  
  useEffect(() => {
    // Apenas inicializa uma vez para evitar problemas com re-renderizações
    if (!initializedRef.current) {
      let details: ServicoDetalhe[] = [];
      let services: Array<string> = [];
      
      if (initialDetails && initialDetails.length > 0) {
        // Garantir que estamos lidando com valores numéricos para todos os detalhes
        details = initialDetails.map(detail => ({
          tipo: detail.tipo,
          quantidade: Number(detail.quantidade),
          unidade: detail.unidade,
          precoUnitario: Number(detail.precoUnitario),
          subtotal: Number(detail.quantidade) * Number(detail.precoUnitario)
        }));
        
        // Extrair tipos de serviço dos detalhes
        services = details.map(detail => detail.tipo);
        console.log("Inicializando com detalhes:", details, "Serviços:", services);
      } else if (initialServices && initialServices.length > 0) {
        // Quando temos apenas serviços selecionados sem detalhes, apenas definimos os tipos
        // mas não criamos valores padrão - o usuário precisa adicionar explicitamente
        services = [...initialServices];
        console.log("Inicializando apenas com tipos de serviço:", services);
      }
      
      // Configura os estados
      setServiceDetails(details);
      setSelectedServices(services);
      
      // Calcula o valor total garantindo que estamos usando números
      const total = details.reduce((sum, detail) => {
        const subtotal = Number(detail.quantidade) * Number(detail.precoUnitario);
        return sum + subtotal;
      }, 0);
      
      console.log("Valor total material inicial calculado:", total);
      setValorTotalMaterial(total);
      
      // Notifica o componente pai sobre os valores iniciais
      onChange(services, total, details);
      
      initializedRef.current = true;
    }
  }, [initialDetails, initialServices, onChange]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <Label>{isEditing ? "Editar Serviço" : "Adicionar Serviço"}</Label>
        {!isEditing && (
          <div className="flex space-x-2">
            <div className="relative flex-1">
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
            <Button 
              size="icon" 
              className="bg-blue-500 hover:bg-blue-600 text-white"
              onClick={(e) => {
                e.preventDefault(); // Prevenir submissão do formulário
                e.stopPropagation(); // Parar propagação do evento
                const serviceManagerModal = document.getElementById('service-manager-modal-button');
                if (serviceManagerModal) {
                  (serviceManagerModal as HTMLButtonElement).click();
                }
              }}
              type="button" // Garantir que não seja um botão de submissão
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}

        {!isEditing && searchTerm.trim() !== "" && (
          <div className="border rounded-md bg-white shadow-sm max-h-60 overflow-y-auto">
            <ul className="py-1">
              {filteredServices.map(service => {
                // Verificar se o serviço já existe em serviceDetails, não apenas em selectedServices
                const isAlreadyAdded = serviceDetails.some(detail => detail.tipo === service);
                
                return (
                  <li 
                    key={service}
                    onClick={() => {
                      if (isAlreadyAdded) {
                        // Se já está adicionado, preencher o formulário para edição
                        const detail = serviceDetails.find(d => d.tipo === service);
                        if (detail) {
                          editService(detail);
                        }
                      } else {
                        // Se não está adicionado, iniciar novo serviço
                        setCurrentService(service);
                      }
                      setSearchTerm("");
                    }}
                    className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm ${
                      isAlreadyAdded ? 'bg-blue-50' : ''
                    }`}
                  >
                    {service} {isAlreadyAdded && (
                      <span className="text-blue-500 font-medium ml-1">(já adicionado)</span>
                    )}
                  </li>
                );
              })}
              {filteredServices.length === 0 && (
                <li className="px-4 py-2 text-gray-500 text-sm">Nenhum serviço encontrado</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {currentService && (
        <div id="service-form" className="p-4 border rounded-md bg-gray-50">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-medium">
              {isEditing ? `Editando: ${currentService}` : currentService}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetForm}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input
                id="quantidade"
                type="number"
                min="0"
                step="0.01"
                value={quantidade || ""}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                placeholder="0.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="unidade">Unidade</Label>
              <Select
                value={unidade}
                onValueChange={(value) => setUnidade(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_UNIDADE.map((un) => (
                    <SelectItem key={un} value={un}>
                      {un}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="precoUnitario">Preço Unitário (R$)</Label>
              <Input
                id="precoUnitario"
                type="number"
                min="0"
                step="0.01"
                value={precoUnitario || ""}
                onChange={(e) => setPrecoUnitario(Number(e.target.value))}
                placeholder="0.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subtotal">Subtotal (R$)</Label>
              <Input
                id="subtotal"
                value={formatCurrency(subtotal)}
                disabled
                className="bg-gray-100"
              />
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button 
              type="button"
              variant={isEditing ? "default" : "outline"}
              onClick={resetForm}
              className="mr-2"
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={addOrUpdateServiceDetail}
              disabled={!quantidade || !precoUnitario}
            >
              {isEditing ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Salvar
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {serviceDetails.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-md font-medium">Serviços Adicionados</h3>
          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo de Serviço
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantidade
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unidade
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço Unitário
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subtotal
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {serviceDetails.map((detail, index) => (
                  <tr key={index} className={currentService === detail.tipo ? "bg-blue-50" : ""}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {detail.tipo}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                      {detail.quantidade.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-center">
                      {detail.unidade}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                      {formatCurrency(detail.precoUnitario)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                      {formatCurrency(detail.subtotal)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault(); // Prevenir eventos em formulários
                          e.stopPropagation(); // Evitar propagação para outros handlers
                          editService(detail);
                        }}
                        className="mr-1"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault(); // Prevenir eventos em formulários
                          e.stopPropagation(); // Evitar propagação para outros handlers
                          removeService(detail.tipo);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remover
                      </Button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td colSpan={4} className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                    Valor Total Material:
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                    {formatCurrency(valorTotalMaterial)}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}