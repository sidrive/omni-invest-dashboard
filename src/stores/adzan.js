import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getTimings } from '@/api/adzan'
import { ADZAN_LOCATION, ADZAN_EVENTS_META } from '@/config/adzan'
import { toAladhanDateParam, dateKey, parseTimeOnDate } from '@/utils/adzanFormat'

export const useAdzanStore = defineStore('adzan', () => {
  // ── State ──
  const events = ref([]) // [{ key, label, hasIqomah, iqomahMinutes, time: Date }]
  const loading = ref(false)
  const error = ref(null)
  const cachedForDate = ref(null) // 'YYYY-MM-DD' — penanda jadwal ini untuk tanggal berapa

  // ── Getters ──
  const eventByKey = computed(() => Object.fromEntries(events.value.map((e) => [e.key, e])))

  // ── Actions ──
  async function fetchTodaySchedule(referenceDate = new Date()) {
    const key = dateKey(referenceDate)
    if (cachedForDate.value === key && events.value.length) return // sudah ada untuk tanggal ini

    loading.value = true
    error.value = null
    try {
      const res = await getTimings(
        toAladhanDateParam(referenceDate),
        ADZAN_LOCATION.latitude,
        ADZAN_LOCATION.longitude,
      )
      const timings = res.data?.data?.timings
      if (!timings) throw new Error('Respons jadwal sholat tidak lengkap')

      events.value = ADZAN_EVENTS_META.map((meta) => ({
        key: meta.key,
        label: meta.label,
        hasIqomah: meta.hasIqomah,
        iqomahMinutes: meta.iqomahMinutes,
        time: parseTimeOnDate(timings[meta.aladhanKey], referenceDate),
      }))
      cachedForDate.value = key
    } catch (err) {
      console.error('[ADZAN_FETCH_ERROR]', err)
      error.value = 'Gagal memuat jadwal sholat'
    } finally {
      loading.value = false
    }
  }

  return { events, eventByKey, loading, error, fetchTodaySchedule }
})
