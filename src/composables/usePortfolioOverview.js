import { computed } from 'vue'
import { useReportStore } from '@/stores/report'
import { formatRupiah } from '@/utils/formatters'

// Logika turunan Emas/Saham/Valas/Reksa Dana yang dipakai bareng oleh
// DashboardView (browser) dan StbDashboardView (kiosk) — dipusatkan di sini
// supaya kedua tampilan selalu menghitung dari sumber yang sama persis.
export function usePortfolioOverview() {
  const reportStore = useReportStore()

  const summary = computed(() => reportStore.summary)
  const allokasi = computed(() => reportStore.allokasi)

  const emasItems = computed(() => reportStore.report?.emas?.items ?? [])
  const emasTotal = computed(() => {
    const modal = emasItems.value.reduce((s, i) => s + (i.modal ?? 0), 0)
    const pl = emasItems.value.reduce((s, i) => s + (i.pl ?? 0), 0)
    const nilai = emasItems.value.reduce((s, i) => s + (i.nilai_pasar ?? 0), 0)
    return { modal, pl, nilai, pl_pct: modal > 0 ? (pl / modal) * 100 : 0 }
  })

  const sahamItems = computed(() => reportStore.report?.saham?.items ?? [])
  const sahamTotal = computed(() => {
    const modal = sahamItems.value.reduce((s, i) => s + (i.modal ?? 0), 0)
    const pl = sahamItems.value.reduce((s, i) => s + (i.pl ?? 0), 0)
    const nilai = sahamItems.value.reduce((s, i) => s + (i.nilai_pasar ?? 0), 0)
    return { modal, pl, nilai, pl_pct: modal > 0 ? (pl / modal) * 100 : 0 }
  })

  const valasItems = computed(() => reportStore.valasItems)
  const valasSummary = computed(() => reportStore.valasSummary)

  const reksaItems = computed(() => reportStore.report?.reksadana?.items ?? [])
  const reksaNaik = computed(() => reksaItems.value.filter((i) => (i.pl ?? 0) > 0))
  const reksaTurun = computed(() => reksaItems.value.filter((i) => (i.pl ?? 0) <= 0))
  const reksaTotal = computed(() => {
    const modal = reksaItems.value.reduce((s, i) => s + (i.modal ?? 0), 0)
    const pl = reksaItems.value.reduce((s, i) => s + (i.pl ?? 0), 0)
    const nilai = reksaItems.value.reduce((s, i) => s + (i.nilai_pasar ?? 0), 0)
    return { modal, pl, nilai, pl_pct: modal > 0 ? (pl / modal) * 100 : 0 }
  })
  const reksaNaikTotal = computed(() => ({
    nilai: reksaNaik.value.reduce((s, i) => s + (i.nilai_pasar ?? 0), 0),
    pl: reksaNaik.value.reduce((s, i) => s + (i.pl ?? 0), 0),
  }))
  const reksaTurunTotal = computed(() => ({
    nilai: reksaTurun.value.reduce((s, i) => s + (i.nilai_pasar ?? 0), 0),
    pl: reksaTurun.value.reduce((s, i) => s + (i.pl ?? 0), 0),
  }))

  const FLAG_MAP = { USD: '🇺🇸', SGD: '🇸🇬', EUR: '🇪🇺', JPY: '🇯🇵' }
  function formatQtyValas(code, qty) {
    if (qty == null) return '—'
    if (code === 'JPY') return Math.round(qty).toLocaleString('id-ID')
    return qty.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  // "+Rp1.234" untuk positif, "-Rp1.234" untuk negatif, "Rp0" untuk nol
  function fmtPL(n) {
    if (!n || n === 0) return formatRupiah(0)
    return (n > 0 ? '+' : '-') + formatRupiah(Math.abs(n))
  }
  function fmtPct(n) {
    if (!n) return '0.00%'
    return (n > 0 ? '+' : '') + Number(n).toFixed(2) + '%'
  }

  return {
    summary,
    allokasi,
    emasItems,
    emasTotal,
    sahamItems,
    sahamTotal,
    valasItems,
    valasSummary,
    reksaItems,
    reksaNaik,
    reksaTurun,
    reksaTotal,
    reksaNaikTotal,
    reksaTurunTotal,
    FLAG_MAP,
    formatQtyValas,
    fmtPL,
    fmtPct,
  }
}
