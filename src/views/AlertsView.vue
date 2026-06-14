<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useReportStore } from '@/stores/report'
import { useMarketStore } from '@/stores/market'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import StatCard from '@/components/ui/StatCard.vue'
import SignalBadge from '@/components/ui/SignalBadge.vue'
import TransactionForm from '@/components/transactions/TransactionForm.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { formatRupiah, formatDateTime } from '@/utils/formatters'
import { suggestLot } from '@/utils/calculator'

const reportStore = useReportStore()
const marketStore = useMarketStore()

// ── Data ──────────────────────────────────────────────────────
const signals   = computed(() => reportStore.signals)
const criticals = computed(() => reportStore.criticalSignals)
const highs     = computed(() => reportStore.highPrioritySignals)

const rebalanceCount = computed(() =>
  signals.value.filter(s => s.type?.toUpperCase() === 'REBALANCE').length,
)

const isFirstLoad = computed(() => reportStore.loading && !reportStore.report)

const analyzedAt = computed(() =>
  reportStore.report?.analyzed_at
    ? formatDateTime(reportStore.report.analyzed_at) + ' WIB'
    : '--',
)

// ── Signal sorting ─────────────────────────────────────────────
const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, normal: 3 }

const sortedSignals = computed(() =>
  [...signals.value].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 4
    const pb = PRIORITY_ORDER[b.priority] ?? 4
    return pa - pb
  }),
)

// ── Signal icons ───────────────────────────────────────────────
const SIGNAL_ICONS = {
  BUY:       '💚',
  AVG_DOWN:  '📉',
  SELL:      '🔴',
  STOPLOSS:  '🚨',
  REBALANCE: '⚖️',
  HOLD:      '⏸',
  DCA:       '🔄',
}

function signalIcon(s) {
  return SIGNAL_ICONS[s?.toUpperCase()] ?? '📊'
}

// ── Eksekusi (open TransactionForm pre-filled) ─────────────────
const showModal    = ref(false)
const activePrefill = ref(null)

function openEksekusi(signal) {
  const harga     = signal.harga ?? 0
  const totalAset = reportStore.summary?.total_nilai ?? 0

  activePrefill.value = {
    aset:          'saham',
    aksi:          signal.type?.toUpperCase() === 'AVG_DOWN' ? 'BUY' : signal.type,
    kode:          signal.aset,
    nama:          signal.aset,
    harga,
    qty_saran:     suggestLot(totalAset, harga),
    dana_tersedia: totalAset * 0.1,
  }
  showModal.value = true
}

// ── Auto-refresh ───────────────────────────────────────────────
let timer = null

async function refresh() {
  await Promise.all([reportStore.fetchReport(), marketStore.fetchMarket()])
}

onMounted(async () => {
  await refresh()
  timer = setInterval(refresh, 60_000)
})
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <div class="alerts">
    <!-- Topbar -->
    <AppTopbar title="Alerts" subtitle="Pusat sinyal &amp; notifikasi">
      <template #actions>
        <button
          class="btn-refresh"
          :disabled="reportStore.loading"
          @click="refresh"
        >
          <span :class="{ spin: reportStore.loading }">⟳</span>
          Refresh
        </button>
      </template>
    </AppTopbar>

    <!-- First-load spinner -->
    <div v-if="isFirstLoad" class="spinner-wrap">
      <LoadingSpinner size="lg" />
    </div>

    <div v-else class="content">

      <!-- 1 ─ Summary StatCards -->
      <div class="stat-grid">
        <StatCard
          label="PRIORITAS TINGGI"
          :value="String(highs.length)"
          :change="highs.length > 0 ? 'Butuh perhatian segera' : 'Tidak ada'"
          :is-positive="highs.length === 0"
          :variant="highs.length > 0 ? 'danger' : 'default'"
        />
        <StatCard
          label="REBALANCE"
          :value="String(rebalanceCount)"
          :change="rebalanceCount > 0 ? 'Alokasi perlu disesuaikan' : 'Alokasi aman'"
          :is-positive="rebalanceCount === 0"
          :variant="rebalanceCount > 0 ? 'warn' : 'default'"
        />
        <StatCard
          label="TOTAL SINYAL"
          :value="String(signals.length)"
          :change="signals.length > 0 ? 'sinyal aktif' : 'Semua posisi aman'"
          :is-positive="signals.length === 0"
          :variant="signals.length > 0 ? 'blue' : 'default'"
        />
      </div>

      <!-- 2 ─ Empty state -->
      <div v-if="signals.length === 0" class="empty-state">
        <div class="empty-icon">✅</div>
        <h2 class="empty-title">Semua Posisi Aman</h2>
        <p class="empty-sub">
          Analyst akan kirim notifikasi bila ada pergerakan sinyal
        </p>
        <div class="empty-meta">
          <span class="mono">// Terakhir dianalisis: {{ analyzedAt }}</span>
        </div>
      </div>

      <!-- 3 ─ Signal list -->
      <div v-else class="signal-list">
        <div class="list-header">
          <span class="list-title">Sinyal Aktif</span>
          <span class="list-meta mono">{{ analyzedAt }}</span>
        </div>

        <div
          v-for="signal in sortedSignals"
          :key="signal.aset + '_' + signal.type + '_' + signal.timestamp"
          :class="['signal-card', `priority-${signal.priority ?? 'normal'}`]"
        >
          <!-- Icon -->
          <div class="signal-icon-wrap">
            <span class="signal-icon">{{ signalIcon(signal.type) }}</span>
          </div>

          <!-- Body -->
          <div class="signal-body">
            <div class="signal-title">
              <SignalBadge :signal="signal.type ?? 'HOLD'" />
              <span class="signal-asset font-mono">{{ signal.aset }}</span>
              <span class="signal-price font-mono" v-if="signal.harga > 0">
                {{ formatRupiah(signal.harga) }}
              </span>
            </div>

            <div class="signal-reason">
              {{ signal.alasan || '—' }}
            </div>

            <div class="signal-meta-row">
              <span :class="['priority-badge', `badge-${signal.priority ?? 'normal'}`]">
                {{ (signal.priority ?? 'normal').toUpperCase() }}
              </span>
              <span class="signal-ts mono">
                {{ formatDateTime(signal.timestamp) }} WIB
              </span>
            </div>
          </div>

          <!-- Eksekusi button (BUY / AVG_DOWN only) -->
          <div
            v-if="['BUY', 'AVG_DOWN'].includes(signal.type?.toUpperCase())"
            class="signal-action"
          >
            <button class="btn-eksekusi" @click="openEksekusi(signal)">
              💹 Eksekusi
            </button>
          </div>
        </div>
      </div>

    </div><!-- /content -->

    <!-- TransactionForm modal -->
    <TransactionForm
      v-model="showModal"
      :prefill="activePrefill"
      @submitted="refresh"
    />
  </div>
</template>

<style scoped>
.alerts {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.spinner-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px;
}

/* ── Stat grid ── */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

/* ── Empty state ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  gap: 10px;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 10px;
  text-align: center;
}

.empty-icon  { font-size: 56px; line-height: 1; margin-bottom: 4px; }
.empty-title { font-size: 18px; font-weight: 700; color: var(--text); }
.empty-sub   { font-size: 13px; color: var(--text2); max-width: 320px; line-height: 1.5; }
.empty-meta  { margin-top: 8px; font-size: 11px; color: var(--text3); }

/* ── Signal list ── */
.signal-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px;
}

.list-title { font-size: 13px; font-weight: 600; color: var(--text); }
.list-meta  { font-size: 10px; color: var(--text3); }

/* ── Signal card ── */
.signal-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-left: 3px solid var(--border);
  border-radius: 10px;
  padding: 14px 16px;
  transition: box-shadow 0.15s;
}

.signal-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
}

/* Priority border colors */
.priority-critical { border-left-color: var(--danger); }
.priority-high     { border-left-color: var(--orange); }
.priority-medium   { border-left-color: var(--warn);   }
.priority-normal   { border-left-color: var(--border); }

/* Icon */
.signal-icon-wrap {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.signal-icon { font-size: 18px; }

/* Body */
.signal-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.signal-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.signal-asset {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.signal-reason {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text2);
  line-height: 1.5;
}

.signal-meta-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* Priority badges */
.priority-badge {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 2px 7px;
  border-radius: 4px;
}

.badge-critical { background: rgba(255,71,87,0.15);  color: var(--danger); }
.badge-high     { background: rgba(255,107,53,0.12); color: var(--orange); }
.badge-medium   { background: rgba(255,217,61,0.1);  color: var(--warn); }
.badge-normal   { background: rgba(136,153,187,0.1); color: var(--text2); }

.signal-price {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text2);
  font-variant-numeric: tabular-nums;
}

.signal-ts { font-size: 10px; color: var(--text3); }

/* Eksekusi button */
.signal-action { flex-shrink: 0; }

.btn-eksekusi {
  padding: 8px 14px;
  background: rgba(0, 229, 160, 0.1);
  border: 1px solid rgba(0, 229, 160, 0.35);
  border-radius: 7px;
  color: var(--accent);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.btn-eksekusi:hover {
  background: rgba(0, 229, 160, 0.18);
  box-shadow: var(--glow-accent);
}

/* ── Refresh button ── */
.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 7px;
  font-size: 12px;
  font-family: var(--font-mono);
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text2);
  transition: all 0.15s;
}
.btn-refresh:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.btn-refresh:disabled { opacity: 0.4; cursor: not-allowed; }

.spin { display: inline-block; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Responsive ── */
@media (max-width: 768px) {
  .content  { padding: 12px; gap: 12px; }
  .stat-grid { grid-template-columns: repeat(3, 1fr); gap: 8px; }

  .signal-card {
    flex-wrap: wrap;
  }

  .signal-action {
    width: 100%;
  }

  .btn-eksekusi {
    width: 100%;
    justify-content: center;
    display: flex;
    align-items: center;
  }
}
</style>
