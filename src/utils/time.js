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

// Backend Zakanet (zakanet-backend-monitoring) sekarang kirim `offline_since`
// — diisi SEKALI saat transisi online->offline, tidak disentuh lagi selama
// tetap offline (beda dari `last_ping` yang terus di-update tiap
// ping/heartbeat walau gagal). Pakai ini untuk durasi "sudah berapa lama
// offline" supaya tidak reset ke angka kecil tiap ada percobaan ping baru.
// Fallback ke `last_ping` untuk kompatibilitas data lama yang belum punya
// field ini.
export function offlineSince(client) {
  return client?.offline_since ?? client?.last_ping ?? null
}

// Format durasi offline sebagai "HH Jam mm Menit yang lalu" (dipakai khusus
// untuk tampilan durasi offline — bukan pengganti timeAgo() yang masih
// dipakai untuk "Last ping" perangkat online). Di bawah 1 jam, bagian "Jam"
// dihilangkan — cukup "mm Menit yang lalu".
export function offlineDuration(input) {
  const date = parseDateSafe(input)
  if (!date) return '—'

  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  const totalMinutes = Math.floor(diffSec / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const pad = (n) => String(n).padStart(2, '0')

  if (hours < 1) return `${pad(minutes)} Menit yang lalu`
  return `${pad(hours)} Jam ${pad(minutes)} Menit yang lalu`
}
