/**
 * Formata um número para o formato de moeda brasileira (R$)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(value);
}

/**
 * Converte uma string de moeda (ex: R$ 1.234,56) para número (1234.56)
 */
export function parseCurrencyToNumber(value: string): number {
  // Remove símbolos, pontos de milhar e substitui vírgula por ponto
  const numericValue = value
    .replace(/[^\d,.-]/g, '')  // Remove tudo exceto dígitos, vírgula, ponto e sinal
    .replace('.', '')          // Remove pontos (separadores de milhar)
    .replace(',', '.');        // Substitui vírgula por ponto (para decimal)
    
  return parseFloat(numericValue);
}

/**
 * Formata uma data para o formato brasileiro (DD/MM/YYYY)
 */
export function formatDate(date: Date | string): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR');
}

/**
 * Formata um número para porcentagem com uma casa decimal
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Alias para formatPercent (compatibilidade com código existente)
 */
export function formatPercentage(value: number): string {
  return formatPercent(value);
}

/**
 * Formata um número para porcentagem sem casas decimais
 */
export function formatIntegerPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Determina a cor da porcentagem de acordo com o valor
 * Vermelho: 0%
 * Amarelo: entre 0.1% e 99.9%
 * Verde: 100%
 */
export function getPercentColor(percent: number): string {
  if (percent <= 0) return 'text-red-500';
  if (percent >= 100) return 'text-green-600';
  return 'text-amber-500';
}