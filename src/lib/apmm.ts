export function computeApmm(accidents: number, miles: number): number | null {
  if (!miles) return null;
  return (accidents / miles) * 1_000_000;
}
