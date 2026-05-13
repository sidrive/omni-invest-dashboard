import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getPortfolio, savePortfolio as apiSave } from '@/api'

export const usePortfolioStore = defineStore('portfolio', () => {
  // ── State ──
  const portfolio = ref(null)
  const originalPortfolio = ref(null)
  const hasChanges = ref(false)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref(null)

  // ── Getters ──
  const emasList = computed(() => portfolio.value?.emas ?? [])
  const sahamList = computed(() => portfolio.value?.saham ?? [])
  const reksaList = computed(() => portfolio.value?.reksadana ?? [])

  const allItemsCount = computed(
    () => emasList.value.length + sahamList.value.length + reksaList.value.length,
  )

  // Modal total dihitung dari data portofolio (bukan report) — pakai avg × qty
  const totalModal = computed(() => {
    const emasModal = emasList.value.reduce(
      (s, i) => s + (i.qty_gram ?? 0) * (i.avg_buy_price ?? 0),
      0,
    )
    const sahamModal = sahamList.value.reduce(
      (s, i) => s + (i.qty_lot ?? 0) * 100 * (i.avg_buy_price ?? 0),
      0,
    )
    const reksaModal = reksaList.value.reduce(
      (s, i) => s + (i.qty_unit ?? 0) * (i.avg_buy_nab ?? 0),
      0,
    )
    return emasModal + sahamModal + reksaModal
  })

  // ── Actions ──
  async function fetchPortfolio() {
    loading.value = true
    error.value = null
    try {
      const res = await getPortfolio()
      const data = res.data.data ?? res.data
      portfolio.value = data
      // Simpan snapshot untuk deteksi perubahan
      originalPortfolio.value = JSON.parse(JSON.stringify(data))
      hasChanges.value = false
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function savePortfolio(data) {
    saving.value = true
    error.value = null
    try {
      const res = await apiSave(data)
      const saved = res.data.data ?? res.data
      portfolio.value = saved
      originalPortfolio.value = JSON.parse(JSON.stringify(saved))
      hasChanges.value = false
      return { ok: true }
    } catch (e) {
      error.value = e.message
      return { ok: false, message: e.message }
    } finally {
      saving.value = false
    }
  }

  function markChanged() {
    hasChanges.value = true
  }

  function resetChanges() {
    if (originalPortfolio.value) {
      portfolio.value = JSON.parse(JSON.stringify(originalPortfolio.value))
    }
    hasChanges.value = false
  }

  return {
    portfolio,
    originalPortfolio,
    hasChanges,
    loading,
    saving,
    error,
    emasList,
    sahamList,
    reksaList,
    allItemsCount,
    totalModal,
    fetchPortfolio,
    savePortfolio,
    markChanged,
    resetChanges,
  }
})
