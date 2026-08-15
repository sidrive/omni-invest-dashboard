<script setup>
import { computed, onMounted } from 'vue'
import { useMarketStore } from '@/stores/market'
import { useReportStore } from '@/stores/report'
import { useToast } from '@/composables/useToast'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import StatCard from '@/components/ui/StatCard.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { formatRupiah, formatDateTime } from '@/utils/formatters'

const marketStore = useMarketStore()
const reportStore = useReportStore()
const { showToast } = useToast()

// ── Stats ─────────────────────────────────────────────────────
const lastFetch = computed(() => marketStore.lastSync)

const fetchedAt = computed(() =>
  marketStore.market?.fetched_at
    ? formatDateTime(marketStore.market.fetched_at) + ' WIB'
    : marketStore.lastSync
)

// ── Data Sources ──────────────────────────────────────────────
// Pakai field `status` asli dari backend ("success"/"fallback"/"error"),
// bukan cuma truthy-check goldPrice — fallback tetap mengisi antam_per_gram
// (angka lama), jadi truthy-check saja akan salah nampilin fallback sebagai OK.
const emasSourceLabel = computed(() => marketStore.market?.emas?.source || 'logammulia.com')
const emasStatus = computed(() => marketStore.market?.emas?.status === 'success' ? 'ok' : 'err')
const sahamStatus = computed(() => {
  const n = marketStore.stockList.length
  return n === 0 ? 'err' : 'ok'
})

const sahamValueLabel = computed(() => {
  const list = marketStore.stockList
  if (!list.length) return '—'
  const tickers = list.slice(0, 4).map(s => s.ticker ?? s.id ?? '?').join(', ')
  return `${tickers}${list.length > 4 ? ` +${list.length - 4} lainnya` : ''}`
})

// ── Manual Fetch ──────────────────────────────────────────────
async function runPipeline() {
  const result = await reportStore.runPipeline()
  if (result.ok) {
    await marketStore.fetchMarket()
    showToast('Pipeline selesai! Data terbaru dimuat.', 'success')
  } else {
    showToast(result.message ?? 'Pipeline gagal dijalankan', 'error')
  }
}

// ── JSON syntax highlighting ──────────────────────────────────
function highlightJSON(obj) {
  if (!obj) return '<span style="color:var(--text3)">null</span>'
  const json = JSON.stringify(obj, null, 2)
  // Escape HTML first
  const escaped = json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'j-key' : 'j-str'
      } else if (/true|false|null/.test(match)) {
        cls = 'j-bool'
      } else {
        cls = 'j-num'
      }
      return `<span class="${cls}">${match}</span>`
    },
  )
}

const rawJSON = computed(() => highlightJSON(marketStore.market))

onMounted(async () => {
  if (!marketStore.market) await marketStore.fetchMarket()
})
</script>

<template>
  <div class="scavenger">
    <AppTopbar title="Scavenger" subtitle="Status data fetcher &amp; pipeline">
      <template #actions>
        <button
          class="btn-run"
          :disabled="reportStore.running || marketStore.loading"
          @click="runPipeline"
        >
          <span :class="{ spin: reportStore.running }">⟳</span>
          {{ reportStore.running ? 'Fetching...' : 'Manual Fetch' }}
        </button>
      </template>
    </AppTopbar>

    <div v-if="marketStore.loading && !marketStore.market" class="spinner-wrap">
      <LoadingSpinner size="lg" />
    </div>

    <div v-else class="content">

      <!-- ── 1. StatCards ── -->
      <div class="stat-grid">
        <StatCard
          label="LAST FETCH"
          :value="lastFetch"
          change="Terakhir diperbarui"
          :is-positive="true"
          variant="default"
        />
        <StatCard
          label="DATA SOURCES"
          value="3"
          change="Emas · Saham · Reksa"
          :is-positive="true"
          variant="blue"
        />
        <StatCard
          label="SCHEDULE"
          value="09–16"
          change="WIB — Setiap hari kerja"
          :is-positive="true"
          variant="default"
        />
      </div>

      <!-- ── 2. Data Sources & Status ── -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Data Sources &amp; Status</span>
          <span class="card-ts mono">{{ fetchedAt }}</span>
        </div>

        <div class="source-table">
          <!-- Header -->
          <div class="source-row source-head">
            <span>Sumber Data</span>
            <span>URL / Origin</span>
            <span>Status</span>
            <span>Nilai Terakhir</span>
            <span>Timestamp</span>
          </div>

          <!-- Harga Emas -->
          <div class="source-row">
            <span class="source-name">🥇 Harga Emas</span>
            <span class="source-url mono">{{ emasSourceLabel }}</span>
            <span>
              <span :class="['health-badge', `health-${emasStatus}`]">
                {{ emasStatus === 'ok' ? 'OK' : 'ERROR' }}
              </span>
            </span>
            <span class="source-val mono">
              {{ marketStore.goldPrice ? formatRupiah(marketStore.goldPrice) + '/g' : '—' }}
            </span>
            <span class="source-ts mono">{{ lastFetch }}</span>
          </div>

          <!-- Harga Saham -->
          <div class="source-row">
            <span class="source-name">📈 Harga Saham</span>
            <span class="source-url mono">finance.yahoo.com</span>
            <span>
              <span :class="['health-badge', `health-${sahamStatus}`]">
                {{ sahamStatus === 'ok' ? 'OK' : sahamStatus === 'warn' ? 'PARTIAL' : 'ERROR' }}
              </span>
            </span>
            <span class="source-val mono small">{{ sahamValueLabel }}</span>
            <span class="source-ts mono">{{ lastFetch }}</span>
          </div>

          <!-- NAB Reksa Dana -->
          <div class="source-row">
            <span class="source-name">🏦 NAB Reksa Dana</span>
            <span class="source-url mono">Manual</span>
            <span>
              <span class="health-badge health-warn">PENDING</span>
            </span>
            <span class="source-val mono">Update jam 16:30</span>
            <span class="source-ts mono">—</span>
          </div>
        </div>
      </div>

      <!-- ── 3. Raw JSON Output ── -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Raw JSON Output</span>
          <span class="card-badge mono">market data</span>
        </div>

        <div v-if="!marketStore.market" class="json-empty">
          Tidak ada data — klik Manual Fetch untuk memuat
        </div>

        <pre
          v-else
          class="json-block"
          v-html="rawJSON"
        />
      </div>

    </div>
  </div>
</template>

<style scoped>
.scavenger {
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

/* ── Card ── */
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

.card-ts {
  font-size: 10px;
  color: var(--text3);
}

.card-badge {
  font-size: 10px;
  color: var(--blue);
  background: rgba(0,132,255,0.1);
  border: 1px solid rgba(0,132,255,0.25);
  border-radius: 4px;
  padding: 2px 8px;
}

/* ── Source table ── */
.source-table {
  display: flex;
  flex-direction: column;
}

.source-row {
  display: grid;
  grid-template-columns: 160px 1fr 90px 1fr 120px;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(35,45,66,0.5);
  font-size: 12px;
}
.source-row:last-child { border-bottom: none; }

.source-head {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text3);
  background: var(--surface);
  padding: 8px 16px;
}

.source-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.source-url {
  font-size: 11px;
  color: var(--blue);
}

.source-val {
  font-size: 12px;
  color: var(--text);
}
.source-val.small { font-size: 10px; color: var(--text2); }

.source-ts {
  font-size: 11px;
  color: var(--text3);
}

/* ── Health badges ── */
.health-badge {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid;
}

.health-ok {
  background: rgba(0,229,160,0.1);
  border-color: rgba(0,229,160,0.35);
  color: var(--green);
}
.health-warn {
  background: rgba(255,217,61,0.1);
  border-color: rgba(255,217,61,0.35);
  color: var(--warn);
}
.health-err {
  background: rgba(255,71,87,0.1);
  border-color: rgba(255,71,87,0.35);
  color: var(--red);
}

/* ── JSON block ── */
.json-empty {
  padding: 40px;
  text-align: center;
  font-size: 13px;
  color: var(--text3);
  font-family: var(--font-mono);
}

.json-block {
  margin: 0;
  padding: 16px;
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.7;
  color: var(--text2);
  overflow-y: auto;
  max-height: 400px;
  background: var(--bg);
  border-top: none;
  tab-size: 2;
  white-space: pre;
}

/* JSON highlight classes (injected via v-html) */
:deep(.j-key)  { color: var(--blue); }
:deep(.j-str)  { color: var(--warn); }
:deep(.j-num)  { color: var(--green); }
:deep(.j-bool) { color: var(--orange); }

/* ── Run button ── */
.btn-run {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 7px;
  font-size: 12px;
  font-family: var(--font-mono);
  font-weight: 600;
  cursor: pointer;
  border: 1px solid rgba(0,229,160,0.4);
  background: rgba(0,229,160,0.08);
  color: var(--accent);
  transition: all 0.15s;
}
.btn-run:hover:not(:disabled) {
  background: rgba(0,229,160,0.16);
  box-shadow: var(--glow-accent);
}
.btn-run:disabled { opacity: 0.45; cursor: not-allowed; }

.spin { display: inline-block; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Responsive ── */
@media (max-width: 900px) {
  .source-row {
    grid-template-columns: 130px 1fr 80px;
    gap: 8px;
  }
  .source-row > :nth-child(4),
  .source-row > :nth-child(5) { display: none; }
}

@media (max-width: 768px) {
  .content { padding: 12px; gap: 12px; }
  .stat-grid { grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .source-row { grid-template-columns: 1fr 1fr; padding: 10px 12px; }
  .source-row > :nth-child(2),
  .source-row > :nth-child(4),
  .source-row > :nth-child(5) { display: none; }
}
</style>
