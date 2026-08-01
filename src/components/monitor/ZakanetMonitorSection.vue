<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useMonitorStore } from '@/stores/monitor'
import { timeAgo } from '@/utils/time'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

const store = useMonitorStore()

const mapEl = ref(null)
let map = null
const markers = new Map() // client_id -> L.Marker
let hasFitted = false

function nodeDivIcon(status) {
  const offline = status === 'offline'
  return L.divIcon({
    className: 'zm-marker-wrap',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
    html: `<span class="zm-marker ${offline ? 'is-offline' : 'is-online'}">
             <span class="zm-pulse"></span><span class="zm-core"></span>
           </span>`,
  })
}

function popupContent(c) {
  return `
    <div class="zm-popup">
      <span class="zm-popup-title">${c.name}</span>
      <div class="zm-popup-body">
        <div><strong>IP:</strong> ${c.ip_address}</div>
        <div><strong>Cluster:</strong> ${store.clusterNameOf(c.cluster_id)}</div>
        <div><strong>Status:</strong>
          <span class="${c.status === 'online' ? 'zm-status-online' : 'zm-status-offline'}">${c.status.toUpperCase()}</span>
        </div>
        <div><strong>Last ping:</strong> ${timeAgo(c.last_ping)}</div>
      </div>
    </div>
  `
}

function fitToClients(clients) {
  if (!map || !clients.length) return
  const bounds = L.latLngBounds(clients.map((c) => [c.lat, c.lng]))
  map.fitBounds(bounds, { padding: [32, 32], maxZoom: 17 })
}

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
  map = L.map(mapEl.value, { zoomControl: true, doubleClickZoom: false }).setView(
    [-7.797068, 110.370529],
    12,
  )

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 20,
    attribution: '&copy; OpenStreetMap &copy; CARTO',
  }).addTo(map)

  await store.fetchClusters()
  store.startPolling(10000)
})

onUnmounted(() => {
  store.stopPolling()
  map?.remove()
  map = null
})

watch(
  () => store.clients,
  (clients) => {
    if (!map) return

    const seen = new Set()
    clients.forEach((c) => {
      seen.add(c.client_id)
      const icon = nodeDivIcon(c.status)
      let marker = markers.get(c.client_id)

      if (!marker) {
        marker = L.marker([c.lat, c.lng], { icon }).bindPopup(popupContent(c))
        marker.addTo(map)
        markers.set(c.client_id, marker)
      } else {
        marker.setIcon(icon)
        marker.setPopupContent(popupContent(c))
      }
    })

    // buang marker untuk client yang sudah tidak ada di response terbaru
    markers.forEach((marker, id) => {
      if (!seen.has(id)) {
        map.removeLayer(marker)
        markers.delete(id)
      }
    })

    if (!hasFitted && clients.length > 0) {
      fitToClients(clients)
      hasFitted = true
    }
  },
  { deep: true },
)
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
                <div class="zm-offline-row-ago">{{ timeAgo(d.last_ping) }}</div>
              </div>
              <div v-if="!store.offlineList.length" class="zm-offline-empty">
                Tidak ada perangkat offline.
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- ── Map ── -->
      <div class="zm-map-shell">
        <div ref="mapEl" class="zm-map"></div>
        <div class="zm-legend">
          <span><span class="dot dot-online"></span>Online <b class="clr-green">{{ store.onlineCount }}</b></span>
          <span><span class="dot dot-offline"></span>Offline <b class="clr-red">{{ store.offlineCount }}</b></span>
        </div>
      </div>
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
.clr-green { color: var(--green); }
.clr-red   { color: var(--red); }

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

/* ── Map ── */
.zm-map-shell {
  position: relative;
  flex: 1;
  min-width: 0;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--border);
}
.zm-map { width: 100%; height: 100%; }

.zm-legend {
  position: absolute;
  bottom: 14px;
  left: 14px;
  z-index: 1000;
  display: flex;
  gap: 14px;
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
}
.zm-legend span { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--text2); }
.zm-legend b { font-family: var(--font-mono); }

@media (max-width: 1024px) {
  .zm-body { flex-direction: column; height: auto; }
  .zm-stats { flex: none; }
  .zm-offline-panel { max-height: 260px; }
  .zm-map-shell { height: 320px; }
}
</style>

<style>
/* Marker/popup Leaflet dirender di luar DOM komponen (divIcon HTML string /
   popup template string), jadi tidak bisa pakai <style scoped>. */
.zm-marker-wrap { background: none; border: none; }
.zm-marker { position: relative; display: block; width: 16px; height: 16px; }
.zm-core {
  position: absolute; left: 50%; top: 50%; width: 9px; height: 9px;
  margin: -4.5px 0 0 -4.5px; border-radius: 50%; border: 1.5px solid rgba(255, 255, 255, 0.85);
}
.zm-pulse {
  position: absolute; left: 50%; top: 50%; width: 16px; height: 16px;
  margin: -8px 0 0 -8px; border-radius: 50%;
}
.zm-marker.is-online  .zm-core  { background: #00e5a0; box-shadow: 0 0 10px #00e5a0; }
.zm-marker.is-online  .zm-pulse { border: 1.5px solid #00e5a0; animation: zmPulse 2.4s ease-out infinite; }
.zm-marker.is-offline .zm-core  { background: #ff4757; box-shadow: 0 0 12px #ff4757; }
.zm-marker.is-offline .zm-pulse { border: 1.5px solid #ff4757; animation: zmPulse 1.6s ease-out infinite; }
@keyframes zmPulse { 0% { transform: scale(0.5); opacity: 0.7; } 70% { opacity: 0; } 100% { transform: scale(3); opacity: 0; } }

.zm-popup .zm-popup-title { font-size: 14px; font-weight: 600; color: #e8edf5; }
.zm-popup .zm-popup-body {
  margin-top: 6px; display: flex; flex-direction: column; gap: 3px;
  font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 11.5px; color: #8899bb;
}
.zm-popup .zm-popup-body strong { color: #e8edf5; font-weight: 600; }
.zm-status-online  { color: #00e5a0; font-weight: 600; }
.zm-status-offline { color: #ff4757; font-weight: 600; }

.leaflet-popup-content-wrapper {
  background: #151a24 !important;
  border: 1px solid #232d42 !important;
  border-radius: 10px !important;
  color: #e8edf5 !important;
}
.leaflet-popup-tip { background: #151a24 !important; }
.leaflet-container a.leaflet-popup-close-button { color: #8899bb !important; }
.leaflet-container a.leaflet-popup-close-button:hover { color: #e8edf5 !important; }
</style>
