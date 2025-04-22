import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SalesProposal } from "@shared/schema";

interface ProposalComboboxProps {
  proposals: SalesProposal[];
  selectedProposalIds: number[];
  onSelectProposal: (id: number) => void;
  onUnselectProposal: (id: number) => void;
  className?: string;
}

export function ProposalCombobox({
  proposals,
  selectedProposalIds,
  onSelectProposal,
  onUnselectProposal,
  className
}: ProposalComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  // Filtrar propostas baseado na busca
  const filteredProposals = React.useMemo(() => {
    if (!searchValue.trim()) return proposals;
    
    return proposals.filter(proposal => 
      proposal.proposta.toLowerCase().includes(searchValue.toLowerCase()) ||
      String(proposal.valorTotal).includes(searchValue)
    );
  }, [proposals, searchValue]);

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedProposalIds.length === 0
              ? "Selecionar propostas..."
              : `${selectedProposalIds.length} proposta(s) selecionada(s)`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput 
              placeholder="Buscar proposta..." 
              className="h-9"
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandEmpty>Nenhuma proposta encontrada.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-y-auto">
              {filteredProposals.map((proposal) => {
                const isSelected = selectedProposalIds.includes(proposal.id);
                return (
                  <CommandItem
                    key={proposal.id}
                    value={String(proposal.id)}
                    onSelect={() => {
                      if (isSelected) {
                        onUnselectProposal(proposal.id);
                      } else {
                        onSelectProposal(proposal.id);
                      }
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{proposal.proposta}</span>
                      <span className="text-xs text-muted-foreground">
                        Valor: R$ {Number(proposal.valorTotal).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      
      {selectedProposalIds.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {selectedProposalIds.map(id => {
            const proposal = proposals.find(p => p.id === id);
            if (!proposal) return null;
            
            return (
              <div 
                key={id} 
                className="bg-primary/10 text-primary text-xs rounded-md py-1 px-2 flex items-center"
              >
                <span className="mr-1">{proposal.proposta}</span>
                <button 
                  type="button" 
                  className="text-primary hover:text-primary/80"
                  onClick={() => onUnselectProposal(id)}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}