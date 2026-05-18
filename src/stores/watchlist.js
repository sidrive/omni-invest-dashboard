import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getWatchlist as apiGet,
  saveWatchlist as apiSave,
  validateTicker as apiValidate,
} from '@/api'

export const useWatchlistStore = defineStore('watchlist', () => {
  // ── State ──
  const watchlist = ref({ saham: [], reksa: [] })
  const loading = ref(false)
  const saving = ref(false)
  const error = ref(null)

  // ── Actions ──
  async function fetchWatchlist() {
    loading.value = true
    error.value = null
    try {
      const res = await apiGet()
      watchlist.value = res.data ?? { saham: [], reksa: [] }
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function saveWatchlist(data) {
    saving.value = true
    error.value = null
    try {
      await apiSave(data)
      watchlist.value = data
      return { ok: true }
    } catch (e) {
      error.value = e.message
      return { ok: false, message: e.message }
    } finally {
      saving.value = false
    }
  }

  async function validateTicker(ticker) {
    error.value = null
    try {
      const res = await apiValidate(ticker)
      // expected: { valid, ticker, name, price }
      return res.data
    } catch (e) {
      error.value = e.message
      return { valid: false, ticker, name: null, price: null }
    }
  }

  return {
    watchlist,
    loading,
    saving,
    error,
    fetchWatchlist,
    saveWatchlist,
    validateTicker,
  }
})
