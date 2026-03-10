// lib/currency.ts

export const formatUSD = (cents: number | null | undefined, hideCents = false) => {
  if (cents === null || cents === undefined) return '$0'
  const val = cents / 100
  const hasCents = val % 1 !== 0;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: (hideCents && !hasCents) ? 0 : 2,
    maximumFractionDigits: (hideCents && !hasCents) ? 0 : 2,
  }).format(val)
}

export const toCents = (dollars: string | number) => {
  const parsed = typeof dollars === 'string' ? parseFloat(dollars) : dollars
  return Math.round(parsed * 100)
}

export const toDollars = (cents: number) => (cents / 100).toFixed(2)
