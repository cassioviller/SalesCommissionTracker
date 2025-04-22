import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchFilterProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SearchFilter({ placeholder = "Buscar...", value, onChange, className = "" }: SearchFilterProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-8"
      />
    </div>
  );
}