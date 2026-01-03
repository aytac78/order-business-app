export function formatCurrency(amount: number, locale: string = 'tr'): string {
  const config: Record<string, { symbol: string; decimal: string; thousand: string }> = {
    tr: { symbol: '₺', decimal: ',', thousand: '.' },
    en: { symbol: '$', decimal: '.', thousand: ',' },
    it: { symbol: '€', decimal: ',', thousand: '.' },
  };
  
  const { symbol, decimal, thousand } = config[locale] || config.tr;
  const parts = amount.toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousand);
  
  return `${symbol}${integerPart}${decimal}${parts[1]}`;
}

export function formatDate(date: Date | string, locale: string = 'tr'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  
  if (locale === 'en') return `${month}/${day}/${year}`;
  return `${day}.${month}.${year}`;
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}
