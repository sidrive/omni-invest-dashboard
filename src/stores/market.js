import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getMarket } from '@/api'

export const useMarketStore = defineStore('market', () => {
  // ── State ──
  const market = ref(null)
  const lastSync = ref('--')
  const loading = ref(false)
  const error = ref(null)

  // ── Getters ──
  const goldPrice = computed(() => market.value?.emas?.price ?? null)

  // Response shape: market.saham.stocks = [{ ticker, price, change_pct, ... }]
  const stockList = computed(() => market.value?.saham?.stocks ?? [])

  // ── Actions ──
  async function fetchMarket() {
    loading.value = true
    error.value = null
    try {
      const res = await getMarket()
      market.value = res.data.data ?? res.data
      // Prefer server timestamp, fallback ke waktu lokal
      lastSync.value =
        market.value?.fetched_at
          ? new Date(market.value.fetched_at).toLocaleTimeString('id-ID')
          : new Date().toLocaleTimeString('id-ID')
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  return { market, lastSync, loading, error, goldPrice, stockList, fetchMarket }
})
