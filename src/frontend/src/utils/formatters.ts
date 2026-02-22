export function formatCurrency(amount: bigint, currency: string): string {
  const numAmount = Number(amount) / 100;
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${numAmount.toFixed(2)}`;
}

export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
  };
  return symbols[currency] || '$';
}

export function formatDate(timestamp: bigint): string {
  const date = new Date(Number(timestamp) / 1_000_000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
