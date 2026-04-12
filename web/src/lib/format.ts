export function scaleQuantity(quantity: string | null, multiplier: number): string | null {
  if (!quantity) return quantity;
  const trimmed = quantity.trim();
  const slashMatch = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (slashMatch) {
    const value = (Number(slashMatch[1]) / Number(slashMatch[2])) * multiplier;
    return formatNumber(value);
  }
  const range = trimmed.match(/^(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)$/);
  if (range) {
    return `${formatNumber(Number(range[1]) * multiplier)}-${formatNumber(Number(range[2]) * multiplier)}`;
  }
  const num = Number(trimmed.replace(',', '.'));
  if (Number.isFinite(num)) return formatNumber(num * multiplier);
  return quantity;
}

function formatNumber(n: number): string {
  if (Math.abs(n - Math.round(n)) < 0.001) return String(Math.round(n));
  return n.toFixed(2).replace(/\.?0+$/, '');
}

export function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hours} h` : `${hours} h ${mins} min`;
}

export function priceTierLabel(tier: number): string {
  return '$'.repeat(Math.max(1, Math.min(5, tier)));
}
