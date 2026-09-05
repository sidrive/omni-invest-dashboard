<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useReportStore } from '@/stores/report'
import { useMarketStore } from '@/stores/market'
import { useMonitorStore } from '@/stores/monitor'
import { usePortfolioOverview } from '@/composables/usePortfolioOverview'
import { useAdzanState } from '@/composables/useAdzanState'
import { useClock } from '@/composables/useSTBMode'
import ZakanetMapCore from '@/components/monitor/ZakanetMapCore.vue'
import AdzanFooter from '@/components/adzan/AdzanFooter.vue'
import AdzanTakeoverOverlay from '@/components/adzan/AdzanTakeoverOverlay.vue'
import { formatRupiah, formatJuta } from '@/utils/formatters'
import { generateSparklineData } from '@/utils/calculator'
import { formatCountdown } from '@/utils/adzanFormat'
import { offlineSince, offlineDuration } from '@/utils/time'
import PriceSparkline from '@/components/charts/PriceSparkline.vue'

const reportStore = useReportStore()
const marketStore = useMarketStore()
const monitorStore = useMonitorStore()
const { now } = useClock()

// Destructure jadi binding top-level (bukan disimpan sebagai `adzan.xxx`) —
// unwrap otomatis ref di <template> Vue cuma berlaku untuk binding top-level
// hasil setup(), bukan untuk akses properti nested seperti `adzan.events`.
// Kalau tetap dipakai sebagai `adzan.events` di template, yang keoper ke
// prop child adalah objek Ref mentah, bukan array/angka biasa.
const {
  events: adzanEvents,
  nextEvent: adzanNextEvent,
  phase: adzanPhase,
  activeEvent: adzanActiveEvent,
  countdownRemainingMs: adzanCountdownMs,
  isTakeover: adzanIsTakeover,
} = useAdzanState(now)

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

// ── Takeover: map fase state-machine -> label yang ditampilkan ──
// (Imsak cuma pernah muncul di fase 'takeover-adzan', tidak pernah di
// iqomah/sholat — sudah dijamin oleh adzanStateMachine.js, bukan di sini.)
const takeoverSubLabel = computed(() => {
  switch (adzanPhase.value) {
    case 'takeover-adzan':
      return adzanActiveEvent.value?.key === 'imsak' ? 'Menjelang Imsak' : 'Menjelang Adzan'
    case 'takeover-iqomah':
      return 'Menjelang Iqomah'
    case 'takeover-sholat':
      return 'Waktu Sholat'
    default:
      return ''
  }
})
const takeoverPrayerName = computed(() => adzanActiveEvent.value?.label?.toUpperCase() ?? '')
const takeoverCountdownText = computed(() => formatCountdown(adzanCountdownMs.value))

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
  <div class="stb-viewport">
  <div class="stb-frame">
    <div class="stb-body">
      <!-- ── LEFT: Omni-Invest ── -->
      <div class="stb-pane stb-pane--invest">
        <div class="stb-header">
          <div class="stb-title-row">
            <span class="stb-title">Omni-Invest</span>
            <span class="stb-clock mono">{{ clockStr }}</span>
          </div>
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
            <div class="stb-section-title">Emas</div>
            <div v-for="item in emasItems" :key="item.id" class="stb-row">
              <div class="stb-row-info">
                <div class="stb-row-name">{{ item.nama }}</div>
                <div class="stb-row-nilai mono">{{ formatRupiah(item.nilai_pasar) }}</div>
              </div>
              <div class="stb-row-right">
                <div :class="['stb-row-pl mono', item.pl > 0 ? 'clr-green' : item.pl < 0 ? 'clr-red' : 'clr-muted']">
                  {{ fmtPL(item.pl) }}
                </div>
                <PriceSparkline :data="goldSparklineData" :changePct="goldChangePct" :width="52" :height="20" />
              </div>
            </div>
            <div v-if="!emasItems.length" class="stb-empty">Tidak ada data emas</div>
          </div>

          <!-- Saham -->
          <div class="stb-section">
            <div class="stb-section-title">Saham</div>
            <div v-for="item in sahamItems" :key="item.id" class="stb-row stb-row--tight">
              <div class="stb-row-info">
                <div class="stb-row-name">
                  <span class="stb-row-name-main">{{ item.nama }}</span>
                  <span v-if="item.ticker" class="stb-lot">{{ item.ticker.replace('.JK', '') }}</span>
                  <span class="stb-lot">{{ item.qty_lot }} Lot</span>
                </div>
                <div class="stb-row-nilai mono">{{ formatRupiah(item.nilai_pasar) }}</div>
              </div>
              <div class="stb-row-right">
                <div :class="['stb-row-pl mono', item.pl > 0 ? 'clr-green' : item.pl < 0 ? 'clr-red' : 'clr-muted']">
                  {{ fmtPL(item.pl) }}
                </div>
                <PriceSparkline
                  :data="generateSparklineData(item.change_pct ?? 0, 14)"
                  :changePct="item.change_pct ?? 0"
                  :width="52"
                  :height="20"
                />
              </div>
            </div>
            <div v-if="!sahamItems.length" class="stb-empty">Tidak ada data saham</div>
          </div>

          <!-- Valas -->
          <div v-if="valasItems.length" class="stb-section">
            <div class="stb-section-title">Valas</div>
            <div v-for="item in valasItems" :key="item.id" class="stb-row">
              <div class="stb-row-info">
                <div class="stb-row-name">
                  <span class="stb-row-name-main">{{ FLAG_MAP[item.code] ?? '🏳️' }} {{ item.code }}/IDR</span>
                  <span class="stb-lot">Qty {{ formatQtyValas(item.code, item.qty_unit) }}</span>
                </div>
                <div class="stb-row-nilai mono">{{ formatRupiah(item.current_rate) }}</div>
              </div>
              <div class="stb-row-right">
                <div :class="['stb-row-pl mono', item.pl > 0 ? 'clr-green' : item.pl < 0 ? 'clr-red' : 'clr-muted']">
                  {{ fmtPL(item.pl) }}
                </div>
                <PriceSparkline
                  :data="generateSparklineData(item.change_pct ?? 0, 14)"
                  :changePct="item.change_pct ?? 0"
                  :width="52"
                  :height="20"
                />
              </div>
            </div>
          </div>

          <!-- Reksa Dana — dikelompokkan saja, tanpa sparkline (sesuai spec) -->
          <div class="stb-section">
            <div class="stb-section-title">Reksa Dana</div>
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
              <div class="stb-offline-row-ago">{{ offlineDuration(offlineSince(d)) }}</div>
            </div>
            <div v-if="!monitorStore.offlineList.length" class="stb-empty">Semua node online.</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── FOOTER: strip jadwal adzan / notifikasi countdown ── -->
    <div class="stb-footer">
      <AdzanFooter
        :events="adzanEvents"
        :next-event="adzanNextEvent"
        :phase="adzanPhase === 'notification' ? 'notification' : 'idle'"
        :active-event="adzanActiveEvent"
        :countdown-remaining-ms="adzanCountdownMs"
      />
    </div>

    <!-- ── FULL TAKEOVER: adzan / iqomah / waktu sholat / imsak ── -->
    <AdzanTakeoverOverlay
      v-if="adzanIsTakeover"
      :sub-label="takeoverSubLabel"
      :prayer-name="takeoverPrayerName"
      :show-countdown="adzanPhase !== 'takeover-sholat'"
      :countdown-text="takeoverCountdownText"
      :clock-text="clockStr"
    />
  </div>
  </div>
</template>

<style scoped>
.mono { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
.clr-green  { color: var(--stb-green); }
.clr-red    { color: var(--stb-red); }
.clr-muted  { color: var(--stb-text3); }
.clr-accent { color: var(--stb-green); }

.dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; flex: none; }
.dot-offline { background: var(--stb-red); box-shadow: 0 0 6px var(--stb-red); }

/* Viewport asli: full-screen. Frame di bawah mengisi 100% dari ini secara
   fluid (BUKAN transform:scale() — desain "STB Dashboard Unified" aslinya
   minta transform:scale() untuk letterbox 1024x768, tapi itu persis teknik
   yang sudah terbukti bikin Leaflet salah hitung zoom fitBounds() di
   hardware STB nyata, meski sudah invalidateSize(). Fluid layout ini
   dipertahankan dari fix sebelumnya: proporsi & rasio aspek tetap sama
   persis dengan mockup 1024x768 (device asli juga 4:3), cuma nilai
   font-size/padding tetap literal px alih-alih ikut membesar seperti
   transform:scale() — trade-off kecil yang sudah diterima sebelumnya). */
.stb-viewport {
  position: fixed;
  inset: 0;
  display: flex;
  background: var(--stb-bg);
  overflow: hidden;
}

.stb-frame {
  /* ── Token warna hasil handoff "STB Dashboard Unified Design" ──
     Sengaja pakai custom property lokal (bukan --bg/--border/--green dst.
     yang dipakai Dashboard biasa) karena desain ini menetapkan palet final
     sendiri untuk layar STB, sedikit beda dari tema lama. */
  --stb-bg: #0a0c10;
  --stb-card-bg: #111a20;
  --stb-row-bg: #0f171d;
  --stb-border: rgba(255, 255, 255, 0.06);
  --stb-border-soft: rgba(255, 255, 255, 0.05);
  --stb-text: #e6edf3;
  --stb-text2: #8a99a1;
  --stb-text3: #5b6b74;
  --stb-text4: #9fb0b8;
  --stb-green: #34d399;
  --stb-red: #f87171;

  position: relative; /* anchor buat AdzanTakeoverOverlay (position:absolute) */
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--stb-bg);
  color: var(--stb-text);
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 12px;
  overflow: hidden;
}

.stb-body { flex: 1; min-height: 0; display: flex; }

.stb-pane { display: flex; flex-direction: column; min-width: 0; min-height: 0; }
.stb-pane--invest  { flex: 570 1 0; padding: 16px 18px; gap: 14px; border-right: 1px solid var(--stb-border-soft); }
.stb-pane--monitor { flex: 454 1 0; padding: 16px 18px; gap: 10px; }

.stb-header { flex: none; }
.stb-title-row { display: flex; align-items: center; justify-content: space-between; }
.stb-title { font-size: 17px; font-weight: 700; letter-spacing: -0.01em; color: var(--stb-text); }
/* Diperbesar & kontras dinaikkan supaya kebaca dari jarak jauh di kiosk. */
.stb-clock { font-size: 26px; font-weight: 700; color: var(--stb-text); }
.stb-sync  { font-size: 11px; color: var(--stb-text3); margin-top: -6px; }

.stb-live-badge {
  display: flex; align-items: center; gap: 5px;
  font-size: 10px; font-weight: 700; letter-spacing: 0.04em;
  padding: 3px 9px; border-radius: 999px;
}
.stb-live-badge.is-live    { color: var(--stb-green); background: rgba(52, 211, 153, 0.12); border: 1px solid rgba(52, 211, 153, 0.3); }
.stb-live-badge.is-offline { color: var(--stb-red); background: rgba(248, 113, 113, 0.12); border: 1px solid rgba(248, 113, 113, 0.3); }
.stb-live-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; box-shadow: 0 0 6px currentColor; animation: stbBlink 1.6s ease-in-out infinite; }
@keyframes stbBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }

/* ── Stat grids ── */
.stb-stat-grid { flex: none; display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.stb-stat-row  { flex: none; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.stb-stat, .stb-mini-stat {
  background: var(--stb-card-bg); border: 1px solid var(--stb-border); border-radius: 6px;
  padding: 8px 10px;
}
.stb-stat-label { font-size: 9px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--stb-text3); }
.stb-stat-value { font-size: 14px; font-weight: 600; margin-top: 3px; color: var(--stb-text); }

/* ── Itemized lists (scroll kalau portfolio besar, tidak melebar keluar frame) ── */
.stb-scroll { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
.stb-section-title { font-size: 11px; font-weight: 600; color: var(--stb-text4); margin-bottom: 6px; }
.stb-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 6px;
  background: var(--stb-row-bg);
  border: 1px solid var(--stb-border-soft);
  margin-bottom: 6px;
}
.stb-row--tight { padding: 7px 12px; }
.stb-row-info { min-width: 0; }
.stb-row-name { font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.stb-row-name-main { font-weight: 500; color: var(--stb-text); }
.stb-lot { font-size: 11px; color: var(--stb-text3); margin-left: 6px; }
.stb-row-nilai { font-size: 11px; color: var(--stb-text3); margin-top: 2px; }
.stb-row-right { display: flex; align-items: center; gap: 10px; flex: none; }
.stb-row-pl { font-size: 12.5px; font-weight: 600; text-align: right; white-space: nowrap; }
.stb-empty { font-size: 11.5px; color: var(--stb-text3); font-style: italic; padding: 5px 0; }

.stb-reksa-dual { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.stb-reksa-card { background: var(--stb-row-bg); border: 1px solid var(--stb-border-soft); border-radius: 6px; padding: 9px 12px; }
.stb-reksa-head { display: flex; align-items: center; justify-content: space-between; font-size: 11.5px; font-weight: 600; }
.stb-reksa-count { font-size: 11px; color: var(--stb-text3); font-weight: 400; }
.stb-reksa-nilai { font-size: 14px; font-weight: 600; margin-top: 5px; color: var(--stb-text); }
.stb-reksa-pl { font-size: 11px; margin-top: 1px; }

/* ── Right pane: map + offline list ── */
.stb-map-wrap { flex: 1; min-height: 180px; border-radius: 8px; overflow: hidden; }
.stb-map-wrap :deep(.zm-map-shell) { height: 100%; border-color: var(--stb-border); }

.stb-offline-panel { flex: 0 0 auto; max-height: 190px; display: flex; flex-direction: column; min-height: 0; }
.stb-offline-header { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 600; color: var(--stb-text4); margin-bottom: 6px; flex: none; }
.stb-offline-badge {
  font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; color: var(--stb-red);
  background: rgba(248, 113, 113, 0.12); border-radius: 999px; padding: 1px 7px;
}
.stb-offline-list { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
.stb-offline-row { display: flex; align-items: center; gap: 7px; padding: 5px 8px; border-radius: 6px; background: rgba(248, 113, 113, 0.05); border: 1px solid rgba(248, 113, 113, 0.14); }
.stb-offline-row-main { min-width: 0; flex: 1; }
.stb-offline-row-name { font-size: 10.5px; font-weight: 600; color: var(--stb-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.stb-offline-row-meta { font-size: 9px; color: var(--stb-text3); }
.stb-offline-row-ago { font-size: 9.5px; color: var(--stb-text2); flex: none; }

/* ── Footer (60px, sesuai desain) ── */
.stb-footer {
  flex: 0 0 60px;
  border-top: 1px solid var(--stb-border-soft);
  background: rgba(255, 255, 255, 0.015);
  padding: 0 20px;
  display: flex;
  align-items: center;
}
</style>
