<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useMonitorStore } from '@/stores/monitor'
import { timeAgo } from '@/utils/time'

// interactive=false dipakai untuk mode STB/kiosk (tanpa mouse/keyboard,
// sesuai design handoff): drag/zoom/dblclick/box/keyboard/touch-zoom nonaktif.
const props = defineProps({
  interactive: { type: Boolean, default: true },
  showLegend: { type: Boolean, default: true },
})

const store = useMonitorStore()

const mapEl = ref(null)
let map = null
const markers = new Map()
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
  // Paksa Leaflet re-baca ukuran container sebelum fitBounds — kalau tidak,
  // di beberapa perangkat (khususnya saat map berada di dalam ancestor yang
  // di-`transform: scale()` untuk letterbox STB, atau saat container belum
  // selesai layout ketika map pertama kali dibuat) Leaflet bisa memakai
  // ukuran container yang salah/basi, sehingga zoom hasil fitBounds jadi
  // terlalu jauh dan node-node kelihatan menumpuk.
  map.invalidateSize()
  const bounds = L.latLngBounds(clients.map((c) => [c.lat, c.lng]))
  map.fitBounds(bounds, { padding: [32, 32], maxZoom: 17 })
}

let resizeObserver = null
function handleWindowResize() {
  map?.invalidateSize()
}

onMounted(() => {
  map = L.map(mapEl.value, {
    zoomControl: props.interactive,
    dragging: props.interactive,
    scrollWheelZoom: props.interactive,
    doubleClickZoom: false,
    boxZoom: props.interactive,
    keyboard: props.interactive,
    touchZoom: props.interactive,
  }).setView([-7.797068, 110.370529], 12)

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 20,
    attribution: '&copy; OpenStreetMap &copy; CARTO',
  }).addTo(map)

  if (store.clients.length) {
    fitToClients(store.clients)
    hasFitted = true
  }

  // Re-invalidate kalau ukuran container berubah setelah map dibuat (mis.
  // frame STB di-scale ulang saat resize, atau layout flex baru selesai
  // sesaat setelah mount di perangkat yang lebih lambat).
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => map?.invalidateSize())
    resizeObserver.observe(mapEl.value)
  }
  window.addEventListener('resize', handleWindowResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleWindowResize)
  resizeObserver?.disconnect()
  resizeObserver = null
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
  <div class="zm-map-shell">
    <div ref="mapEl" class="zm-map"></div>
    <div v-if="showLegend" class="zm-legend">
      <span><span class="dot dot-online"></span>Online <b class="clr-green">{{ store.onlineCount }}</b></span>
      <span><span class="dot dot-offline"></span>Offline <b class="clr-red">{{ store.offlineCount }}</b></span>
    </div>
  </div>
</template>

<style scoped>
.mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
.clr-green { color: var(--green); }
.clr-red   { color: var(--red); }

.dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; flex: none; }
.dot-online  { background: var(--accent); box-shadow: 0 0 8px var(--accent); }
.dot-offline { background: var(--danger); box-shadow: 0 0 8px var(--danger); }

.zm-map-shell {
  position: relative;
  height: 100%;
  width: 100%;
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
