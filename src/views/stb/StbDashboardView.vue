<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useReportStore } from '@/stores/report'
import { useMarketStore } from '@/stores/market'
import { useMonitorStore } from '@/stores/monitor'
import { usePortfolioOverview } from '@/composables/usePortfolioOverview'
import { useClock } from '@/composables/useSTBMode'
import ZakanetMapCore from '@/components/monitor/ZakanetMapCore.vue'
import { formatRupiah, formatJuta } from '@/utils/formatters'
import { generateSparklineData } from '@/utils/calculator'
import { timeAgo } from '@/utils/time'
import PriceSparkline from '@/components/charts/PriceSparkline.vue'

const reportStore = useReportStore()
const marketStore = useMarketStore()
const monitorStore = useMonitorStore()
const { now } = useClock()

const {
  summary, allokasi,
  emasItems, sahamItems, valasItems,
  reksaNaik, reksaTurun, reksaNaikTotal, reksaTurunTotal,
  FLAG_MAP, formatQtyValas, fmtPL,
} = usePortfolioOverview()

const clockStr = computed(() => {
  const pad = (n) => String(n).padStart(2, '0')
  const d = now.value
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
})

const totalPL = computed(() => summary.value.total_pl ?? 0)
const isPLPositive = computed(() => totalPL.value >= 0)
const emasAktual = computed(() => allokasi.value?.aktual?.emas ?? 0)

const goldSparklineData = computed(() => marketStore.goldSparklineData ?? [])
const goldChangePct = computed(() => marketStore.goldChangePct ?? 0)

const lastSyncStr = computed(() => {
  if (!monitorStore.lastSyncAt) return '--:--:-- WIB'
  const pad = (n) => String(n).padStart(2, '0')
  const d = monitorStore.lastSyncAt
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} WIB`
})

let refreshTimer = null
async function refresh() {
  await Promise.all([
    reportStore.fetchReport(),
    marketStore.fetchMarket(),
    marketStore.fetchGoldHistory(),
  ])
}

onMounted(async () => {
  await refresh()
  refreshTimer = setInterval(refresh, 60_000)
  await monitorStore.fetchClusters()
  monitorStore.startPolling(10000)
})
onUnmounted(() => {
  clearInterval(refreshTimer)
  monitorStore.stopPolling()
})
</script>

<template>
  <div class="stb-frame">
    <!-- ── LEFT: Omni-Invest ── -->
    <div class="stb-pane stb-pane--invest">
      <div class="stb-header">
        <div class="stb-title">Omni-Invest</div>
        <div class="stb-clock mono">{{ clockStr }}</div>
      </div>

      <div class="stb-stat-grid">
        <div class="stb-stat">
          <div class="stb-stat-label">Total Aset</div>
          <div class="stb-stat-value mono">Rp{{ formatJuta(summary.total_nilai ?? 0) }} Jt</div>
        </div>
        <div class="stb-stat">
          <div class="stb-stat-label">Floating P&amp;L</div>
          <div :class="['stb-stat-value mono', isPLPositive ? 'clr-green' : 'clr-red']">
            {{ isPLPositive ? '+' : '-' }}Rp{{ formatJuta(Math.abs(totalPL)) }} Jt
          </div>
        </div>
        <div class="stb-stat">
          <div class="stb-stat-label">Sinyal Aktif</div>
          <div class="stb-stat-value mono">{{ reportStore.signals.length }}</div>
        </div>
        <div class="stb-stat">
          <div class="stb-stat-label">Alokasi Emas</div>
          <div class="stb-stat-value mono">{{ emasAktual.toFixed(1) }}%</div>
        </div>
      </div>

      <div class="stb-scroll">
        <!-- Emas -->
        <div class="stb-section">
          <div class="stb-section-title">🥇 Emas</div>
          <div v-for="item in emasItems" :key="item.id" class="stb-row">
            <div class="stb-row-info">
              <div class="stb-row-name">{{ item.nama }}</div>
              <div class="stb-row-nilai mono">{{ formatRupiah(item.nilai_pasar) }}</div>
            </div>
            <div :class="['stb-row-pl mono', item.pl > 0 ? 'clr-green' : item.pl < 0 ? 'clr-red' : 'clr-muted']">
              {{ fmtPL(item.pl) }}
            </div>
            <PriceSparkline :data="goldSparklineData" :changePct="goldChangePct" :width="56" :height="26" />
          </div>
          <div v-if="!emasItems.length" class="stb-empty">Tidak ada data emas</div>
        </div>

        <!-- Saham -->
        <div class="stb-section">
          <div class="stb-section-title">📈 Saham</div>
          <div v-for="item in sahamItems" :key="item.id" class="stb-row">
            <div class="stb-row-info">
              <div class="stb-row-name">
                <span class="mono clr-accent">{{ item.ticker?.replace('.JK', '') }}</span>
                <span class="stb-lot mono">{{ item.qty_lot }} Lot</span>
              </div>
              <div class="stb-row-nilai mono">{{ formatRupiah(item.nilai_pasar) }}</div>
            </div>
            <div :class="['stb-row-pl mono', item.pl > 0 ? 'clr-green' : item.pl < 0 ? 'clr-red' : 'clr-muted']">
              {{ fmtPL(item.pl) }}
            </div>
            <PriceSparkline
              :data="generateSparklineData(item.change_pct ?? 0, 14)"
              :changePct="item.change_pct ?? 0"
              :width="56"
              :height="26"
            />
          </div>
          <div v-if="!sahamItems.length" class="stb-empty">Tidak ada data saham</div>
        </div>

        <!-- Valas -->
        <div v-if="valasItems.length" class="stb-section">
          <div class="stb-section-title">💱 Valas</div>
          <div v-for="item in valasItems" :key="item.id" class="stb-row">
            <div class="stb-row-info">
              <div class="stb-row-name">
                {{ FLAG_MAP[item.code] ?? '🏳️' }} {{ item.code }}/IDR
                <span class="stb-lot mono">Qty {{ formatQtyValas(item.code, item.qty_unit) }}</span>
              </div>
              <div class="stb-row-nilai mono">{{ formatRupiah(item.current_rate) }}</div>
            </div>
            <div :class="['stb-row-pl mono', item.pl > 0 ? 'clr-green' : item.pl < 0 ? 'clr-red' : 'clr-muted']">
              {{ fmtPL(item.pl) }}
            </div>
            <PriceSparkline
              :data="generateSparklineData(item.change_pct ?? 0, 14)"
              :changePct="item.change_pct ?? 0"
              :width="56"
              :height="26"
            />
          </div>
        </div>

        <!-- Reksa Dana — dikelompokkan saja, tanpa sparkline (sesuai spec) -->
        <div class="stb-section">
          <div class="stb-section-title">🏦 Reksa Dana</div>
          <div class="stb-reksa-dual">
            <div class="stb-reksa-card stb-reksa-card--profit">
              <div class="stb-reksa-head">
                <span class="clr-green">▲ Profit</span>
                <span class="stb-reksa-count">{{ reksaNaik.length }} produk</span>
              </div>
              <div class="stb-reksa-nilai mono">{{ formatRupiah(reksaNaikTotal.nilai) }}</div>
              <div class="stb-reksa-pl mono clr-green">{{ fmtPL(reksaNaikTotal.pl) }}</div>
            </div>
            <div class="stb-reksa-card stb-reksa-card--loss">
              <div class="stb-reksa-head">
                <span class="clr-red">▼ Loss/Flat</span>
                <span class="stb-reksa-count">{{ reksaTurun.length }} produk</span>
              </div>
              <div class="stb-reksa-nilai mono">{{ formatRupiah(reksaTurunTotal.nilai) }}</div>
              <div :class="['stb-reksa-pl mono', reksaTurunTotal.pl < 0 ? 'clr-red' : 'clr-muted']">{{ fmtPL(reksaTurunTotal.pl) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── RIGHT: Zakanet Monitor ── -->
    <div class="stb-pane stb-pane--monitor">
      <div class="stb-header">
        <div class="stb-title-row">
          <span class="stb-title">Zakanet Monitor</span>
          <span :class="['stb-live-badge', monitorStore.online ? 'is-live' : 'is-offline']">
            <span class="stb-live-dot"></span>{{ monitorStore.online ? 'LIVE' : 'OFFLINE' }}
          </span>
        </div>
        <div class="stb-sync mono">Sync terakhir sukses: {{ lastSyncStr }}</div>
      </div>

      <div class="stb-stat-row">
        <div class="stb-mini-stat">
          <div class="stb-stat-label">Online</div>
          <div class="stb-stat-value mono clr-green">{{ monitorStore.onlineCount }}</div>
        </div>
        <div class="stb-mini-stat">
          <div class="stb-stat-label">Offline</div>
          <div class="stb-stat-value mono clr-red">{{ monitorStore.offlineCount }}</div>
        </div>
        <div class="stb-mini-stat">
          <div class="stb-stat-label">Uptime</div>
          <div class="stb-stat-value mono">{{ monitorStore.uptimePct }}%</div>
        </div>
      </div>

      <div class="stb-map-wrap">
        <ZakanetMapCore :interactive="false" :show-legend="false" />
      </div>

      <div class="stb-offline-panel">
        <div class="stb-offline-header">
          <span>Perangkat Offline</span>
          <span class="stb-offline-badge">{{ monitorStore.offlineList.length }}</span>
        </div>
        <div class="stb-offline-list">
          <div v-for="d in monitorStore.offlineList" :key="d.client_id" class="stb-offline-row">
            <span class="dot dot-offline"></span>
            <div class="stb-offline-row-main">
              <div class="stb-offline-row-name">{{ d.name }}</div>
              <div class="stb-offline-row-meta mono">{{ d.ip_address }}</div>
            </div>
            <div class="stb-offline-row-ago">{{ timeAgo(d.last_ping) }}</div>
          </div>
          <div v-if="!monitorStore.offlineList.length" class="stb-empty">Semua node online.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
.clr-green  { color: var(--green); }
.clr-red    { color: var(--red); }
.clr-muted  { color: var(--text3); }
.clr-accent { color: var(--accent); }

.dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; flex: none; }
.dot-online  { background: var(--accent); box-shadow: 0 0 6px var(--accent); }
.dot-offline { background: var(--danger); box-shadow: 0 0 6px var(--danger); }

/* Frame 1024x768 tetap (bukan discale) — sesuai catatan design handoff:
   perangkat STB target melaporkan resolusi ini persis. */
.stb-frame {
  width: 1024px;
  height: 768px;
  display: flex;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-ui);
  font-size: 12px;
  overflow: hidden;
}

.stb-pane { display: flex; flex-direction: column; min-width: 0; min-height: 0; }
.stb-pane--invest  { flex: 0 0 614px; padding: 14px 16px; gap: 10px; }
.stb-pane--monitor { flex: 0 0 410px; padding: 14px 16px; gap: 10px; border-left: 1px solid var(--border); }

.stb-header { flex: none; }
.stb-title-row { display: flex; align-items: center; justify-content: space-between; }
.stb-title { font-size: 15px; font-weight: 700; color: var(--text); }
.stb-clock { font-size: 12px; color: var(--text2); margin-top: 2px; }
.stb-sync  { font-size: 10px; color: var(--text3); margin-top: 3px; }

.stb-live-badge {
  display: flex; align-items: center; gap: 5px;
  font-size: 10px; font-weight: 700; letter-spacing: 0.05em;
  padding: 2px 8px; border-radius: 20px;
}
.stb-live-badge.is-live    { color: var(--green); background: rgba(0, 229, 160, 0.12); border: 1px solid rgba(0, 229, 160, 0.3); }
.stb-live-badge.is-offline { color: var(--danger); background: rgba(255, 71, 87, 0.12); border: 1px solid rgba(255, 71, 87, 0.3); }
.stb-live-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; box-shadow: 0 0 6px currentColor; animation: stbBlink 1.8s ease-in-out infinite; }
@keyframes stbBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

/* ── Stat grids ── */
.stb-stat-grid { flex: none; display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.stb-stat-row  { flex: none; display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.stb-stat, .stb-mini-stat {
  background: var(--bg3); border: 1px solid var(--border); border-radius: 6px;
  padding: 6px 8px;
}
.stb-stat-label { font-size: 8px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text3); }
.stb-stat-value { font-size: 13px; font-weight: 700; margin-top: 2px; }

/* ── Itemized lists (scroll kalau portfolio besar, tidak melebar keluar frame) ── */
.stb-scroll { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
.stb-section-title { font-size: 10px; font-weight: 700; color: var(--text2); padding: 4px 0; }
.stb-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-radius: 6px;
  background: var(--bg3);
  border: 1px solid var(--border);
  margin-bottom: 4px;
}
.stb-row-info { min-width: 0; }
.stb-row-name { font-size: 11px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.stb-lot { font-size: 9px; color: var(--text3); margin-left: 5px; }
.stb-row-nilai { font-size: 10px; color: var(--text2); margin-top: 1px; }
.stb-row-pl { font-size: 11px; font-weight: 600; text-align: right; white-space: nowrap; }
.stb-empty { font-size: 10px; color: var(--text3); font-style: italic; padding: 6px 0; }

.stb-reksa-dual { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.stb-reksa-card { background: var(--bg3); border: 1px solid var(--border); border-radius: 6px; padding: 7px 9px; }
.stb-reksa-card--profit { border-top: 2px solid rgba(0, 229, 160, 0.35); }
.stb-reksa-card--loss   { border-top: 2px solid rgba(255, 71, 87, 0.35); }
.stb-reksa-head { display: flex; align-items: center; justify-content: space-between; font-size: 10px; font-weight: 700; }
.stb-reksa-count { font-size: 9px; color: var(--text3); font-weight: 400; }
.stb-reksa-nilai { font-size: 11px; margin-top: 4px; }
.stb-reksa-pl { font-size: 10px; margin-top: 1px; }

/* ── Right pane: map + offline list ── */
.stb-map-wrap { flex: 1; min-height: 0; }
.stb-map-wrap :deep(.zm-map-shell) { height: 100%; }

.stb-offline-panel { flex: 0 0 190px; display: flex; flex-direction: column; border-top: 1px solid var(--border); padding-top: 8px; min-height: 0; }
.stb-offline-header { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; margin-bottom: 6px; flex: none; }
.stb-offline-badge {
  font-family: var(--font-mono); font-size: 10px; font-weight: 600; color: var(--danger);
  background: rgba(255, 71, 87, 0.14); border: 1px solid rgba(255, 71, 87, 0.3);
  padding: 0 6px; border-radius: 20px;
}
.stb-offline-list { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
.stb-offline-row { display: flex; align-items: center; gap: 7px; padding: 5px 8px; border-radius: 6px; background: rgba(255, 71, 87, 0.05); border: 1px solid rgba(255, 71, 87, 0.14); }
.stb-offline-row-main { min-width: 0; flex: 1; }
.stb-offline-row-name { font-size: 10.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.stb-offline-row-meta { font-size: 9px; color: var(--text3); }
.stb-offline-row-ago { font-size: 9.5px; color: var(--text2); flex: none; }
</style>
