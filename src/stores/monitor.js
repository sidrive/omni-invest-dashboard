import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getClients, getClusters, syncClients as apiSyncClients } from '@/api/monitor'
import { parseDateSafe, offlineSince } from '@/utils/time'

export const useMonitorStore = defineStore('monitor', () => {
  // ── State ──
  const clients = ref([])
  const clusters = ref([])
  const loading = ref(false)
  const error = ref(null)
  const lastSyncAt = ref(null)
  let pollingTimer = null

  // ── Getters ──
  const online = computed(() => !error.value && lastSyncAt.value != null)
  const totalCount = computed(() => clients.value.length)
  const onlineCount = computed(() => clients.value.filter((c) => c.status === 'online').length)
  const offlineCount = computed(() => clients.value.filter((c) => c.status === 'offline').length)
  const uptimePct = computed(() =>
    totalCount.value ? Math.round((onlineCount.value / totalCount.value) * 1000) / 10 : 0,
  )
  const offlineList = computed(() =>
    clients.value
      .filter((c) => c.status === 'offline')
      .slice()
      // Urut "paling lama offline" pakai offline_since (fallback last_ping
      // untuk data lama) — bukan last_ping mentah, yang terus ke-update
      // tiap percobaan ping walau gagal dan bikin urutannya salah.
      .sort(
        (a, b) =>
          (parseDateSafe(offlineSince(a))?.getTime() ?? 0) -
          (parseDateSafe(offlineSince(b))?.getTime() ?? 0),
      ),
  )

  function clusterNameOf(clusterId) {
    const c = clusters.value.find((cl) => cl.id === clusterId)
    return c ? c.name : '—'
  }

  // ── Actions ──
  async function fetchClients() {
    loading.value = true
    error.value = null
    try {
      const res = await getClients()
      clients.value = Array.isArray(res.data?.data) ? res.data.data : []
      lastSyncAt.value = new Date()
    } catch (err) {
      console.error('[MONITOR_FETCH_CLIENTS_ERROR]', err)
      error.value = 'Backend Zakanet tidak dapat dihubungi'
      clients.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchClusters() {
    try {
      const res = await getClusters()
      clusters.value = Array.isArray(res.data) ? res.data : []
    } catch (err) {
      console.error('[MONITOR_FETCH_CLUSTERS_ERROR]', err)
    }
  }

  async function sync() {
    try {
      await apiSyncClients()
      await fetchClients()
    } catch (err) {
      console.error('[MONITOR_SYNC_ERROR]', err)
      error.value = 'Sync Zakanet gagal'
    }
  }

  function startPolling(interval = 10000) {
    if (pollingTimer) return
    fetchClients()
    pollingTimer = setInterval(fetchClients, interval)
  }

  function stopPolling() {
    if (pollingTimer) {
      clearInterval(pollingTimer)
      pollingTimer = null
    }
  }

  return {
    clients,
    clusters,
    loading,
    error,
    lastSyncAt,
    online,
    totalCount,
    onlineCount,
    offlineCount,
    uptimePct,
    offlineList,
    clusterNameOf,
    fetchClients,
    fetchClusters,
    sync,
    startPolling,
    stopPolling,
  }
})
