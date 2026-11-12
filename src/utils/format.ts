export type CurrencyCode = 'PEN' | 'USD' | 'EUR';

export const CURRENCY_SETTING_KEY = 'preferred_currency';

export const CURRENCIES: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: 'PEN', label: 'Sol peruano', symbol: 'S/' },
  { code: 'USD', label: 'Dólar estadounidense', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
];

export function isValidCurrency(value: string | null | undefined): value is CurrencyCode {
  return value === 'PEN' || value === 'USD' || value === 'EUR';
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  PEN: 'S/',
  USD: '$',
  EUR: '€',
};

let displayCurrency: string = 'PEN';

export function setDisplayCurrency(currency: string): void {
  displayCurrency = currency;
}

export function getDisplayCurrency(): string {
  return displayCurrency;
}

export function currencyLabel(code: string): string {
  return CURRENCIES.find((currency) => currency.code === code)?.label ?? code;
}

export function formatMoney(amount: number, currency = getDisplayCurrency()): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const sign = amount < 0 ? '-' : '';
  const [intPart, decPart] = Math.abs(amount).toFixed(2).split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}${symbol} ${grouped}.${decPart}`;
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
  }
  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${bytes} B`;
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
