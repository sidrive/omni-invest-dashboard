// Lokasi tetap (rumah) — belum ada UI untuk ganti lokasi, sesuai keputusan
// produk saat ini (single location only, lihat design handoff pengingat adzan).
export const ADZAN_LOCATION = {
  latitude: -7.8911012,
  longitude: 110.3189663,
}

// method 20 = KEMENAG, Indonesia — https://aladhan.com/calculation-methods
export const ADZAN_CALCULATION_METHOD = 20

// aladhanKey = nama field di response Aladhan (lihat endpoint /v1/timings).
// hasIqomah/iqomahMinutes menentukan apakah event ini punya fase
// "menjelang iqomah" + "waktu sholat" setelah adzan (Imsak tidak punya).
export const ADZAN_EVENTS_META = [
  { key: 'imsak', label: 'Imsak', aladhanKey: 'Imsak', hasIqomah: false, iqomahMinutes: 0 },
  { key: 'subuh', label: 'Subuh', aladhanKey: 'Fajr', hasIqomah: true, iqomahMinutes: 5 },
  { key: 'dzuhur', label: 'Dzuhur', aladhanKey: 'Dhuhr', hasIqomah: true, iqomahMinutes: 10 },
  { key: 'ashar', label: 'Ashar', aladhanKey: 'Asr', hasIqomah: true, iqomahMinutes: 10 },
  { key: 'maghrib', label: 'Maghrib', aladhanKey: 'Maghrib', hasIqomah: true, iqomahMinutes: 5 },
  { key: 'isya', label: 'Isya', aladhanKey: 'Isha', hasIqomah: true, iqomahMinutes: 10 },
]

export const ADZAN_NOTIF_BEFORE_MIN = 60
export const ADZAN_TAKEOVER_BEFORE_MIN = 10
export const ADZAN_SHOLAT_DURATION_MIN = 5

// Subuh menang kalau window Imsak & Subuh bentrok — Imsak ~10 menit sebelum
// Subuh, jadi window notifikasi (60 menit) keduanya nyaris selalu tumpang
// tindih. Urutan array ini dipakai sebagai urutan prioritas cek di
// getActiveMatch() (lihat adzanStateMachine.js).
export const ADZAN_PRIORITY_ORDER = ['subuh', 'imsak', 'dzuhur', 'ashar', 'maghrib', 'isya']
