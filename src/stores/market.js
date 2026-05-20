import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getMarket, getGoldHistory } from '@/api'

export const useMarketStore = defineStore('market', () => {
  // ── State ──
  const market = ref(null)
  const lastSync = ref('--')
  const loading = ref(false)
  const error = ref(null)
  const goldHistory = ref([])

  // ── Getters ──
  const goldPrice = computed(() => market.value?.emas?.price ?? null)

  // Response shape: market.saham.stocks = [{ ticker, price, change_pct, ... }]
  const stockList = computed(() => market.value?.saham?.stocks ?? [])

  const goldSparklineData = computed(() => {
    if (goldHistory.value.length < 2) return null
    return goldHistory.value.map((h) => h.price)
  })

  const goldChangePct = computed(() => {
    const h = goldHistory.value
    if (h.length < 2) return 0
    const prev = h[h.length - 2].price
    const curr = h[h.length - 1].price
    return Number(((curr - prev) / prev * 100).toFixed(2))
  })

  // ── Actions ──
  async function fetchGoldHistory() {
    try {
      const res = await getGoldHistory()
      goldHistory.value = res.data || []
    } catch (e) {
      console.error('Gold history error:', e)
      goldHistory.value = []
    }
  }

  async function fetchMarket() {
    loading.value = true
    error.value = null
    try {
      const res = await getMarket()
      market.value = res.data
      // Prefer server timestamp, fallback ke waktu lokal
      lastSync.value =
        market.value?.fetched_at
          ? new Date(market.value.fetched_at).toLocaleTimeString('id-ID')
          : new Date().toLocaleTimeString('id-ID')
      // Fetch gold history secara bersamaan (tidak blocking)
      fetchGoldHistory()
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  return {
    market, lastSync, loading, error, goldHistory,
    goldPrice, stockList, goldSparklineData, goldChangePct,
    fetchMarket, fetchGoldHistory,
  }
})
