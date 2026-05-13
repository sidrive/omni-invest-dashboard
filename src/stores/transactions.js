import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getTransactions, addTransaction as apiAdd } from '@/api'

export const useTransactionsStore = defineStore('transactions', () => {
  // ── State ──
  const transactions = ref([])
  const loading = ref(false)
  const error = ref(null)

  // ── Actions ──
  async function fetchTransactions() {
    loading.value = true
    error.value = null
    try {
      const res = await getTransactions()
      transactions.value = res.data.data ?? res.data ?? []
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function addTransaction(data) {
    loading.value = true
    error.value = null
    try {
      const res = await apiAdd(data)
      const newTx = res.data.data ?? res.data
      transactions.value.unshift(newTx)
      return { ok: true, data: newTx }
    } catch (e) {
      error.value = e.message
      return { ok: false, message: e.message }
    } finally {
      loading.value = false
    }
  }

  return { transactions, loading, error, fetchTransactions, addTransaction }
})
