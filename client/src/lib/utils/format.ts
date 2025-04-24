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
 * Formata uma data para o formato brasileiro (DD/MM/YYYY)
 */
export function formatDate(date: Date | string): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR');
}

/**
 * Formata um número para porcentagem
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
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