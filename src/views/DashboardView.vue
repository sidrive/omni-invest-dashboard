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
import GoldHistoryChart from '@/components/charts/GoldHistoryChart.vue'
import StockMiniChart   from '@/components/charts/StockMiniChart.vue'
import ValasMiniChart   from '@/components/charts/ValasMiniChart.vue'
import PriceSparkline   from '@/components/charts/PriceSparkline.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { formatRupiah, formatJuta, formatPct, formatDateTime } from '@/utils/formatters'
import { generateSparklineData } from '@/utils/calculator'

const router = useRouter()
const reportStore = useReportStore()
const marketStore = useMarketStore()

// ── Derived state ──────────────────────────────────────────────
const summary   = computed(() => reportStore.summary)
const allokasi  = computed(() => reportStore.allokasi)
const signals   = computed(() => reportStore.signals)
const criticals = computed(() => reportStore.criticalSignals)
const highs     = computed(() => reportStore.highPrioritySignals)

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

const valasSummary = computed(() => reportStore.valasSummary)

const FLAG_MAP = { USD: '🇺🇸', SGD: '🇸🇬', EUR: '🇪🇺', JPY: '🇯🇵' }

// ── Emas ──────────────────────────────────────────────────────
const emasMarket = computed(() => marketStore.market?.emas ?? null)
const emasItems  = computed(() => reportStore.report?.emas?.items ?? [])
const emasTotal  = computed(() => {
  const modal = emasItems.value.reduce((s, i) => s + (i.modal ?? 0), 0)
  const pl    = emasItems.value.reduce((s, i) => s + (i.pl ?? 0), 0)
  const nilai = emasItems.value.reduce((s, i) => s + (i.nilai_pasar ?? 0), 0)
  return { modal, pl, nilai, pl_pct: modal > 0 ? (pl / modal) * 100 : 0 }
})

// Sparkline emas — 1 data set mewakili semua posisi
const goldSparklineData = computed(() => marketStore.goldSparklineData ?? [])
const goldChangePct     = computed(() => marketStore.goldChangePct ?? 0)

// ── Saham ─────────────────────────────────────────────────────
const sahamItems = computed(() => reportStore.report?.saham?.items ?? [])
const sahamTotal = computed(() => {
  const modal = sahamItems.value.reduce((s, i) => s + (i.modal ?? 0), 0)
  const pl    = sahamItems.value.reduce((s, i) => s + (i.pl ?? 0), 0)
  const nilai = sahamItems.value.reduce((s, i) => s + (i.nilai_pasar ?? 0), 0)
  return { modal, pl, nilai, pl_pct: modal > 0 ? (pl / modal) * 100 : 0 }
})

// ── Valas ─────────────────────────────────────────────────────
const valasItems = computed(() => reportStore.valasItems)

const formatQtyValas = (code, qty) => {
  if (qty == null) return '—'
  if (code === 'JPY') return Math.round(qty).toLocaleString('id-ID')
  return qty.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ── Reksa Dana ────────────────────────────────────────────────
const reksaItems  = computed(() => reportStore.report?.reksadana?.items ?? [])
const reksaNaik   = computed(() => reksaItems.value.filter(i => (i.pl ?? 0) > 0))
const reksaTurun  = computed(() => reksaItems.value.filter(i => (i.pl ?? 0) <= 0))
const reksaTotal  = computed(() => {
  const modal = reksaItems.value.reduce((s, i) => s + (i.modal ?? 0), 0)
  const pl    = reksaItems.value.reduce((s, i) => s + (i.pl ?? 0), 0)
  const nilai = reksaItems.value.reduce((s, i) => s + (i.nilai_pasar ?? 0), 0)
  return { modal, pl, nilai, pl_pct: modal > 0 ? (pl / modal) * 100 : 0 }
})
const reksaNaikTotal = computed(() => ({
  nilai: reksaNaik.value.reduce((s, i) => s + (i.nilai_pasar ?? 0), 0),
  pl:    reksaNaik.value.reduce((s, i) => s + (i.pl ?? 0), 0),
}))
const reksaTurunTotal = computed(() => ({
  nilai: reksaTurun.value.reduce((s, i) => s + (i.nilai_pasar ?? 0), 0),
  pl:    reksaTurun.value.reduce((s, i) => s + (i.pl ?? 0), 0),
}))

// ── P&L format helper ─────────────────────────────────────────
// Returns "+Rp1.234" for positive, "-Rp1.234" for negative, "Rp0" for zero
const fmtPL = (n) => {
  if (!n || n === 0) return formatRupiah(0)
  return (n > 0 ? '+' : '-') + formatRupiah(Math.abs(n))
}
const fmtPct = (n) => {
  if (!n) return '0.00%'
  return (n > 0 ? '+' : '') + Number(n).toFixed(2) + '%'
}

// ── Price History Charts ──────────────────────────────────────
const valasRates = computed(() => {
  const rates = marketStore.valasRates ?? {}
  return Object.entries(rates)
    .filter(([, d]) => d?.rate > 0)
    .map(([code, d]) => ({ code, ...d }))
})

// ── Pipeline ──────────────────────────────────────────────────
const pipeline = computed(() => [
  {
    icon: '◐', role: 'scavenger', label: 'Scavenger',
    desc: 'Fetching harga emas, saham & reksa dana dari market APIs',
    ts: marketStore.lastSync !== '--' ? `Last sync: ${marketStore.lastSync}` : 'Menunggu...',
    isCurrent: false,
  },
  {
    icon: '◑', role: 'analyst', label: 'Analyst',
    desc: 'Analisis S/R levels, kalkulasi P&L, generate sinyal trading',
    ts: reportStore.report?.analyzed_at ? formatDateTime(reportStore.report.analyzed_at) : '--',
    isCurrent: false,
  },
  {
    icon: '⬡', role: 'messenger', label: 'Messenger',
    desc: 'Push notifikasi sinyal critical via Firebase FCM',
    ts: 'Via Firebase Cloud Messaging',
    isCurrent: false,
  },
  {
    icon: '◻', role: 'auditor', label: 'Auditor',
    desc: 'Dashboard monitoring & visualisasi aset real-time',
    ts: '← Kamu di sini',
    isCurrent: true,
  },
])

// ── Fetch & auto-refresh ──────────────────────────────────────
let timer = null

async function refresh() {
  await Promise.all([
    reportStore.fetchReport(),
    marketStore.fetchMarket(),
    marketStore.fetchGoldHistory()
  ])
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
      <div class="skel skel-overview" />
      <div class="skel skel-alloc" />
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
        <button v-if="bannerState !== 'safe'" class="btn-banner" @click="router.push('/alerts')">
          Lihat Alerts →
        </button>
      </div>

      <!-- 2 ─ Stat Cards -->
      <div class="stat-grid">
        <StatCard label="TOTAL ASET" prefix="Rp" :value="formatJuta(summary.total_nilai ?? 0) + ' Jt'" variant="accent" />
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
        <StatCard
          v-if="valasSummary.total_nilai > 0"
          label="VALAS"
          :value="formatJuta(valasSummary.total_nilai)"
          prefix="Rp"
          :change="formatPct(valasSummary.total_pl_pct)"
          change-label="floating"
          :is-positive="valasSummary.total_pl >= 0"
          variant="blue"
        />
      </div>

      <!-- 3 ─ My Portfolio Overview -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">My Portfolio Overview</h3>
          <span class="card-meta">// Real-time · {{ marketStore.lastSync }}</span>
        </div>

        <div v-if="reportStore.loading && !reportStore.report" class="ov-loading">
          <LoadingSpinner size="sm" /><span>Memuat data portfolio...</span>
        </div>

        <template v-else>

          <!-- ── EMAS ── -->
          <div class="ov-section">
            <div class="ov-head">
              <span class="ov-head-title">🥇 Emas</span>
              <span class="ov-head-summary">
                Total Nilai: <strong class="mono">{{ formatRupiah(emasTotal.nilai) }}</strong>
                <span :class="['mono', emasTotal.pl > 0 ? 'clr-green' : emasTotal.pl < 0 ? 'clr-red' : 'clr-muted']">
                  / {{ fmtPL(emasTotal.pl) }} ({{ fmtPct(emasTotal.pl_pct) }})
                </span>
              </span>
            </div>

            <div v-if="reportStore.loading" class="ov-card-loading">
              <LoadingSpinner size="sm" />
            </div>
            <div v-else-if="emasItems.length === 0" class="ov-empty">Tidak ada data emas</div>
            <div v-else class="ov-emas-grid">
              <div v-for="item in emasItems" :key="item.id" class="ov-card ov-card--chart">
                <!-- Kiri: info -->
                <div class="ov-card-info">
                  <div class="ov-card-title">{{ item.nama }}</div>
                  <div v-if="item.catatan" class="ov-card-sub">{{ item.catatan }}</div>
                  <div class="ov-metrics">
                    <div class="ov-metric">
                      <span class="ov-metric-lbl">Nilai</span>
                      <span class="ov-metric-val mono">{{ formatRupiah(item.nilai_pasar) }}</span>
                    </div>
                    <div class="ov-metric">
                      <span class="ov-metric-lbl">Keuntungan</span>
                      <span :class="['ov-metric-val mono', item.pl > 0 ? 'clr-green' : item.pl < 0 ? 'clr-red' : 'clr-muted']">
                        {{ fmtPL(item.pl) }}
                      </span>
                      <span :class="['ov-metric-pct mono', item.pl > 0 ? 'clr-green' : item.pl < 0 ? 'clr-red' : 'clr-muted']">
                        ({{ fmtPct(item.pl_pct) }})
                      </span>
                    </div>
                  </div>
                </div>
                <!-- Kanan: grafik emas (data sama untuk semua posisi emas) -->
                <div class="ov-card-chart ov-emas-chart">
                  <PriceSparkline
                    :data="goldSparklineData"
                    :changePct="goldChangePct"
                    :width="100"
                    :height="52"
                  />
                  <span class="ov-chart-label mono">
                    {{ goldChangePct >= 0 ? '▲' : '▼' }}{{ Math.abs(goldChangePct).toFixed(2) }}% hari ini
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="ov-sep" />

          <!-- ── SAHAM ── -->
          <div class="ov-section">
            <div class="ov-head">
              <span class="ov-head-title">📈 Saham</span>
              <span class="ov-head-summary">
                Total Nilai: <strong class="mono">{{ formatRupiah(sahamTotal.nilai) }}</strong>
                <span :class="['mono', sahamTotal.pl > 0 ? 'clr-green' : sahamTotal.pl < 0 ? 'clr-red' : 'clr-muted']">
                  / {{ fmtPL(sahamTotal.pl) }} ({{ fmtPct(sahamTotal.pl_pct) }})
                </span>
              </span>
            </div>

            <div v-if="reportStore.loading" class="ov-card-loading">
              <LoadingSpinner size="sm" />
            </div>
            <div v-else-if="sahamItems.length === 0" class="ov-empty">Tidak ada data saham</div>
            <div v-else class="ov-list">
              <div v-for="item in sahamItems" :key="item.id" class="ov-card ov-card--chart">
                <!-- Kiri: info -->
                <div class="ov-card-info">
                  <div class="ov-saham-top">
                    <div>
                      <div class="ov-card-title mono clr-accent">{{ item.ticker?.replace('.JK', '') }}</div>
                      <div class="ov-card-sub">{{ item.nama }}</div>
                    </div>
                    <span class="ov-lot mono">{{ item.qty_lot }} Lot</span>
                  </div>
                  <div class="ov-metrics">
                    <div class="ov-metric">
                      <span class="ov-metric-lbl">Nilai</span>
                      <span class="ov-metric-val mono">{{ formatRupiah(item.nilai_pasar) }}</span>
                    </div>
                    <div class="ov-metric">
                      <span class="ov-metric-lbl">Return</span>
                      <span :class="['ov-metric-val mono', item.pl > 0 ? 'clr-green' : item.pl < 0 ? 'clr-red' : 'clr-muted']">
                        {{ fmtPL(item.pl) }} ({{ fmtPct(item.pl_pct) }})
                      </span>
                    </div>
                  </div>
                </div>
                <!-- Kanan: grafik per saham -->
                <div class="ov-card-chart">
                  <PriceSparkline
                    :data="generateSparklineData(item.change_pct ?? 0, 14)"
                    :changePct="item.change_pct ?? 0"
                    :width="100"
                    :height="52"
                  />
                  <span :class="['ov-chart-label mono', (item.change_pct ?? 0) >= 0 ? 'clr-green' : 'clr-red']">
                    {{ (item.change_pct ?? 0) >= 0 ? '▲' : '▼' }}{{ Math.abs(item.change_pct ?? 0).toFixed(2) }}% hari ini
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- ── VALAS (hidden if empty) ── -->
          <template v-if="valasItems.length > 0">
            <div class="ov-sep" />
            <div class="ov-section">
              <div class="ov-head">
                <span class="ov-head-title">💱 Valas</span>
                <span class="ov-head-summary">
                  Total Nilai: <strong class="mono">{{ formatRupiah(valasSummary.total_nilai) }}</strong>
                  <span :class="['mono', (valasSummary.total_pl ?? 0) > 0 ? 'clr-green' : (valasSummary.total_pl ?? 0) < 0 ? 'clr-red' : 'clr-muted']">
                    / {{ fmtPL(valasSummary.total_pl) }} ({{ fmtPct(valasSummary.total_pl_pct) }})
                  </span>
                </span>
              </div>
              <div class="ov-list">
                <div v-for="item in valasItems" :key="item.id" class="ov-card ov-card--chart">
                  <!-- Kiri: info -->
                  <div class="ov-card-info">
                    <div class="ov-valas-top">
                      <span class="ov-card-title mono">{{ FLAG_MAP[item.code] ?? '🏳️' }} {{ item.code }} / IDR</span>
                      <span class="ov-valas-qty mono">Qty: {{ formatQtyValas(item.code, item.qty_unit) }}</span>
                    </div>
                    <div class="ov-metrics">
                      <div class="ov-metric">
                        <span class="ov-metric-lbl">Kurs</span>
                        <span class="ov-metric-val mono">
                          {{ formatRupiah(item.current_rate) }}
                          <span :class="(item.change_pct ?? 0) >= 0 ? 'clr-green' : 'clr-red'">
                            ({{ (item.change_pct ?? 0) >= 0 ? '▲' : '▼' }}{{ Math.abs(item.change_pct ?? 0).toFixed(2) }}%)
                          </span>
                        </span>
                      </div>
                      <div class="ov-metric">
                        <span class="ov-metric-lbl">Performa</span>
                        <span :class="['ov-metric-val mono', item.pl > 0 ? 'clr-green' : item.pl < 0 ? 'clr-red' : 'clr-muted']">
                          {{ fmtPL(item.pl) }} ({{ fmtPct(item.pl_pct) }})
                        </span>
                      </div>
                    </div>
                  </div>
                  <!-- Kanan: grafik per kurs valas -->
                  <div :class="['ov-card-chart', (item.change_pct ?? 0) >= 0 ? 'ov-valas-chart--up' : 'ov-valas-chart--down']">
                    <PriceSparkline
                      :data="generateSparklineData(item.change_pct ?? 0, 14)"
                      :changePct="item.change_pct ?? 0"
                      :width="100"
                      :height="52"
                    />
                    <span :class="['ov-chart-label mono', (item.change_pct ?? 0) >= 0 ? 'clr-green' : 'clr-red']">
                      {{ (item.change_pct ?? 0) >= 0 ? '▲' : '▼' }}{{ Math.abs(item.change_pct ?? 0).toFixed(2) }}% hari ini
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- ── REKSA DANA ── -->
          <div class="ov-sep" />
          <div class="ov-section">
            <div class="ov-head">
              <span class="ov-head-title">🏦 Reksa Dana</span>
              <span class="ov-head-summary">
                Total Nilai: <strong class="mono">{{ formatRupiah(reksaTotal.nilai) }}</strong>
                <span :class="['mono', reksaTotal.pl > 0 ? 'clr-green' : reksaTotal.pl < 0 ? 'clr-red' : 'clr-muted']">
                  / {{ fmtPL(reksaTotal.pl) }} {{ reksaTotal.pl > 0 ? 'Profit' : reksaTotal.pl < 0 ? 'Loss' : '' }}
                </span>
              </span>
            </div>

            <div v-if="reportStore.loading" class="ov-card-loading">
              <LoadingSpinner size="sm" />
            </div>
            <div v-else-if="reksaItems.length === 0" class="ov-empty">Tidak ada data reksa dana</div>
            <div v-else class="ov-reksa-dual">

              <!-- Card kiri: Profit -->
              <div class="ov-reksa-card ov-reksa-card--profit">
                <div class="ov-reksa-card-head">
                  <div class="ov-reksa-head-left">
                    <span class="ov-reksa-card-title clr-green">▲ Profit</span>
                    <span class="ov-reksa-card-count">{{ reksaNaik.length }} produk</span>
                  </div>
                  <div class="ov-reksa-head-right">
                    <span class="mono ov-rh-nilai">{{ formatRupiah(reksaNaikTotal.nilai) }}</span>
                    <span class="mono ov-rh-pl clr-green">{{ fmtPL(reksaNaikTotal.pl) }}</span>
                  </div>
                </div>
                <div class="ov-reksa-table">
                  <div class="ov-reksa-thead">
                    <span>Nama Produk</span>
                    <span class="col-right">Nilai Aset</span>
                    <span class="col-right">Profit</span>
                  </div>
                  <div v-if="reksaNaik.length === 0" class="ov-reksa-empty">Tidak ada posisi profit</div>
                  <div
                    v-for="(item, idx) in reksaNaik"
                    :key="item.id"
                    :class="['ov-reksa-row', { 'ov-reksa-row--alt': idx % 2 === 1 }]"
                  >
                    <span class="ov-reksa-nama">{{ item.nama }}</span>
                    <span class="ov-reksa-nilai mono col-right">{{ formatRupiah(item.nilai_pasar) }}</span>
                    <div class="ov-reksa-pl col-right">
                      <span class="mono clr-green">{{ fmtPL(item.pl) }}</span>
                      <span class="mono ov-pct-sm clr-green">{{ fmtPct(item.pl_pct) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Card kanan: Loss -->
              <div class="ov-reksa-card ov-reksa-card--loss">
                <div class="ov-reksa-card-head">
                  <div class="ov-reksa-head-left">
                    <span class="ov-reksa-card-title clr-red">▼ Loss / Flat</span>
                    <span class="ov-reksa-card-count">{{ reksaTurun.length }} produk</span>
                  </div>
                  <div class="ov-reksa-head-right">
                    <span class="mono ov-rh-nilai">{{ formatRupiah(reksaTurunTotal.nilai) }}</span>
                    <span :class="['mono ov-rh-pl', reksaTurunTotal.pl < 0 ? 'clr-red' : 'clr-muted']">{{ fmtPL(reksaTurunTotal.pl) }}</span>
                  </div>
                </div>
                <div class="ov-reksa-table">
                  <div class="ov-reksa-thead">
                    <span>Nama Produk</span>
                    <span class="col-right">Nilai Aset</span>
                    <span class="col-right">Loss</span>
                  </div>
                  <div v-if="reksaTurun.length === 0" class="ov-reksa-empty">Tidak ada posisi loss</div>
                  <div
                    v-for="(item, idx) in reksaTurun"
                    :key="item.id"
                    :class="['ov-reksa-row', { 'ov-reksa-row--alt': idx % 2 === 1 }]"
                  >
                    <span class="ov-reksa-nama">{{ item.nama }}</span>
                    <span class="ov-reksa-nilai mono col-right">{{ formatRupiah(item.nilai_pasar) }}</span>
                    <div class="ov-reksa-pl col-right">
                      <span :class="['mono', item.pl < 0 ? 'clr-red' : 'clr-muted']">{{ fmtPL(item.pl) }}</span>
                      <span :class="['mono ov-pct-sm', item.pl_pct < 0 ? 'clr-red' : 'clr-muted']">{{ fmtPct(item.pl_pct) }}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </template>
      </div>

      <!-- ── 3b: Price History Charts ── -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">// Price History</h3>
          <span class="card-meta">Simulasi tren harga · emas = data real {{ marketStore.goldHistory.length }} hari</span>
        </div>

        <div class="ph-grid">

          <!-- Kolom Emas (lebih lebar) -->
          <div class="ph-col ph-col--emas">
            <div class="ph-col-label">🥇 Emas</div>
            <GoldHistoryChart />
          </div>

          <!-- Kolom Saham -->
          <div v-if="sahamItems.length > 0" class="ph-col">
            <div class="ph-col-label">📈 Saham</div>
            <div class="ph-stack">
              <StockMiniChart
                v-for="item in sahamItems"
                :key="item.id"
                v-bind="item"
              />
            </div>
          </div>

          <!-- Kolom Valas -->
          <div v-if="valasRates.length > 0" class="ph-col">
            <div class="ph-col-label">💱 Valas</div>
            <div class="ph-stack">
              <ValasMiniChart
                v-for="v in valasRates"
                :key="v.code"
                v-bind="v"
              />
            </div>
          </div>

        </div>
      </div>

      <!-- 4 ─ Alokasi Aset -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Alokasi Aset</h3>
          <span class="card-meta">vs. target portofolio</span>
        </div>
        <AllocationChart :aktual="allokasi?.aktual" :target="allokasi?.target" />
        <div class="recs-wrap">
          <template v-if="allokasi?.rekomendasi?.length > 0">
            <div class="recs-label">📊 Rekomendasi Rebalance</div>
            <div v-for="rec in allokasi.rekomendasi" :key="rec.asset" class="rec-item">
              <span :class="rec.action === 'TAMBAH' ? 'clr-green' : 'clr-orange'">{{ rec.action }}</span>
              <span class="rec-asset">{{ rec.asset }}</span>
              <span class="rec-info">{{ (rec.actual ?? 0).toFixed(1) }}% → {{ rec.target }}%</span>
            </div>
          </template>
          <div v-else class="recs-safe">✅ Alokasi dalam batas target</div>
        </div>
      </div>

      <!-- 5 ─ Pipeline Workflow -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Workflow Pipeline</h3>
          <span class="card-meta">// Omni-Invest Sentinel System</span>
        </div>
        <div class="pipeline">
          <template v-for="(node, i) in pipeline" :key="node.role">
            <div :class="['p-node', { 'p-node--current': node.isCurrent }]">
              <div :class="['p-icon', { 'p-icon--current': node.isCurrent }]">{{ node.icon }}</div>
              <RoleBadge :role="node.role" />
              <div class="p-label">{{ node.label }}</div>
              <div class="p-desc">{{ node.desc }}</div>
              <div :class="['p-ts', node.isCurrent ? 'clr-accent' : 'clr-muted']">{{ node.ts }}</div>
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
.btn-action { background: transparent; border-color: var(--border); color: var(--text2); }
.btn-action:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.btn-action:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-primary { background: rgba(0,229,160,0.1); border-color: rgba(0,229,160,0.4); color: var(--accent); }
.btn-primary:hover { background: rgba(0,229,160,0.18); box-shadow: var(--glow-accent); }

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
.banner-critical { background: rgba(255,71,87,0.06); border-color: rgba(255,71,87,0.35); animation: border-pulse 2s ease-in-out infinite; }
.banner-warn     { background: rgba(255,107,53,0.06); border-color: rgba(255,107,53,0.35); }
.banner-safe     { background: rgba(0,229,160,0.05); border-color: rgba(0,229,160,0.2); }

@keyframes border-pulse {
  0%,100% { border-color: rgba(255,71,87,0.35); }
  50%      { border-color: rgba(255,71,87,0.7); box-shadow: 0 0 12px rgba(255,71,87,0.15); }
}

.banner-left { display: flex; align-items: center; gap: 10px; min-width: 0; }
.banner-icon { font-size: 18px; flex-shrink: 0; }
.banner-body { font-size: 13px; color: var(--text); min-width: 0; }
.banner-sub  { color: var(--text2); }
.banner-signal-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.banner-name   { font-weight: 600; color: var(--text); }
.banner-reason { color: var(--text2); font-size: 12px; }
.banner-more   { font-size: 11px; color: var(--text3); margin-top: 2px; display: block; }
.btn-banner {
  flex-shrink: 0; padding: 6px 14px; background: transparent;
  border: 1px solid var(--border); border-radius: 6px; color: var(--text2);
  font-size: 12px; font-family: var(--font-mono); cursor: pointer;
  white-space: nowrap; transition: all 0.15s;
}
.btn-banner:hover { border-color: var(--accent); color: var(--accent); }

/* ── Stat Grid ── */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

/* ── Card base ── */
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
  margin-bottom: 20px;
  gap: 8px;
}
.card-title { font-size: 13px; font-weight: 600; color: var(--text); letter-spacing: 0.2px; }
.card-meta  { font-family: var(--font-mono); font-size: 10px; color: var(--text3); flex-shrink: 0; }

/* ── Portfolio Overview ── */
.ov-section {
  padding: 16px 0;
}
.ov-section:first-child { padding-top: 0; }
.ov-section:last-child  { padding-bottom: 0; }

.ov-sep {
  height: 1px;
  background: var(--border);
  margin: 0;
}

.ov-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.ov-head-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  flex-shrink: 0;
}

.ov-head-summary {
  font-size: 13px;
  color: var(--text2);
  text-align: right;
}

/* Emas: 2-column card grid */
.ov-emas-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

/* Saham/Valas: vertical list */
.ov-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Item card */
.ov-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 14px 16px;
}

/* ── Card dengan inline chart (layout 2 kolom) ── */
.ov-card--chart {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  align-items: center;
}

.ov-card-info {
  min-width: 0;
}

.ov-card-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding-left: 12px;
  border-left: 1px solid var(--border);
}

/* Override warna sparkline emas ke --warn (kuning) */
.ov-emas-chart :deep(.sparkline path[fill="none"]) {
  stroke: var(--warn) !important;
}
.ov-emas-chart :deep(.sparkline stop) {
  stop-color: var(--warn) !important;
}

/* Override warna sparkline valas positif ke --blue */
.ov-valas-chart--up :deep(.sparkline path[fill="none"]) {
  stroke: var(--blue) !important;
}
.ov-valas-chart--up :deep(.sparkline stop) {
  stop-color: var(--blue) !important;
}

.ov-chart-label {
  font-size: 10px;
  color: var(--text3);
  white-space: nowrap;
}

.ov-card-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
}

.ov-card-sub {
  font-size: 12px;
  color: var(--text2);
  margin-top: 3px;
}

/* Saham card header row */
.ov-saham-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.ov-lot {
  font-size: 12px;
  color: var(--text2);
  flex-shrink: 0;
  padding-top: 2px;
}

/* Valas card header row */
.ov-valas-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.ov-valas-qty {
  font-size: 11px;
  color: var(--text3);
}

/* Metrics row within card */
.ov-metrics {
  display: flex;
  gap: 24px;
  margin-top: 12px;
}

.ov-metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.ov-metric-lbl {
  font-size: 11px;
  color: var(--text3);
}

.ov-metric-val {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.ov-metric-pct {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

/* Emas card: Keuntungan column right-aligned */
.ov-emas-grid .ov-metric:last-child {
  align-items: flex-end;
  text-align: right;
}

/* Reksa Dana — 2-card dual layout */
.ov-reksa-dual {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.ov-reksa-card {
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.ov-reksa-card--profit { border-top: 2px solid rgba(0, 229, 160, 0.35); }
.ov-reksa-card--loss   { border-top: 2px solid rgba(255, 71, 87, 0.35); }

.ov-reksa-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 14px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.ov-reksa-head-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ov-reksa-head-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
}

.ov-rh-nilai {
  font-size: 12px;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

.ov-rh-pl {
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.ov-reksa-card-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.ov-reksa-card-count {
  font-size: 10px;
  color: var(--text3);
  font-family: var(--font-mono);
}

.ov-reksa-table {
  flex: 1;
}

.ov-reksa-thead {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 10px;
  padding: 8px 14px;
  background: rgba(26, 33, 51, 0.5);
  font-size: 10px;
  color: var(--text3);
  font-weight: 500;
  letter-spacing: 0.3px;
  border-bottom: 1px solid var(--border);
}

.ov-reksa-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 10px;
  padding: 9px 14px;
  align-items: center;
  border-bottom: 1px solid rgba(35, 45, 66, 0.5);
}
.ov-reksa-row:last-child { border-bottom: none; }

.ov-reksa-row--alt {
  background: rgba(26, 33, 51, 0.3);
}

.ov-reksa-empty {
  font-size: 11px;
  color: var(--text3);
  font-style: italic;
  padding: 12px 14px;
  text-align: center;
}

.ov-reksa-nama {
  font-size: 12px;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.ov-reksa-nilai {
  font-size: 12px;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.ov-reksa-pl {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
  min-width: 80px;
}

.ov-pct-sm {
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.col-right {
  text-align: right;
  justify-self: end;
}

/* Loading states */
.ov-loading, .ov-card-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: var(--text3);
  font-size: 12px;
}

.ov-empty {
  font-size: 12px;
  color: var(--text3);
  font-style: italic;
  padding: 8px 0;
}

/* ── Price History ── */
.ph-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr;
  gap: 16px;
  align-items: start;
}
.ph-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ph-col-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text2);
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border);
}
.ph-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (max-width: 1024px) {
  .ph-grid { grid-template-columns: 1fr 1fr; }
  .ph-col--emas { grid-column: 1 / -1; }
}
@media (max-width: 768px) {
  .ph-grid { grid-template-columns: 1fr; }
  .ph-col--emas { grid-column: unset; }
}

/* ── Allocation recs ── */
.recs-wrap  { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border); }
.recs-label { font-size: 11px; color: var(--text2); margin-bottom: 8px; }
.rec-item   { display: flex; align-items: center; gap: 8px; font-size: 12px; padding: 4px 0; }
.rec-asset  { font-family: var(--font-mono); font-weight: 700; color: var(--text); text-transform: capitalize; }
.rec-info   { color: var(--text3); font-family: var(--font-mono); font-size: 11px; margin-left: auto; }
.recs-safe  { font-size: 12px; color: var(--text2); }

/* ── Pipeline ── */
.pipeline { display: flex; align-items: flex-start; }

.p-node {
  flex: 1; min-width: 110px;
  display: flex; flex-direction: column; align-items: center; text-align: center;
  gap: 6px; padding: 12px 8px;
  border-radius: 10px; border: 1px solid transparent; transition: border-color 0.2s;
}
.p-node--current { border-color: rgba(0,229,160,0.25); background: rgba(0,229,160,0.04); }

.p-icon {
  width: 48px; height: 48px;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; background: var(--surface); border: 1px solid var(--border); border-radius: 50%;
}
.p-icon--current { border-color: var(--accent); box-shadow: var(--glow-accent); background: rgba(0,229,160,0.08); }

.p-label { font-size: 13px; font-weight: 600; color: var(--text); }
.p-desc  { font-size: 10px; color: var(--text3); line-height: 1.4; max-width: 120px; }
.p-ts    { font-family: var(--font-mono); font-size: 10px; line-height: 1.3; }

.p-connector { flex-shrink: 0; display: flex; align-items: flex-start; padding-top: 37px; width: 32px; }
.p-line  { flex: 1; height: 2px; background: linear-gradient(90deg, var(--blue), var(--accent)); }
.p-arrow {
  width: 0; height: 0;
  border-left: 5px solid var(--accent);
  border-top: 3px solid transparent; border-bottom: 3px solid transparent;
  margin-top: -1px; flex-shrink: 0;
}

/* ── Skeleton ── */
.skeleton-wrap { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.skeleton-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.skel { background: var(--bg3); border-radius: 10px; animation: shimmer 1.5s ease-in-out infinite; }
.skel-card     { height: 100px; }
.skel-overview { height: 420px; }
.skel-alloc    { height: 180px; }
.skel-pipeline { height: 140px; }
@keyframes shimmer { 0%,100% { opacity: 0.3; } 50% { opacity: 0.55; } }

/* ── Color utils ── */
.mono       { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
.clr-green  { color: var(--green); }
.clr-red    { color: var(--red); }
.clr-orange { color: var(--orange); }
.clr-accent { color: var(--accent); }
.clr-muted  { color: var(--text3); }

/* ── Responsive ── */

/* Small desktop (1024–1280px): stat cards tetap 1 baris, semua lebih kompak */
@media (max-width: 1280px) {
  .content   { padding: 10px 14px; gap: 8px; }
  .card      { padding: 12px 14px; }
  .stat-grid { gap: 8px; }

  /* Override StatCard internal via :deep() */
  .stat-grid :deep(.stat-card)    { padding: 7px 12px; gap: 2px; }
  .stat-grid :deep(.stat-value)   { font-size: clamp(14px, 2.8vw, 18px); }
  .stat-grid :deep(.stat-prefix)  { font-size: 12px; }
  .stat-grid :deep(.stat-change)  { font-size: 10px; }
  .stat-grid :deep(.stat-label)   { font-size: 8px; letter-spacing: 1.5px; }

  /* Kompres portfolio sections */
  .card-header    { margin-bottom: 12px; }
  .ov-section     { padding: 8px 0; }
  .ov-head        { margin-bottom: 6px; }
  .ov-head-title  { font-size: 13px; }
  .ov-head-summary { font-size: 11px; }

  /* Emas grid lebih rapat */
  .ov-emas-grid   { gap: 8px; }

  /* Item cards lebih kecil */
  .ov-card        { padding: 9px 11px; }
  .ov-card-title  { font-size: 13px; }
  .ov-card-sub    { font-size: 10px; margin-top: 1px; }
  .ov-saham-top   { margin-bottom: 5px; }
  .ov-valas-top   { margin-bottom: 5px; }
  .ov-list        { gap: 6px; }

  /* Metrics dalam card */
  .ov-metrics     { gap: 14px; margin-top: 7px; }
  .ov-metric-lbl  { font-size: 9px; }
  .ov-metric-val  { font-size: 12px; }
  .ov-metric-pct  { font-size: 10px; }

  /* Reksa table rows lebih kecil */
  .ov-reksa-thead,
  .ov-reksa-row   { padding: 7px 12px; font-size: 11px; }
  .ov-reksa-nama  { font-size: 11px; }
  .ov-reksa-nilai { font-size: 11px; }
  .ov-pct-sm      { font-size: 10px; }
  .ov-reksa-card-head { padding: 8px 12px; }
}

@media (max-width: 768px) {
  .content  { padding: 12px; gap: 10px; }
  .stat-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .skeleton-stat-grid { grid-template-columns: repeat(2, 1fr); }
  .ov-emas-grid { grid-template-columns: 1fr; }
  .ov-head  { flex-direction: column; align-items: flex-start; }
  .ov-head-summary { text-align: left; }
  .ov-reksa-dual { grid-template-columns: 1fr; }
  .ov-reksa-thead,
  .ov-reksa-row { gap: 6px; padding: 8px 10px; }
  .ov-reksa-nama { font-size: 11px; }

  .ov-card--chart {
    grid-template-columns: 1fr;
  }
  .ov-card-chart {
    border-left: none;
    border-top: 1px solid var(--border);
    padding-left: 0;
    padding-top: 10px;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .signal-banner { flex-direction: column; align-items: stretch; gap: 8px; }
  .btn-banner { min-height: 44px; justify-content: center; display: flex; align-items: center; }

  .pipeline { flex-direction: column; align-items: stretch; }
  .p-node { flex-direction: row; text-align: left; align-items: flex-start; min-width: unset; }
  .p-connector { flex-direction: column; padding-top: 0; padding-left: 35px; width: auto; height: 20px; align-items: stretch; }
  .p-line { width: 2px; height: 100%; background: linear-gradient(180deg, var(--blue), var(--accent)); }
  .p-arrow { border-left: 3px solid transparent; border-right: 3px solid transparent; border-top: 5px solid var(--accent); border-bottom: none; margin-top: 0; margin-left: -1px; }
}
</style>
