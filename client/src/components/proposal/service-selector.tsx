import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus, Search } from "lucide-react";
import { TIPOS_SERVICO } from "@shared/schema";

// Tabela de correspondência para as unidades de medida
const UNIDADES_MEDIDA: Record<string, string> = {
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

// Interface para detalhes de um serviço
interface ServicoDetalhe {
  tipo: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

// Props para o componente
interface ServiceSelectorProps {
  initialServices?: string[];
  initialMaterialValue?: string;
  onChange: (services: string[], valorTotalMaterial: number) => void;
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
  onChange
}: ServiceSelectorProps) {
  // Estados
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredServices, setFilteredServices] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>(initialServices);
  const [serviceDetails, setServiceDetails] = useState<ServicoDetalhe[]>([]);
  const [currentService, setCurrentService] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState<number>(0);
  const [precoUnitario, setPrecoUnitario] = useState<number>(0);
  const [valorTotalMaterial, setValorTotalMaterial] = useState<number>(Number(initialMaterialValue) || 0);

  // Atualizar serviços filtrados baseado no termo de busca
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredServices(TIPOS_SERVICO);
    } else {
      const filtered = TIPOS_SERVICO.filter(service =>
        service.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredServices(filtered);
    }
  }, [searchTerm]);

  // Calcular subtotal
  const subtotal = quantidade * precoUnitario;

  // Adicionar serviço aos detalhes
  const addServiceDetail = () => {
    if (!currentService || quantidade <= 0 || precoUnitario <= 0) return;

    const newDetail: ServicoDetalhe = {
      tipo: currentService,
      quantidade,
      precoUnitario,
      subtotal
    };

    // Verificar se o serviço já existe e atualizar em vez de adicionar novo
    const existingIndex = serviceDetails.findIndex(d => d.tipo === currentService);
    
    if (existingIndex >= 0) {
      const updatedDetails = [...serviceDetails];
      updatedDetails[existingIndex] = newDetail;
      setServiceDetails(updatedDetails);
    } else {
      setServiceDetails(prev => [...prev, newDetail]);
      setSelectedServices(prev => [...prev, currentService]);
    }

    // Limpar campos
    setCurrentService(null);
    setQuantidade(0);
    setPrecoUnitario(0);
  };

  // Remover serviço
  const removeService = (tipo: string) => {
    setServiceDetails(prev => prev.filter(d => d.tipo !== tipo));
    setSelectedServices(prev => prev.filter(s => s !== tipo));
  };

  // Recalcular valor total material quando os detalhes mudarem
  useEffect(() => {
    const total = serviceDetails.reduce((sum, detail) => sum + detail.subtotal, 0);
    setValorTotalMaterial(total);
    
    // Notificar o componente pai sobre as mudanças
    onChange(selectedServices, total);
  }, [serviceDetails, selectedServices, onChange]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <Label>Adicionar Serviço</Label>
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

        {searchTerm.trim() !== "" && (
          <div className="border rounded-md bg-white shadow-sm max-h-60 overflow-y-auto">
            <ul className="py-1">
              {filteredServices.map(service => (
                <li 
                  key={service}
                  onClick={() => {
                    setCurrentService(service);
                    setSearchTerm("");
                  }}
                  className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm ${
                    selectedServices.includes(service) ? 'bg-blue-50' : ''
                  }`}
                >
                  {service} {selectedServices.includes(service) && '(já adicionado)'}
                </li>
              ))}
              {filteredServices.length === 0 && (
                <li className="px-4 py-2 text-gray-500 text-sm">Nenhum serviço encontrado</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {currentService && (
        <div className="p-4 border rounded-md bg-gray-50">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-medium">{currentService}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentService(null)}
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
              <Input
                id="unidade"
                value={UNIDADES_MEDIDA[currentService] || "un"}
                disabled
                className="bg-gray-100"
              />
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
              onClick={addServiceDetail}
              disabled={!quantidade || !precoUnitario}
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
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
                  <tr key={index}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {detail.tipo}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                      {detail.quantidade.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-center">
                      {UNIDADES_MEDIDA[detail.tipo] || "un"}
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
                        onClick={() => {
                          setCurrentService(detail.tipo);
                          setQuantidade(detail.quantidade);
                          setPrecoUnitario(detail.precoUnitario);
                        }}
                        className="mr-1"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeService(detail.tipo)}
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