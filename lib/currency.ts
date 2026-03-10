// lib/currency.ts

export const formatUSD = (cents: number | null | undefined) => {
  if (cents === null || cents === undefined) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(cents / 100)
}

export const toCents = (dollars: string | number) => {
  const parsed = typeof dollars === 'string' ? parseFloat(dollars) : dollars
  return Math.round(parsed * 100)
}

export const toDollars = (cents: number) => (cents / 100).toFixed(2)
