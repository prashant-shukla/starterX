export function formatNumber(value: number | string): string {
  if (value === null || value === undefined) return ''
  const num = typeof value === 'number' ? value : Number(String(value))
  if (!Number.isFinite(num)) return String(value)
  return num.toLocaleString('en-US')
}
