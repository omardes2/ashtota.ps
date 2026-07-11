export const CURRENCY = "₪";

export function formatPrice(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  const str = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
  return `${str} ${CURRENCY}`;
}
