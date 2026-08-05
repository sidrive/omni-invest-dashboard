export function parseDateSafe(input) {
  if (!input) return null

  const d1 = new Date(input)
  if (!isNaN(d1)) return d1

  try {
    const cleaned = input.replace(' at ', ' ').replace(' UTC', '')
    const d2 = new Date(cleaned)
    if (!isNaN(d2)) return d2
  } catch {
    // fall through to null below
  }

  return null
}

export function timeAgo(input) {
  const date = parseDateSafe(input)
  if (!date) return '—'

  const diff = Math.floor((Date.now() - date.getTime()) / 1000)

  if (diff < 0) return 'baru saja'
  if (diff < 60) return `${diff} detik lalu`
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`

  return `${Math.floor(diff / 86400)} hari lalu`
}
