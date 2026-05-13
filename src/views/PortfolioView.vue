<script setup>
import { computed, onMounted } from 'vue'
import { useReportStore } from '@/stores/report'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import StatCard from '@/components/ui/StatCard.vue'
import RoleBadge from '@/components/ui/RoleBadge.vue'
import SignalBadge from '@/components/ui/SignalBadge.vue'
import AssetTable from '@/components/portfolio/AssetTable.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { formatJuta, formatPct } from '@/utils/formatters'

const reportStore = useReportStore()

// ── Data ──────────────────────────────────────────────────────
const summary    = computed(() => reportStore.summary)
const report     = computed(() => reportStore.report)
const emasItems  = computed(() => report.value?.emas?.items ?? [])
const sahamItems = computed(() => report.value?.saham?.items ?? [])
const reksaItems = computed(() => report.value?.reksadana?.items ?? [])

const totalItems = computed(
  () => emasItems.value.length + sahamItems.value.length + reksaItems.value.length,
)

const sahamActiveSignals = computed(
  () => sahamItems.value.filter((i) => ['BUY', 'AVG_DOWN'].includes(i.signal?.toUpperCase())).length,
)

const isPLPositive = computed(() => (summary.value.total_pl ?? 0) >= 0)
const isFirstLoad  = computed(() => reportStore.loading && !report.value)

// ── Column definitions ─────────────────────────────────────────
const emasColumns = [
  { key: 'nama',         label: 'Nama Aset',    type: 'text',         align: 'left'   },
  { key: 'qty_gram',     label: 'Qty (gram)',   type: 'gram',         align: 'right'  },
  { key: 'avg_buy',      label: 'Avg Beli',     type: 'rupiah',       align: 'right'  },
  { key: 'market_price', label: 'Harga Pasar',  type: 'rupiah',       align: 'right'  },
  { key: 'nilai_pasar',  label: 'Nilai Pasar',  type: 'rupiah',       align: 'right'  },
  { key: 'pl',           label: 'P&L',          type: 'pl',           align: 'right'  },
  { key: 'signal',       label: 'Signal',       type: 'signal',       align: 'center' },
]

const sahamColumns = [
  { key: 'id',           label: 'Emiten',       type: 'emiten',       align: 'left'   },
  { key: 'qty_lot',      label: 'Lot',          type: 'lot',          align: 'right'  },
  { key: 'avg_buy',      label: 'Avg Buy',      type: 'rupiah',       align: 'right'  },
  { key: 'market_price', label: 'Harga Pasar',  type: 'price-change', align: 'right'  },
  { key: 'support',      label: 'S / R',        type: 'sr',           align: 'center' },
  { key: 'nilai_pasar',  label: 'Nilai',        type: 'rupiah',       align: 'right'  },
  { key: 'pl',           label: 'P&L',          type: 'pl',           align: 'right'  },
  { key: 'signal',       label: 'Signal',       type: 'signal',       align: 'center' },
]

const reksaColumns = [
  { key: 'nama',         label: 'Produk',        type: 'text',        align: 'left'   },
  { key: 'qty_unit',     label: 'Unit',          type: 'unit',        align: 'right'  },
  { key: 'avg_nab',      label: 'Avg NAB',       type: 'rupiah',      align: 'right'  },
  { key: 'current_nab',  label: 'NAB Saat Ini',  type: 'rupiah',      align: 'right'  },
  { key: 'nilai_pasar',  label: 'Nilai',         type: 'rupiah',      align: 'right'  },
  { key: 'pl',           label: 'P&L',           type: 'pl',          align: 'right'  },
  { key: 'signal',       label: 'Signal',        type: 'signal',      align: 'center' },
]

onMounted(() => reportStore.fetchReport())
</script>

<template>
  <div class="portfolio">
    <!-- Topbar -->
    <AppTopbar title="Portfolio" subtitle="Tabel semua aset &amp; P&L">
      <template #actions>
        <button
          class="btn-refresh"
          :disabled="reportStore.loading"
          @click="reportStore.fetchReport()"
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
          label="TOTAL MODAL"
          prefix="Rp"
          :value="formatJuta(summary.total_modal ?? 0) + ' Jt'"
          variant="default"
        />
        <StatCard
          label="NILAI PASAR"
          prefix="Rp"
          :value="formatJuta(summary.total_nilai ?? 0) + ' Jt'"
          variant="blue"
        />
        <StatCard
          label="TOTAL P&L"
          :prefix="isPLPositive ? '+Rp' : '-Rp'"
          :value="formatJuta(Math.abs(summary.total_pl ?? 0)) + ' Jt'"
          :change="formatPct(summary.total_pl_pct ?? 0)"
          change-label="all time"
          :is-positive="isPLPositive"
          :variant="isPLPositive ? 'accent' : 'danger'"
        />
        <StatCard
          label="JUMLAH ASET"
          :value="String(totalItems)"
          :change="`${emasItems.length} emas · ${sahamItems.length} saham · ${reksaItems.length} reksa`"
          variant="default"
        />
      </div>

      <!-- 2 ─ Emas section -->
      <AssetTable
        title="🥇 Emas"
        :data="emasItems"
        :columns="emasColumns"
        type="emas"
      >
        <template #badge>
          <RoleBadge role="analyst" />
        </template>
      </AssetTable>

      <!-- 3 ─ Saham section -->
      <AssetTable
        title="📈 Saham"
        :data="sahamItems"
        :columns="sahamColumns"
        type="saham"
      >
        <template #badge>
          <span v-if="sahamActiveSignals > 0" class="badge-signal">
            {{ sahamActiveSignals }} sinyal aktif
          </span>
          <span v-else class="badge-safe">Aman</span>
        </template>
      </AssetTable>

      <!-- 4 ─ Reksa Dana section -->
      <AssetTable
        title="🏦 Reksa Dana"
        :data="reksaItems"
        :columns="reksaColumns"
        type="reksa"
      >
        <template #badge>
          <span class="badge-dca">DCA Rutin</span>
        </template>
      </AssetTable>
    </div>
  </div>
</template>

<style scoped>
.portfolio {
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
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

/* ── Header badges ── */
.badge-signal,
.badge-safe,
.badge-dca {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid;
}

.badge-signal {
  background: rgba(255, 71, 87, 0.12);
  border-color: rgba(255, 71, 87, 0.35);
  color: var(--red);
}

.badge-safe {
  background: rgba(0, 229, 160, 0.08);
  border-color: rgba(0, 229, 160, 0.25);
  color: var(--green);
}

.badge-dca {
  background: rgba(255, 107, 53, 0.1);
  border-color: rgba(255, 107, 53, 0.3);
  color: var(--orange);
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
.btn-refresh:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}
.btn-refresh:disabled { opacity: 0.4; cursor: not-allowed; }

.spin { display: inline-block; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Responsive ── */
@media (max-width: 1100px) {
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .content { padding: 12px; gap: 12px; }
  .stat-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
}
</style>
