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
      const data = res.data ?? []
      console.log('[TX] fetched:', data.length, 'transactions')
      transactions.value = data
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
      await apiAdd(data)
      const { useReportStore } = await import('@/stores/report')
      const reportStore = useReportStore()
      reportStore.startPipelinePolling(Date.now())
      await fetchTransactions()
      return { ok: true }
    } catch (e) {
      error.value = e.message
      return { ok: false, message: e.message }
    } finally {
      loading.value = false
    }
  }

  return { transactions, loading, error, fetchTransactions, addTransaction }
})
