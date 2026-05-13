/**
 * Format number to Rupiah string, e.g. 1234567 → "Rp1.234.567"
 */
export function formatRupiah(n) {
  if (n == null || isNaN(n)) return 'Rp0'
  return 'Rp' + Math.round(n).toLocaleString('id-ID')
}

/**
 * Format number in millions with 1 decimal, e.g. 12400000 → "12.4"
 */
export function formatJuta(n) {
  if (n == null || isNaN(n)) return '0'
  return (n / 1_000_000).toFixed(1)
}

/**
 * Format percentage with sign, e.g. 12.96 → "+12.96%" or -3.2 → "-3.20%"
 */
export function formatPct(n) {
  if (n == null || isNaN(n)) return '0.00%'
  const sign = n >= 0 ? '+' : ''
  return `${sign}${Number(n).toFixed(2)}%`
}

/**
 * Format grams, e.g. 10.5 → "10.5g"
 */
export function formatGram(n) {
  if (n == null || isNaN(n)) return '0g'
  return `${n}g`
}

/**
 * Format lot count, e.g. 50 → "50 lot"
 */
export function formatLot(n) {
  if (n == null || isNaN(n)) return '0 lot'
  return `${n} lot`
}

/**
 * Format unit count with thousand separator, e.g. 12450 → "12.450 unit"
 */
export function formatUnit(n) {
  if (n == null || isNaN(n)) return '0 unit'
  return `${Number(n).toLocaleString('id-ID')} unit`
}

/**
 * Return CSS class name based on profit/loss value
 */
export function colorPL(value) {
  if (value > 0) return 'text-green'
  if (value < 0) return 'text-red'
  return 'text-muted'
}

/**
 * Return arrow character based on profit/loss value
 */
export function arrowPL(value) {
  if (value > 0) return '▲'
  if (value < 0) return '▼'
  return '—'
}

/**
 * Format a datetime string to locale, e.g. "2026-05-12T09:00:31" → "12/05/2026, 09.00"
 */
export function formatDateTime(str) {
  if (!str) return '--'
  const d = new Date(str)
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format a number as compact Rupiah for display in stat cards, e.g. 120562070 → "Rp120,6 jt"
 */
export function formatRupiahCompact(n) {
  if (n == null || isNaN(n)) return 'Rp0'
  const juta = n / 1_000_000
  if (Math.abs(juta) >= 1000) {
    return `Rp${(juta / 1000).toFixed(1)} M`
  }
  return `Rp${juta.toFixed(1)} jt`
}
