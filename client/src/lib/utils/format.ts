/**
 * Formata um número como valor monetário em Real brasileiro (R$)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Converte uma string de valor monetário (ex: "R$ 1.234,56") para número
 */
export function parseCurrencyToNumber(currencyStr: string): number {
  // Remove símbolo de moeda, pontos e substitui vírgula por ponto
  const cleanedStr = currencyStr
    .replace(/[^\d,.-]/g, '')  // Remove tudo exceto dígitos, vírgula, ponto e sinal
    .replace(/\./g, '')        // Remove pontos de milhar
    .replace(',', '.');        // Substitui vírgula decimal por ponto

  return parseFloat(cleanedStr) || 0;
}

/**
 * Formata um número como percentual com zero casas decimais
 */
export function formatIntegerPercentage(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value / 100);
}

/**
 * Formata um número como percentual com uma casa decimal
 */
export function formatDecimalPercentage(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

/**
 * Formata uma data no formato brasileiro (dd/mm/aaaa)
 */
export function formatDate(date: Date | string): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR');
}

/**
 * Formata peso em quilos com o sufixo "kg"
 */
export function formatWeight(value: number): string {
  return `${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)} kg`;
}