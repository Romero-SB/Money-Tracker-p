const CURRENCY_SYMBOLS: Record<string, string> = {
  PEN: 'S/',
  USD: '$',
  EUR: '€',
};

export function formatMoney(amount: number, currency = 'PEN'): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const sign = amount < 0 ? '-' : '';
  const [intPart, decPart] = Math.abs(amount).toFixed(2).split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}${symbol} ${grouped}.${decPart}`;
}

export function parseAmount(text: string): number | null {
  const normalized = text.trim().replace(/\s/g, '').replace(/,/g, '.');
  if (!normalized) {
    return null;
  }
  const value = Number(normalized);
  if (!Number.isFinite(value)) {
    return null;
  }
  return value;
}
