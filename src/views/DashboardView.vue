<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useReportStore } from '@/stores/report'
import { useMarketStore } from '@/stores/market'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import StatCard from '@/components/ui/StatCard.vue'
import SignalBadge from '@/components/ui/SignalBadge.vue'
import RoleBadge from '@/components/ui/RoleBadge.vue'
import AllocationChart from '@/components/charts/AllocationChart.vue'
import PriceSparkline from '@/components/charts/PriceSparkline.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { formatRupiah, formatJuta, formatPct, formatDateTime } from '@/utils/formatters'

const router = useRouter()
const reportStore = useReportStore()
const marketStore = useMarketStore()

// ── Derived state ──────────────────────────────────────────────
const summary   = computed(() => reportStore.summary)
const allokasi  = computed(() => reportStore.allokasi)
const signals   = computed(() => reportStore.signals)
const criticals = computed(() => reportStore.criticalSignals)
const highs     = computed(() => reportStore.highPrioritySignals)

// Banner
const bannerState = computed(() => {
  if (criticals.value.length > 0) return 'critical'
  if (highs.value.length > 0)     return 'warn'
  return 'safe'
})
const firstSignal = computed(() => signals.value[0] ?? null)

// StatCard helpers
const totalPL      = computed(() => summary.value.total_pl ?? 0)
const isPLPositive = computed(() => totalPL.value >= 0)
const emasAktual   = computed(() => allokasi.value?.aktual?.emas ?? 0)
const emasTarget   = computed(() => allokasi.value?.target?.emas ?? 25)
const isEmasOver   = computed(() => emasAktual.value > emasTarget.value)

// Live market data from market store
const emasMarket = computed(() => marketStore.market?.emas ?? null)
const stocksData = computed(() => {
  const stocks = marketStore.market?.saham?.stocks
  if (!stocks) return []
  return Object.entries(stocks)
    .filter(([code, data]) =>
      data?.price > 0 && !code.includes('{') && !code.includes('kode'),
    )
    .map(([code, data]) => ({
      code: code.replace('.JK', ''),
      ...data,
    }))
})

// Pipeline — computed so timestamps stay reactive
const pipeline = computed(() => [
  {
    icon: '◐',
    role: 'scavenger',
    label: 'Scavenger',
    desc: 'Fetching harga emas, saham & reksa dana dari market APIs',
    ts: marketStore.lastSync !== '--' ? `Last sync: ${marketStore.lastSync}` : 'Menunggu...',
    isCurrent: false,
  },
  {
    icon: '◑',
    role: 'analyst',
    label: 'Analyst',
    desc: 'Analisis S/R levels, kalkulasi P&L, generate sinyal trading',
    ts: reportStore.report?.analyzed_at
      ? formatDateTime(reportStore.report.analyzed_at)
      : '--',
    isCurrent: false,
  },
  {
    icon: '⬡',
    role: 'messenger',
    label: 'Messenger',
    desc: 'Push notifikasi sinyal critical via Firebase FCM',
    ts: 'Via Firebase Cloud Messaging',
    isCurrent: false,
  },
  {
    icon: '◻',
    role: 'auditor',
    label: 'Auditor',
    desc: 'Dashboard monitoring & visualisasi aset real-time',
    ts: '← Kamu di sini',
    isCurrent: true,
  },
])

// ── Fetch & auto-refresh ────────────────────────────────────────
let timer = null

async function refresh() {
  await Promise.all([reportStore.fetchReport(), marketStore.fetchMarket()])
}

onMounted(async () => {
  await refresh()
  timer = setInterval(refresh, 60_000)
})
onUnmounted(() => clearInterval(timer))

const isFirstLoad = computed(() => reportStore.loading && !reportStore.report)
</script>

<template>
  <div class="dashboard">
    <!-- ── Topbar ── -->
    <AppTopbar title="Command Center" subtitle="Dashboard — Real-time">
      <template #actions>
        <button class="btn-action" :disabled="reportStore.loading" @click="refresh">
          <span :class="{ spin: reportStore.loading }">⟳</span>
          Refresh
        </button>
        <button class="btn-primary" @click="router.push('/transactions')">
          + Transaksi
        </button>
      </template>
    </AppTopbar>

    <!-- ── First-load skeleton ── -->
    <div v-if="isFirstLoad" class="skeleton-wrap">
      <div class="skeleton-stat-grid">
        <div v-for="i in 4" :key="i" class="skel skel-card" />
      </div>
      <div class="skeleton-body">
        <div class="skel skel-left" />
        <div class="skel skel-right" />
      </div>
      <div class="skel skel-pipeline" />
    </div>

    <!-- ── Main content ── -->
    <div v-else class="content">

      <!-- 1 ─ Signal Banner -->
      <div :class="['signal-banner', `banner-${bannerState}`]">
        <div class="banner-left">
          <span class="banner-icon">
            {{ bannerState === 'critical' ? '🚨' : bannerState === 'warn' ? '⚡' : '✅' }}
          </span>
          <div class="banner-body">
            <template v-if="bannerState === 'safe'">
              <strong>Semua posisi aman</strong>
              <span class="banner-sub"> — tidak ada sinyal aktif saat ini</span>
            </template>
            <template v-else-if="firstSignal">
              <div class="banner-signal-row">
                <SignalBadge :signal="firstSignal.signal" />
                <span class="banner-name">{{ firstSignal.nama ?? firstSignal.id }}</span>
                <span class="banner-reason">{{ firstSignal.signal_reason || firstSignal.signal }}</span>
              </div>
              <span v-if="signals.length > 1" class="banner-more">
                +{{ signals.length - 1 }} sinyal lainnya
              </span>
            </template>
          </div>
        </div>
        <button
          v-if="bannerState !== 'safe'"
          class="btn-banner"
          @click="router.push('/alerts')"
        >
          Lihat Alerts →
        </button>
      </div>

      <!-- 2 ─ Stat Cards 4-col -->
      <div class="stat-grid">
        <StatCard
          label="TOTAL ASET"
          prefix="Rp"
          :value="formatJuta(summary.total_nilai ?? 0) + ' Jt'"
          variant="accent"
        />
        <StatCard
          label="FLOATING P&L"
          :prefix="isPLPositive ? '+Rp' : '-Rp'"
          :value="formatJuta(Math.abs(totalPL)) + ' Jt'"
          :change="formatPct(summary.total_pl_pct ?? 0)"
          change-label="total"
          :is-positive="isPLPositive"
          :variant="isPLPositive ? 'accent' : 'danger'"
        />
        <StatCard
          label="SINYAL AKTIF"
          :value="String(signals.length)"
          :change="signals.length > 0 ? 'Perlu perhatian' : 'Semua aman'"
          :is-positive="signals.length === 0"
          :variant="signals.length > 0 ? 'danger' : 'default'"
        />
        <StatCard
          label="ALOKASI EMAS"
          :value="emasAktual.toFixed(1) + '%'"
          :change="'target ' + emasTarget + '%'"
          :is-positive="!isEmasOver"
          :variant="isEmasOver ? 'warn' : 'default'"
        />
      </div>

      <!-- 3 ─ 2-1 grid -->
      <div class="main-grid">

        <!-- Left: Allocation chart -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Alokasi Aset</h3>
            <span class="card-meta">vs. target portofolio</span>
          </div>
          <AllocationChart
            :aktual="allokasi?.aktual"
            :target="allokasi?.target"
          />
          <div class="recs-wrap">
            <template v-if="allokasi?.rekomendasi?.length > 0">
              <div class="recs-label">📊 Rekomendasi Rebalance</div>
              <div
                v-for="rec in allokasi.rekomendasi"
                :key="rec.asset"
                class="rec-item"
              >
                <span :class="rec.action === 'TAMBAH' ? 'clr-green' : 'clr-orange'">
                  {{ rec.action }}
                </span>
                <span class="rec-asset">{{ rec.asset }}</span>
                <span class="rec-info">
                  {{ (rec.actual ?? 0).toFixed(1) }}% → {{ rec.target }}%
                </span>
              </div>
            </template>
            <div v-else class="recs-safe">✅ Alokasi dalam batas target</div>
          </div>
        </div>

        <!-- Right: Live market prices -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Live Harga Pasar</h3>
            <span class="card-meta">{{ marketStore.lastSync }}</span>
          </div>

          <!-- Emas row -->
          <div v-if="emasMarket" class="market-row">
            <div class="market-info">
              <span class="price-ticker clr-warn">🥇 ANTAM</span>
              <span class="price-value">{{ formatRupiah(emasMarket.antam_per_gram) }}</span>
              <span class="price-unit">/gram</span>
            </div>
            <div class="market-sparkline">
              <PriceSparkline
                :data="marketStore.goldSparklineData"
                :change-pct="marketStore.goldChangePct"
                :width="100"
                :height="40"
              />
            </div>
          </div>

          <div class="price-sep" />

          <!-- Stock rows -->
          <div
            v-for="stock in stocksData"
            :key="stock.code"
            class="market-row"
          >
            <div class="market-info">
              <span class="price-ticker clr-blue">{{ stock.code }}</span>
              <span class="price-value">{{ formatRupiah(stock.price) }}</span>
              <span :class="['price-chg', (stock.change_pct ?? 0) >= 0 ? 'clr-green' : 'clr-red']">
                {{ (stock.change_pct ?? 0) >= 0 ? '▲' : '▼' }}{{ Math.abs(stock.change_pct ?? 0).toFixed(2) }}%
              </span>
            </div>
            <div class="market-sparkline">
              <PriceSparkline :change-pct="stock.change_pct ?? 0" :width="100" :height="40" />
            </div>
          </div>

          <!-- Empty fallback -->
          <div v-if="!emasMarket && !stocksData.length" class="price-empty">
            <LoadingSpinner size="sm" />
            <span>Memuat harga pasar...</span>
          </div>
        </div>
      </div>

      <!-- 4 ─ Pipeline Workflow -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Workflow Pipeline</h3>
          <span class="card-meta">// Omni-Invest Sentinel System</span>
        </div>
        <div class="pipeline">
          <template v-for="(node, i) in pipeline" :key="node.role">
            <div :class="['p-node', { 'p-node--current': node.isCurrent }]">
              <div :class="['p-icon', { 'p-icon--current': node.isCurrent }]">
                {{ node.icon }}
              </div>
              <RoleBadge :role="node.role" />
              <div class="p-label">{{ node.label }}</div>
              <div class="p-desc">{{ node.desc }}</div>
              <div :class="['p-ts', node.isCurrent ? 'clr-accent' : 'clr-muted']">
                {{ node.ts }}
              </div>
            </div>
            <div v-if="i < pipeline.length - 1" class="p-connector">
              <div class="p-line" />
              <div class="p-arrow" />
            </div>
          </template>
        </div>
      </div>

    </div><!-- /content -->
  </div>
</template>

<style scoped>
/* ── Page wrapper ── */
.dashboard {
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

/* ── Buttons ── */
.btn-action,
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 7px;
  font-size: 12px;
  font-family: var(--font-mono);
  font-weight: 600;
  cursor: pointer;
  border: 1px solid;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.btn-action {
  background: transparent;
  border-color: var(--border);
  color: var(--text2);
}
.btn-action:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}
.btn-action:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-primary {
  background: rgba(0, 229, 160, 0.1);
  border-color: rgba(0, 229, 160, 0.4);
  color: var(--accent);
}
.btn-primary:hover {
  background: rgba(0, 229, 160, 0.18);
  box-shadow: var(--glow-accent);
}

.spin { display: inline-block; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Signal Banner ── */
.signal-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid;
}

.banner-critical {
  background: rgba(255, 71, 87, 0.06);
  border-color: rgba(255, 71, 87, 0.35);
  animation: border-pulse 2s ease-in-out infinite;
}
.banner-warn {
  background: rgba(255, 107, 53, 0.06);
  border-color: rgba(255, 107, 53, 0.35);
}
.banner-safe {
  background: rgba(0, 229, 160, 0.05);
  border-color: rgba(0, 229, 160, 0.2);
}

@keyframes border-pulse {
  0%, 100% { border-color: rgba(255, 71, 87, 0.35); }
  50%       { border-color: rgba(255, 71, 87, 0.7); box-shadow: 0 0 12px rgba(255,71,87,0.15); }
}

.banner-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.banner-icon { font-size: 18px; flex-shrink: 0; }

.banner-body {
  font-size: 13px;
  color: var(--text);
  min-width: 0;
}
.banner-sub  { color: var(--text2); }

.banner-signal-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.banner-name   { font-weight: 600; color: var(--text); }
.banner-reason { color: var(--text2); font-size: 12px; }
.banner-more   { font-size: 11px; color: var(--text3); margin-top: 2px; display: block; }

.btn-banner {
  flex-shrink: 0;
  padding: 6px 14px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text2);
  font-size: 12px;
  font-family: var(--font-mono);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.btn-banner:hover {
  border-color: var(--accent);
  color: var(--accent);
}

/* ── Stat Grid ── */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

/* ── Main 2-1 Grid ── */
.main-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
}

/* ── Card ── */
.card {
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 18px;
}

.card-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 8px;
}

.card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  letter-spacing: 0.2px;
}

.card-meta {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text3);
  flex-shrink: 0;
}

/* ── Allocation recs ── */
.recs-wrap  { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border); }
.recs-label { font-size: 11px; color: var(--text2); margin-bottom: 8px; }

.rec-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  padding: 4px 0;
}
.rec-asset { font-family: var(--font-mono); font-weight: 700; color: var(--text); text-transform: capitalize; }
.rec-info  { color: var(--text3); font-family: var(--font-mono); font-size: 11px; margin-left: auto; }
.recs-safe { font-size: 12px; color: var(--text2); }

/* ── Live prices ── */
.market-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}
.market-row:last-of-type { border-bottom: none; }
.price-sep { height: 1px; background: var(--border); margin: 2px 0; }

.market-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  min-width: 0;
}

.market-sparkline {
  flex-shrink: 0;
  width: 100px;
}

.price-ticker {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.price-value {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.price-unit {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text3);
}

.price-chg {
  font-family: var(--font-mono);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.price-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text3);
  font-size: 12px;
  padding: 12px 0;
}

/* ── Pipeline ── */
.pipeline {
  display: flex;
  align-items: flex-start;
}

.p-node {
  flex: 1;
  min-width: 110px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
  padding: 12px 8px;
  border-radius: 10px;
  border: 1px solid transparent;
  transition: border-color 0.2s;
}

.p-node--current {
  border-color: rgba(0, 229, 160, 0.25);
  background: rgba(0, 229, 160, 0.04);
}

.p-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 50%;
  flex-shrink: 0;
}

.p-icon--current {
  border-color: var(--accent);
  box-shadow: var(--glow-accent);
  background: rgba(0, 229, 160, 0.08);
}

.p-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.p-desc {
  font-size: 10px;
  color: var(--text3);
  line-height: 1.4;
  max-width: 120px;
}

.p-ts {
  font-family: var(--font-mono);
  font-size: 10px;
  line-height: 1.3;
}

/* Connector between nodes */
.p-connector {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  padding-top: 37px; /* 12px node-padding + 48/2 = 36px → center of icon */
  width: 32px;
}

.p-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, var(--blue), var(--accent));
}

.p-arrow {
  width: 0;
  height: 0;
  border-left: 5px solid var(--accent);
  border-top: 3px solid transparent;
  border-bottom: 3px solid transparent;
  margin-top: -1px;
  flex-shrink: 0;
}

/* ── Skeleton ── */
.skeleton-wrap {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.skeleton-body {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
}

.skel {
  background: var(--bg3);
  border-radius: 10px;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skel-card     { height: 100px; }
.skel-left     { height: 280px; }
.skel-right    { height: 280px; }
.skel-pipeline { height: 140px; }

@keyframes shimmer {
  0%, 100% { opacity: 0.3; }
  50%       { opacity: 0.55; }
}

/* ── Color utils (scoped) ── */
.clr-green  { color: var(--green); }
.clr-red    { color: var(--red); }
.clr-orange { color: var(--orange); }
.clr-warn   { color: var(--warn); }
.clr-blue   { color: var(--blue); }
.clr-accent { color: var(--accent); }
.clr-muted  { color: var(--text3); }

/* ── Responsive ── */
@media (max-width: 1100px) {
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .content { padding: 12px; gap: 10px; }
  .stat-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .main-grid { grid-template-columns: 1fr; }
  .skeleton-body { grid-template-columns: 1fr; }

  /* Signal banner: button on second row */
  .signal-banner { flex-direction: column; align-items: stretch; gap: 8px; }
  .btn-banner { min-height: 44px; justify-content: center; display: flex; align-items: center; }
  .banner-body { font-size: 12px; }
  .banner-reason { font-size: 11px; }

  /* Pipeline: vertical on mobile */
  .pipeline {
    flex-direction: column;
    align-items: stretch;
  }
  .p-node {
    flex-direction: row;
    text-align: left;
    align-items: flex-start;
    min-width: unset;
  }
  .p-connector {
    flex-direction: column;
    padding-top: 0;
    padding-left: 35px; /* center under icon: 8px node-pad + 48/2 = 32px */
    width: auto;
    height: 20px;
    align-items: stretch;
  }
  .p-line {
    width: 2px;
    height: 100%;
    background: linear-gradient(180deg, var(--blue), var(--accent));
  }
  .p-arrow {
    border-left: 3px solid transparent;
    border-right: 3px solid transparent;
    border-top: 5px solid var(--accent);
    border-bottom: none;
    margin-top: 0;
    margin-left: -1px;
  }
}
</style>
