<script setup>
import { computed, onMounted } from 'vue'
import { useReportStore } from '@/stores/report'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import StatCard from '@/components/ui/StatCard.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { formatRupiah } from '@/utils/formatters'

const reportStore = useReportStore()

// ── Data ──────────────────────────────────────────────────────
const sahamItems = computed(() => reportStore.report?.saham?.items ?? [])
const signals    = computed(() => reportStore.signals)

const rulesCount = computed(() => sahamItems.value.length * 3 + 1)
const isFirstLoad = computed(() => reportStore.loading && !reportStore.report)

// ── Rule status logic ─────────────────────────────────────────
// Support: TRIGGERED if price <= support, APPROACHING if within 2%, else AMAN
// Resistance: TRIGGERED if price >= resistance, APPROACHING if within 2%
// StopLoss: TRIGGERED if price <= stop_loss, APPROACHING if within 3%
function srStatus(price, level, type) {
  if (!price || !level) return 'unknown'
  const pct = (price - level) / level

  if (type === 'support' || type === 'stoploss') {
    if (price <= level) return 'triggered'
    const threshold = type === 'stoploss' ? 0.03 : 0.02
    if (pct <= threshold) return 'approaching'
    return 'aman'
  }
  if (type === 'resistance') {
    if (price >= level) return 'triggered'
    if (pct >= -0.02) return 'approaching'
    return 'aman'
  }
  return 'aman'
}

const STATUS_LABEL = {
  triggered:  'TRIGGERED',
  approaching: 'APPROACHING',
  aman:        'AMAN',
  unknown:     '—',
}

function ruleRows(item) {
  const p = item.market_price
  return [
    {
      label: 'Support',
      level: item.support,
      status: srStatus(p, item.support, 'support'),
      arrow: '↓',
    },
    {
      label: 'Resistance',
      level: item.resistance,
      status: srStatus(p, item.resistance, 'resistance'),
      arrow: '↑',
    },
    {
      label: 'Stop Loss',
      level: item.stop_loss,
      status: srStatus(p, item.stop_loss, 'stoploss'),
      arrow: '⚠',
    },
  ]
}

onMounted(() => {
  if (!reportStore.report) reportStore.fetchReport()
})
</script>

<template>
  <div class="analyst">
    <AppTopbar title="Analyst" subtitle="Rules engine S/R &amp; ROI proyek" />

    <div v-if="isFirstLoad" class="spinner-wrap">
      <LoadingSpinner size="lg" />
    </div>

    <div v-else class="content">

      <!-- ── 1. StatCards ── -->
      <div class="stat-grid">
        <StatCard
          label="RULES AKTIF"
          :value="String(rulesCount)"
          :change="`${sahamItems.length} saham × 3 level + 1 alokasi`"
          :is-positive="true"
          variant="blue"
        />
        <StatCard
          label="SINYAL TERPICU"
          :value="String(signals.length)"
          :change="signals.length > 0 ? 'Ada aksi diperlukan' : 'Semua posisi aman'"
          :is-positive="signals.length === 0"
          :variant="signals.length > 0 ? 'danger' : 'default'"
        />
        <StatCard
          label="ENGINE STATUS"
          value="AKTIF"
          change="Rules engine berjalan"
          :is-positive="true"
          variant="accent"
        />
      </div>

      <!-- ── 2. Two-column grid ── -->
      <div class="two-col">

        <!-- ── LEFT: S/R Rules ── -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Aturan S/R &amp; Status</span>
            <span class="card-sub mono">{{ sahamItems.length }} emiten</span>
          </div>

          <div v-if="sahamItems.length === 0" class="empty-rules">
            Tidak ada data saham — fetch report terlebih dahulu
          </div>

          <div v-else class="rules-list">
            <div
              v-for="item in sahamItems"
              :key="item.id"
              class="rules-block"
            >
              <!-- Emiten header -->
              <div class="emiten-header">
                <span class="emiten-id mono">{{ item.id }}</span>
                <span class="emiten-price mono">{{ formatRupiah(item.market_price) }}</span>
              </div>

              <!-- 3 rule rows per saham -->
              <div
                v-for="row in ruleRows(item)"
                :key="row.label"
                class="rule-row"
              >
                <span class="rule-label mono">{{ item.id }} {{ row.label }}</span>
                <span class="rule-level mono">{{ formatRupiah(row.level) }}</span>
                <span class="rule-arrow">{{ row.arrow }}</span>
                <span class="rule-price mono">{{ formatRupiah(item.market_price) }}</span>
                <span :class="['rule-status', `status-${row.status}`]">
                  {{ STATUS_LABEL[row.status] }}
                  <span v-if="row.status === 'aman'">✓</span>
                  <span v-else-if="row.status === 'triggered'">!</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- ── RIGHT: ROI Proyek ── -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">ROI Proyek</span>
            <span class="card-sub mono">cost vs benefit</span>
          </div>

          <div class="roi-list">
            <div class="roi-item">
              <span class="roi-icon">💰</span>
              <div class="roi-body">
                <span class="roi-label">Hemat langganan</span>
                <span class="roi-val mono pos">+Rp75.000/bln</span>
              </div>
            </div>
            <div class="roi-item">
              <span class="roi-icon">⏱</span>
              <div class="roi-body">
                <span class="roi-label">Waktu tersimpan</span>
                <span class="roi-val mono">~4 jam/minggu</span>
              </div>
            </div>
            <div class="roi-item">
              <span class="roi-icon">📊</span>
              <div class="roi-body">
                <span class="roi-label">Keputusan berbasis data</span>
                <span class="roi-val mono pos">100%</span>
              </div>
            </div>
            <div class="roi-item">
              <span class="roi-icon">🚫</span>
              <div class="roi-body">
                <span class="roi-label">FOMO tercegah</span>
                <span class="roi-val mono">{{ signals.length }}× bulan ini</span>
              </div>
            </div>
          </div>

          <!-- Highlight box -->
          <div class="roi-highlight">
            <div class="roi-highlight-label mono">PROJECTED ANNUAL SAVING</div>
            <div class="roi-highlight-value mono">Rp 900.000+</div>
            <div class="roi-highlight-sub">Belum termasuk profit optimization</div>
          </div>

          <!-- Alokasi rule note -->
          <div class="alloc-rule">
            <span class="alloc-rule-dot" />
            <span class="alloc-rule-text mono">
              +1 aturan alokasi aktif — target rebalance terpantau otomatis
            </span>
          </div>
        </div>

      </div><!-- /two-col -->
    </div>
  </div>
</template>

<style scoped>
.analyst {
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

/* ── StatCards ── */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

/* ── Two-column layout ── */
.two-col {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 16px;
  align-items: start;
}

/* ── Shared card ── */
.card {
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.card-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: 0.5px;
}

.card-sub {
  font-size: 10px;
  color: var(--text3);
}

/* ── Rules list ── */
.empty-rules {
  padding: 40px;
  text-align: center;
  font-size: 13px;
  color: var(--text3);
  font-family: var(--font-mono);
}

.rules-list {
  display: flex;
  flex-direction: column;
}

.rules-block {
  border-bottom: 1px solid var(--border);
}
.rules-block:last-child { border-bottom: none; }

.emiten-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px 4px;
  background: rgba(0,132,255,0.04);
}

.emiten-id {
  font-size: 12px;
  font-weight: 700;
  color: var(--blue);
  letter-spacing: 0.5px;
}

.emiten-price {
  font-size: 11px;
  color: var(--text2);
}

/* Rule row: label · level · arrow · price · status */
.rule-row {
  display: grid;
  grid-template-columns: 1fr auto auto auto auto;
  align-items: center;
  gap: 10px;
  padding: 6px 16px;
  border-top: 1px solid rgba(35,45,66,0.4);
  font-size: 11px;
}

.rule-label {
  color: var(--text2);
  font-size: 10px;
  letter-spacing: 0.3px;
}

.rule-level {
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

.rule-arrow {
  color: var(--text3);
  font-size: 12px;
  flex-shrink: 0;
}

.rule-price {
  color: var(--text3);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.rule-status {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.8px;
  padding: 2px 7px;
  border-radius: 4px;
  border: 1px solid;
  white-space: nowrap;
}

.status-aman {
  background: rgba(0,229,160,0.08);
  border-color: rgba(0,229,160,0.25);
  color: var(--green);
}
.status-approaching {
  background: rgba(255,217,61,0.08);
  border-color: rgba(255,217,61,0.3);
  color: var(--warn);
}
.status-triggered {
  background: rgba(255,71,87,0.1);
  border-color: rgba(255,71,87,0.4);
  color: var(--red);
}
.status-unknown {
  background: transparent;
  border-color: var(--border);
  color: var(--text3);
}

/* ── ROI list ── */
.roi-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 4px 0;
}

.roi-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(35,45,66,0.5);
}
.roi-item:last-child { border-bottom: none; }

.roi-icon { font-size: 20px; flex-shrink: 0; }

.roi-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.roi-label {
  font-size: 12px;
  color: var(--text2);
}

.roi-val {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}
.roi-val.pos { color: var(--green); }

/* Highlight box */
.roi-highlight {
  margin: 0 16px 16px;
  padding: 16px;
  background: rgba(0,229,160,0.05);
  border: 1px solid rgba(0,229,160,0.15);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.roi-highlight-label {
  font-size: 9px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--text3);
}

.roi-highlight-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--accent);
  line-height: 1.1;
}

.roi-highlight-sub {
  font-size: 11px;
  color: var(--text3);
  margin-top: 2px;
}

/* Alloc rule note */
.alloc-rule {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-top: 1px solid var(--border);
  background: var(--surface);
}

.alloc-rule-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--blue);
  flex-shrink: 0;
}

.alloc-rule-text {
  font-size: 10px;
  color: var(--text3);
  letter-spacing: 0.3px;
}

/* ── Responsive ── */
@media (max-width: 1000px) {
  .two-col { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .content { padding: 12px; gap: 12px; }
  .stat-grid { grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .rule-row { grid-template-columns: 1fr auto auto; gap: 6px; }
  .rule-price { display: none; }
}
</style>
