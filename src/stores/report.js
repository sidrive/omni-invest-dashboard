import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getReport, runPipeline as apiRun } from '@/api'
import { usePortfolioStore } from '@/stores/portfolio'

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

  const valasSummary = computed(() =>
    report.value?.valas?.summary ?? { total_modal: 0, total_nilai: 0, total_pl: 0, total_pl_pct: 0 },
  )

  const valasItems = computed(() => report.value?.valas?.items ?? [])

  // ── Actions ──
  async function fetchReport() {
    loading.value = true
    error.value = null
    try {
      const res = await getReport()
      const data = res.data

      // Patch current_nab from portfolio store when report doesn't have it
      if (data?.reksadana?.items?.length) {
        const portfolioReksa = usePortfolioStore().reksaList
        data.reksadana.items = data.reksadana.items.map((item) => {
          if (item.current_nab) return item
          const pfItem = portfolioReksa.find((p) => p.id === item.id)
          if (!pfItem?.current_nab) return item
          const nab = pfItem.current_nab
          const modal = (item.qty_unit ?? 0) * (item.avg_nab ?? 0)
          const nilaiPasar = (item.qty_unit ?? 0) * nab
          const pl = nilaiPasar - modal
          const plPct = modal > 0 ? (pl / modal) * 100 : 0
          return { ...item, current_nab: nab, nilai_pasar: nilaiPasar, pl, pl_pct: plPct }
        })
      }

      report.value = data
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
    valasSummary,
    valasItems,
    fetchReport,
    runPipeline,
  }
})
