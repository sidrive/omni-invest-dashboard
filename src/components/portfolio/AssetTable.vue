<script setup>
import SignalBadge from '@/components/ui/SignalBadge.vue'
import PriceSparkline from '@/components/charts/PriceSparkline.vue'
import { formatRupiah, formatPct, formatUnit } from '@/utils/formatters'

defineProps({
  title:   { type: String,  required: true },
  data:    { type: Array,   default: () => [] },
  columns: { type: Array,   default: () => [] },
  type:    { type: String,  default: 'emas',
             validator: (v) => ['emas', 'saham', 'reksa'].includes(v) },
})

function rowClass(row) {
  const s = row.signal?.toUpperCase()
  if (s === 'AVG_DOWN') return 'row-avg-down'
  if (s === 'SELL')     return 'row-sell'
  if (s === 'STOPLOSS') return 'row-stoploss'
  return ''
}
</script>

<template>
  <section class="asset-section">
    <!-- Header -->
    <div class="section-header">
      <div class="header-left">
        <h2 class="section-title">{{ title }}</h2>
        <slot name="badge" />
      </div>
      <span class="section-count">{{ data.length }} item</span>
    </div>

    <!-- Empty state -->
    <div v-if="!data.length" class="empty-state">
      Tidak ada data
    </div>

    <!-- Desktop table -->
    <div v-else class="table-scroll">
      <table class="asset-table">
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              :class="['th', `align-${col.align ?? 'left'}`]"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in data"
            :key="row.id"
            :class="['tr', rowClass(row)]"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              :class="['td', `align-${col.align ?? 'left'}`]"
            >
              <!-- Plain text -->
              <template v-if="col.type === 'text'">
                <span class="cell-text">{{ row[col.key] }}</span>
              </template>

              <!-- Rupiah -->
              <template v-else-if="col.type === 'rupiah'">
                <span class="cell-mono">{{ formatRupiah(row[col.key]) }}</span>
              </template>

              <!-- Grams -->
              <template v-else-if="col.type === 'gram'">
                <span class="cell-mono">{{ row[col.key] }}g</span>
              </template>

              <!-- Lots -->
              <template v-else-if="col.type === 'lot'">
                <span class="cell-mono">{{ row[col.key] }} lot</span>
              </template>

              <!-- Units -->
              <template v-else-if="col.type === 'unit'">
                <span class="cell-mono">{{ formatUnit(row[col.key]) }}</span>
              </template>

              <!-- P&L — two lines: Rp amount + percentage -->
              <template v-else-if="col.type === 'pl'">
                <div class="cell-pl">
                  <span :class="['pl-rp', (row.pl ?? 0) >= 0 ? 'pos' : 'neg']">
                    {{ (row.pl ?? 0) >= 0 ? '+' : '' }}{{ formatRupiah(row.pl ?? 0) }}
                  </span>
                  <span :class="['pl-pct', (row.pl_pct ?? 0) >= 0 ? 'pos' : 'neg']">
                    {{ formatPct(row.pl_pct ?? 0) }}
                  </span>
                </div>
              </template>

              <!-- Signal badge — native title attr for tooltip -->
              <template v-else-if="col.type === 'signal'">
                <div
                  class="signal-wrap"
                  :title="row.signal_reason || undefined"
                >
                  <SignalBadge :signal="row.signal ?? 'HOLD'" />
                </div>
              </template>

              <!-- Emiten: ticker (bold mono) + full name -->
              <template v-else-if="col.type === 'emiten'">
                <div class="cell-emiten">
                  <span class="emiten-ticker">{{ row.id }}</span>
                  <span class="emiten-nama">{{ row.nama }}</span>
                </div>
              </template>

              <!-- Price + change_pct + sparkline -->
              <template v-else-if="col.type === 'price-change'">
                <div class="cell-price-chg">
                  <PriceSparkline :change-pct="row.change_pct ?? 0" :width="48" :height="20" />
                  <span class="cell-mono">{{ formatRupiah(row.market_price) }}</span>
                  <span :class="['chg-line', (row.change_pct ?? 0) >= 0 ? 'pos' : 'neg']">
                    {{ (row.change_pct ?? 0) >= 0 ? '▲' : '▼' }}
                    {{ formatPct(row.change_pct ?? 0) }}
                  </span>
                </div>
              </template>

              <!-- S/R levels — two compact lines -->
              <template v-else-if="col.type === 'sr'">
                <div class="cell-sr">
                  <div class="sr-line">
                    <span class="sr-lbl">S</span>
                    <span class="sr-val">{{ formatRupiah(row.support) }}</span>
                  </div>
                  <div class="sr-line">
                    <span class="sr-lbl">R</span>
                    <span class="sr-val">{{ formatRupiah(row.resistance) }}</span>
                  </div>
                </div>
              </template>

              <!-- Fallback -->
              <template v-else>
                <span class="cell-mono">{{ row[col.key] ?? '--' }}</span>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile card list (hidden on desktop) -->
    <div v-if="data.length" class="mobile-cards">
      <div
        v-for="row in data"
        :key="'m-' + row.id"
        :class="['m-card', rowClass(row)]"
      >
        <!-- Row 1: name + signal -->
        <div class="m-row1">
          <div class="m-name">
            <template v-if="type === 'saham'">
              <span class="m-ticker">{{ row.id }}</span>
              <span class="m-subname">{{ row.nama }}</span>
            </template>
            <template v-else>
              <span class="m-text">{{ row.nama ?? row.id }}</span>
            </template>
          </div>
          <div :title="row.signal_reason || undefined">
            <SignalBadge :signal="row.signal ?? 'HOLD'" />
          </div>
        </div>

        <!-- Row 2: qty / prices -->
        <div class="m-row2">
          <template v-if="type === 'emas'">
            <span class="m-chip mono">{{ row.qty_gram }}g</span>
            <span class="m-sep">·</span>
            <span class="m-chip mono">Beli {{ formatRupiah(row.avg_buy) }}</span>
            <span class="m-sep">·</span>
            <span class="m-chip mono">Pasar {{ formatRupiah(row.market_price) }}</span>
          </template>
          <template v-else-if="type === 'saham'">
            <span class="m-chip mono">{{ row.qty_lot }} lot</span>
            <span class="m-sep">·</span>
            <span class="m-chip mono">{{ formatRupiah(row.avg_buy) }}</span>
            <span class="m-sep">·</span>
            <span class="m-chip mono">{{ formatRupiah(row.market_price) }}</span>
            <span :class="['m-chip mono', (row.change_pct ?? 0) >= 0 ? 'pos' : 'neg']">
              {{ (row.change_pct ?? 0) >= 0 ? '▲' : '▼' }}{{ formatPct(row.change_pct ?? 0) }}
            </span>
          </template>
          <template v-else-if="type === 'reksa'">
            <span class="m-chip mono">{{ formatUnit(row.qty_unit) }} unit</span>
            <span class="m-sep">·</span>
            <span class="m-chip mono">NAB {{ formatRupiah(row.current_nab) }}</span>
          </template>
        </div>

        <!-- Row 3: P&L -->
        <div class="m-row3">
          <span :class="['m-pl mono', (row.pl ?? 0) >= 0 ? 'pos' : 'neg']">
            {{ (row.pl ?? 0) >= 0 ? '+' : '' }}{{ formatRupiah(row.pl ?? 0) }}
          </span>
          <span :class="['m-plpct mono', (row.pl_pct ?? 0) >= 0 ? 'pos' : 'neg']">
            {{ formatPct(row.pl_pct ?? 0) }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ── Section wrapper ── */
.asset-section {
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}

/* ── Header ── */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
}

.section-count {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text3);
}

/* ── Empty ── */
.empty-state {
  padding: 32px;
  text-align: center;
  color: var(--text3);
  font-size: 13px;
}

/* ── Table scroll container ── */
.table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* ── Table ── */
.asset-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

/* Head */
.th {
  padding: 10px 14px;
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--text3);
  white-space: nowrap;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

/* Body */
.td {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(35, 45, 66, 0.5);
  vertical-align: middle;
  white-space: nowrap;
}

.tr:last-child .td { border-bottom: none; }

.tr:hover .td { background: rgba(255, 255, 255, 0.015); }

/* Row signal backgrounds */
.row-avg-down .td { background: rgba(255, 71, 87, 0.04); }
.row-sell .td     { background: rgba(0, 229, 160, 0.03); }
.row-stoploss .td { background: rgba(255, 71, 87, 0.08); }

/* Alignment helpers */
.align-left   { text-align: left; }
.align-right  { text-align: right; }
.align-center { text-align: center; }

/* ── Cell types ── */
.cell-text { color: var(--text); font-size: 12px; }

.cell-mono {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  color: var(--text);
}

/* P&L */
.cell-pl {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}
.pl-rp {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.pl-pct {
  font-family: var(--font-mono);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}
.pos { color: var(--green); }
.neg { color: var(--red); }

/* Signal */
.signal-wrap { cursor: default; display: inline-block; }

/* Emiten */
.cell-emiten {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.emiten-ticker {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  color: var(--blue);
  letter-spacing: 0.5px;
}
.emiten-nama {
  font-size: 10px;
  color: var(--text2);
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Price + change */
.cell-price-chg {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}
.chg-line {
  font-family: var(--font-mono);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

/* S/R */
.cell-sr {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sr-line {
  display: flex;
  align-items: center;
  gap: 5px;
}
.sr-lbl {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  color: var(--text3);
  letter-spacing: 0.5px;
  min-width: 10px;
}
.sr-val {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text2);
  font-variant-numeric: tabular-nums;
}

/* ── Mobile card list ── */
.mobile-cards { display: none; }

@media (max-width: 768px) {
  /* Hide desktop table, show cards */
  .table-scroll  { display: none; }
  .mobile-cards  { display: flex; flex-direction: column; }

  .m-card {
    padding: 12px 14px;
    border-bottom: 1px solid rgba(35,45,66,0.5);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .m-card:last-child { border-bottom: none; }

  /* Signal row tints carried over */
  .row-avg-down { background: rgba(255,71,87,0.04); }
  .row-sell     { background: rgba(0,229,160,0.03); }
  .row-stoploss { background: rgba(255,71,87,0.08); }

  /* Row 1: name + signal */
  .m-row1 {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .m-name { display: flex; flex-direction: column; gap: 1px; min-width: 0; }

  .m-ticker {
    font-family: var(--font-mono);
    font-size: 14px;
    font-weight: 700;
    color: var(--blue);
    letter-spacing: 0.5px;
  }
  .m-subname {
    font-size: 11px;
    color: var(--text3);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .m-text {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
  }

  /* Row 2: meta chips */
  .m-row2 {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    font-size: 11px;
  }

  .m-chip {
    font-variant-numeric: tabular-nums;
    color: var(--text2);
  }
  .m-sep { color: var(--text3); }

  /* Row 3: P&L */
  .m-row3 {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .m-pl {
    font-size: 13px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .m-plpct {
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }

  .pos { color: var(--green); }
  .neg { color: var(--red); }
}
</style>
