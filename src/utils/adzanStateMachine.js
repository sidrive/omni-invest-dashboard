import {
  ADZAN_NOTIF_BEFORE_MIN,
  ADZAN_TAKEOVER_BEFORE_MIN,
  ADZAN_SHOLAT_DURATION_MIN,
  ADZAN_PRIORITY_ORDER,
} from '@/config/adzan'

const MIN_MS = 60 * 1000

/**
 * Klasifikasikan satu event (mis. "subuh") terhadap waktu `now`.
 * Return null kalau `now` di luar semua window event ini (fase idle untuknya).
 *
 * Timeline per event (yang punya iqomah, mis. 5 waktu sholat):
 *   [notifikasi 60..10 menit sebelum] [takeover-adzan 10..0 menit sebelum]
 *   [adzan] [takeover-iqomah] [iqomah] [takeover-sholat 5 menit] [selesai]
 *
 * Imsak cuma punya notifikasi + takeover-adzan (tanpa iqomah/sholat).
 */
export function classifyEvent(now, event) {
  const nowMs = now.getTime()
  const adzanMs = event.time.getTime()
  const notifStartMs = adzanMs - ADZAN_NOTIF_BEFORE_MIN * MIN_MS
  const takeoverStartMs = adzanMs - ADZAN_TAKEOVER_BEFORE_MIN * MIN_MS

  if (event.hasIqomah) {
    const iqomahMs = adzanMs + event.iqomahMinutes * MIN_MS
    const sholatEndMs = iqomahMs + ADZAN_SHOLAT_DURATION_MIN * MIN_MS

    if (nowMs >= takeoverStartMs && nowMs < adzanMs) {
      return { phase: 'takeover-adzan', target: event.time }
    }
    if (nowMs >= adzanMs && nowMs < iqomahMs) {
      return { phase: 'takeover-iqomah', target: new Date(iqomahMs) }
    }
    if (nowMs >= iqomahMs && nowMs < sholatEndMs) {
      return { phase: 'takeover-sholat', target: new Date(sholatEndMs) }
    }
    if (nowMs >= notifStartMs && nowMs < takeoverStartMs) {
      return { phase: 'notification', target: event.time }
    }
    return null
  }

  // Imsak: cuma countdown ke waktunya, tidak ada fase setelahnya.
  if (nowMs >= takeoverStartMs && nowMs < adzanMs) {
    return { phase: 'takeover-adzan', target: event.time }
  }
  if (nowMs >= notifStartMs && nowMs < takeoverStartMs) {
    return { phase: 'notification', target: event.time }
  }
  return null
}

/**
 * Tentukan state aktif di antara semua event hari ini pada waktu `now`.
 *
 * Aturan:
 *  1. Fase takeover (full-screen) SELALU menang atas fase notification
 *     (non-blocking) di event manapun — dicek dulu di semua event sebelum
 *     mempertimbangkan notification sama sekali.
 *  2. Kalau lebih dari satu event match di fase yang sama (praktiknya cuma
 *     Imsak vs Subuh yang berdekatan), yang lebih dulu di
 *     ADZAN_PRIORITY_ORDER yang menang — Subuh ditaruh sebelum Imsak di
 *     situ supaya Subuh yang tampil sesuai keputusan produk.
 *
 * Return null kalau tidak ada event yang match sama sekali (fase idle).
 */
export function getActiveMatch(now, events) {
  const byKey = Object.fromEntries(events.map((e) => [e.key, e]))

  for (const key of ADZAN_PRIORITY_ORDER) {
    const event = byKey[key]
    if (!event) continue
    const result = classifyEvent(now, event)
    if (result?.phase?.startsWith('takeover')) return { event, ...result }
  }

  for (const key of ADZAN_PRIORITY_ORDER) {
    const event = byKey[key]
    if (!event) continue
    const result = classifyEvent(now, event)
    if (result?.phase === 'notification') return { event, ...result }
  }

  return null
}
