<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useMonitorStore } from '@/stores/monitor'
import { offlineSince, offlineDuration } from '@/utils/time'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import ZakanetMapCore from '@/components/monitor/ZakanetMapCore.vue'

const store = useMonitorStore()

// ── Sparkline dekoratif — belum ada endpoint histori total-node, jadi
// hanya menunjukkan variasi visual berdasarkan jumlah node saat ini ──
function buildSparkPoints(seed) {
  const pts = []
  for (let i = 0; i < 12; i++) {
    const y = 17 + Math.sin(i * 0.9 + seed) * 7 + (i % 3 === 0 ? -3 : 2)
    pts.push(`${((i / 11) * 84).toFixed(1)},${y.toFixed(1)}`)
  }
  return pts.join(' ')
}
const sparkPoints = computed(() => buildSparkPoints(store.totalCount))

onMounted(async () => {
  await store.fetchClusters()
  store.startPolling(10000)
})

onUnmounted(() => {
  store.stopPolling()
})
</script>

<template>
  <div id="section-monitor" class="card zm-card">
    <div class="card-header">
      <h3 class="card-title">Zakanet Monitor</h3>
      <span :class="['card-meta', { 'zm-meta-error': store.error }]">
        {{ store.error || '// Network Node Monitoring' }}
      </span>
    </div>

    <div class="zm-body">
      <!-- ── Stats column ── -->
      <div class="zm-stats">
        <div class="zm-stat-card">
          <div>
            <div class="zm-stat-label">Total Node</div>
            <div class="zm-stat-value mono">{{ store.totalCount }}</div>
          </div>
          <svg class="zm-sparkline" width="84" height="34" viewBox="0 0 84 34">
            <polyline
              :points="sparkPoints"
              fill="none"
              stroke="var(--accent)"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>

        <div class="zm-toggle-row">
          <div class="zm-toggle online">
            <div class="zm-toggle-head"><span class="dot dot-online"></span>Online</div>
            <div class="zm-toggle-value mono">{{ store.onlineCount }}</div>
          </div>
          <div class="zm-toggle offline">
            <div class="zm-toggle-head"><span class="dot dot-offline"></span>Offline</div>
            <div class="zm-toggle-value mono">{{ store.offlineCount }}</div>
          </div>
        </div>
        <div class="zm-hint">{{ store.uptimePct }}% uptime</div>

        <div class="zm-offline-panel">
          <div class="zm-offline-header">
            <span class="zm-offline-title">Perangkat Offline</span>
            <span class="zm-offline-badge">{{ store.offlineList.length }}</span>
          </div>
          <div class="zm-offline-list">
            <div v-if="store.loading && !store.clients.length" class="zm-loading">
              <LoadingSpinner size="sm" /><span>Memuat data node...</span>
            </div>
            <template v-else>
              <div v-for="d in store.offlineList" :key="d.client_id" class="zm-offline-row">
                <span class="dot dot-offline"></span>
                <div class="zm-offline-row-main">
                  <div class="zm-offline-row-name">{{ d.name }}</div>
                  <div class="zm-offline-row-meta mono">
                    {{ store.clusterNameOf(d.cluster_id) }} · {{ d.ip_address }}
                  </div>
                </div>
                <div class="zm-offline-row-ago">{{ offlineDuration(offlineSince(d)) }}</div>
              </div>
              <div v-if="!store.offlineList.length" class="zm-offline-empty">
                Tidak ada perangkat offline.
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- ── Map ── -->
      <ZakanetMapCore :interactive="true" />
    </div>
  </div>
</template>

<style scoped>
.zm-card {
  padding: 18px;
}

.zm-body {
  height: 560px;
  display: flex;
  gap: 16px;
}

.mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }

.zm-meta-error { color: var(--danger); }

/* ── Stats column ── */
.zm-stats {
  flex: 0 0 320px;
  display: flex;
  flex-direction: column;
  gap: 11px;
  min-height: 0;
}

.zm-stat-card {
  padding: 15px 17px;
  border-radius: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
}
.zm-stat-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text3);
}
.zm-stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.15;
  margin-top: 2px;
}
.zm-sparkline { margin-left: auto; opacity: 0.9; }

.zm-toggle-row { display: flex; gap: 11px; }
.zm-toggle {
  flex: 1;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
}
.zm-toggle.online  { border-color: rgba(0, 229, 160, 0.3); background: rgba(0, 229, 160, 0.06); }
.zm-toggle.offline { border-color: rgba(255, 71, 87, 0.3); background: rgba(255, 71, 87, 0.06); }
.zm-toggle-head {
  display: flex; align-items: center; gap: 6px;
  font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--text3);
}
.zm-toggle-value { font-size: 24px; font-weight: 700; margin-top: 3px; }
.zm-toggle.online  .zm-toggle-value { color: var(--green); }
.zm-toggle.offline .zm-toggle-value { color: var(--red); }

.zm-hint { font-size: 11px; color: var(--text3); text-align: center; }

.dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; flex: none; }
.dot-online  { background: var(--accent); box-shadow: 0 0 8px var(--accent); }
.dot-offline { background: var(--danger); box-shadow: 0 0 8px var(--danger); }

.zm-offline-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--border);
  padding-top: 12px;
}
.zm-offline-header { display: flex; align-items: center; gap: 8px; padding-bottom: 10px; flex: none; }
.zm-offline-title { font-size: 13px; font-weight: 600; color: var(--text); }
.zm-offline-badge {
  font-family: var(--font-mono);
  font-size: 11px; font-weight: 600; color: var(--danger);
  background: rgba(255, 71, 87, 0.14); border: 1px solid rgba(255, 71, 87, 0.3);
  padding: 1px 7px; border-radius: 20px;
}

.zm-offline-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.zm-offline-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(255, 71, 87, 0.04);
  border: 1px solid rgba(255, 71, 87, 0.12);
}
.zm-offline-row-main { min-width: 0; flex: 1; }
.zm-offline-row-name { font-size: 13px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.zm-offline-row-meta { font-size: 10.5px; color: var(--text3); margin-top: 1px; }
.zm-offline-row-ago { font-size: 11px; color: var(--text2); flex: none; }
.zm-offline-empty { padding: 20px 12px; text-align: center; color: var(--text3); font-size: 12px; }
.zm-loading { display: flex; align-items: center; gap: 8px; padding: 20px; color: var(--text3); font-size: 12px; }

.zm-body > :deep(.zm-map-shell) {
  flex: 1;
  min-width: 0;
}

@media (max-width: 1024px) {
  .zm-body { flex-direction: column; height: auto; }
  .zm-stats { flex: none; }
  .zm-offline-panel { max-height: 260px; }
  .zm-body > :deep(.zm-map-shell) { height: 320px; }
}
</style>
