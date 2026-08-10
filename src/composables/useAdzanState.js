import { computed, watch, onMounted } from 'vue'
import { useAdzanStore } from '@/stores/adzan'
import { getActiveMatch } from '@/utils/adzanStateMachine'

/**
 * @param {import('vue').Ref<Date>} now - jam yang sama dipakai komponen lain
 *   (dari useClock() di useSTBMode.js) — dioper sebagai parameter (bukan
 *   dibuat sendiri di sini) supaya tidak ada timer 1-detik duplikat kalau
 *   dipanggil bareng komponen lain yang juga butuh jam berjalan.
 */
export function useAdzanState(now) {
  const store = useAdzanStore()

  onMounted(() => {
    store.fetchTodaySchedule(now.value)
  })

  // Refetch otomatis begitu tanggal kalender berganti (lewat tengah malam).
  watch(now, (val, prev) => {
    if (prev && val.getDate() !== prev.getDate()) {
      store.fetchTodaySchedule(val)
    }
  })

  const activeMatch = computed(() => getActiveMatch(now.value, store.events))

  const phase = computed(() => activeMatch.value?.phase ?? 'idle')
  const activeEvent = computed(() => activeMatch.value?.event ?? null)
  const countdownTarget = computed(() => activeMatch.value?.target ?? null)
  const countdownRemainingMs = computed(() =>
    countdownTarget.value
      ? Math.max(0, countdownTarget.value.getTime() - now.value.getTime())
      : null,
  )
  const isTakeover = computed(() => phase.value.startsWith('takeover'))

  // Dipakai widget jadwal (idle state) buat highlight waktu berikutnya.
  const nextEvent = computed(() => {
    const upcoming = store.events
      .filter((e) => e.time.getTime() > now.value.getTime())
      .sort((a, b) => a.time.getTime() - b.time.getTime())
    return upcoming[0] ?? null
  })

  return {
    events: computed(() => store.events),
    loading: computed(() => store.loading),
    error: computed(() => store.error),
    phase,
    activeEvent,
    countdownTarget,
    countdownRemainingMs,
    isTakeover,
    nextEvent,
    fetchTodaySchedule: store.fetchTodaySchedule,
  }
}
