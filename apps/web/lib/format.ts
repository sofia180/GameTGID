export function formatToken(amount: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(amount);
}
