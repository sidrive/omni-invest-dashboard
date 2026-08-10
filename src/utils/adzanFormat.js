export function toAladhanDateParam(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`
}

export function dateKey(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// Aladhan kadang mengembalikan format "04:32 (WIB)" — ambil jam:menit-nya saja,
// lalu tempelkan ke referenceDate (jam device dianggap sudah WIB yang benar).
export function parseTimeOnDate(timeStr, referenceDate) {
  const clean = timeStr.split(' ')[0]
  const [h, m] = clean.split(':').map(Number)
  const d = new Date(referenceDate)
  d.setHours(h, m, 0, 0)
  return d
}

// "HH:MM:SS" kalau >= 1 jam, "MM:SS" kalau di bawah itu.
export function formatCountdown(ms) {
  if (ms == null) return '--:--:--'
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const pad = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

export function formatClock(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}
