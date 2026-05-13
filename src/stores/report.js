import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getReport, runPipeline as apiRun } from '@/api'

export const useReportStore = defineStore('report', () => {
  // ── State ──
  const report = ref(null)
  const loading = ref(false)
  const running = ref(false)
  const error = ref(null)

  // ── Getters ──
  const signals = computed(() => report.value?.signals ?? [])
  const summary = computed(() => report.value?.summary ?? {})
  const allokasi = computed(() => report.value?.alokasi ?? {})

  const signalCount = computed(() => signals.value.length)

  const criticalSignals = computed(() =>
    signals.value.filter((s) => s.priority === 'critical'),
  )

  const highPrioritySignals = computed(() =>
    signals.value.filter((s) => s.priority === 'critical' || s.priority === 'high'),
  )

  // ── Actions ──
  async function fetchReport() {
    loading.value = true
    error.value = null
    try {
      const res = await getReport()
      report.value = res.data.data ?? res.data
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function runPipeline() {
    running.value = true
    error.value = null
    try {
      await apiRun()
      // Tunggu pipeline selesai lalu refresh report
      await fetchReport()
      return { ok: true }
    } catch (e) {
      error.value = e.message
      return { ok: false, message: e.message }
    } finally {
      running.value = false
    }
  }

  return {
    report,
    loading,
    running,
    error,
    signals,
    summary,
    allokasi,
    signalCount,
    criticalSignals,
    highPrioritySignals,
    fetchReport,
    runPipeline,
  }
})
