<script setup>
import { computed } from 'vue'
import SignalBadge from '@/components/ui/SignalBadge.vue'
import { formatRupiah, formatPct, arrowPL } from '@/utils/formatters'

const props = defineProps({
  items:   { type: Array,  default: () => [] },
  summary: { type: Object, default: () => ({ total_modal: 0, total_nilai: 0, total_pl: 0, total_pl_pct: 0 }) },
})

const CURRENCY_META = {
  USD: { flag: '🇺🇸', name: 'US Dollar',    symbol: '$'  },
  SGD: { flag: '🇸🇬', name: 'Singapore $',  symbol: 'S$' },
  EUR: { flag: '🇪🇺', name: 'Euro',          symbol: '€'  },
  JPY: { flag: '🇯🇵', name: 'Japanese Yen', symbol: '¥'  },
}

function meta(code) {
  return CURRENCY_META[code] ?? { flag: '🏳️', name: code, symbol: '' }
}

function fmtQty(qty, code) {
  if (qty == null || isNaN(qty)) return '--'
  const { symbol } = meta(code)
  if (code === 'JPY') return `${symbol}${Math.round(qty).toLocaleString('id-ID')}`
  return `${symbol}${Number(qty).toFixed(2)}`
}

function fmtRate(rate) {
  if (rate == null || isNaN(rate)) return '--'
  return 'Rp' + Number(rate).toLocaleString('id-ID')
}

function rowCls(signal) {
  const s = signal?.toUpperCase()
  if (s === 'STOPLOSS')     return 'row-stoploss'
  if (s === 'SELL_PARTIAL') return 'row-sell-partial'
  if (s === 'BUY')          return 'row-buy'
  return ''
}

const hasItems = computed(() => props.items.length > 0)
const totalPL  = computed(() => props.summary?.total_pl ?? 0)
</script>

<template>
  <section class="valas-section">

    <!-- ── Header ── -->
    <div class="sec-header">
      <div class="title-group">
        <span class="sec-title">💱 Valas</span>
        <span class="count-badge">{{ items.length }} posisi</span>
      </div>
      <div v-if="hasItems" class="hdr-pl" :class="totalPL >= 0 ? 'clr-green' : 'clr-red'">
        {{ arrowPL(totalPL) }}
        <span class="mono">{{ formatRupiah(totalPL) }}</span>
        <span class="mono pct-sm">{{ formatPct(summary?.total_pl_pct) }}</span>
      </div>
    </div>

    <!-- ── Empty state ── -->
    <div v-if="!hasItems" class="empty-state">
      <span class="empty-icon">💱</span>
      <p class="empty-title">Belum ada posisi valas</p>
      <p class="empty-sub">Tambahkan via Settings → Valas</p>
    </div>

    <!-- ── Table ── -->
    <div v-else class="tbl-wrap">
      <table class="valas-tbl">
        <thead>
          <tr>
            <th class="col-left">Mata Uang</th>
            <th class="col-num">Qty Unit</th>
            <th class="col-num col-hide-mobile">Avg Beli</th>
            <th class="col-num">Kurs Saat Ini</th>
            <th class="col-num">Change</th>
            <th class="col-num">Nilai (IDR)</th>
            <th class="col-num">P&amp;L</th>
            <th class="col-ctr">Signal</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in items"
            :key="item.id ?? item.code"
            :class="['tbl-row', rowCls(item.signal)]"
          >
            <!-- Mata Uang -->
            <td>
              <div class="currency-cell">
                <span class="flag">{{ meta(item.code).flag }}</span>
                <div>
                  <div class="currency-code">{{ item.code }}</div>
                  <div class="currency-name">{{ meta(item.code).name }}</div>
                </div>
              </div>
            </td>
            <!-- Qty Unit -->
            <td class="td-num mono tabnum">{{ fmtQty(item.qty_unit, item.code) }}</td>
            <!-- Avg Beli -->
            <td class="td-num mono tabnum col-hide-mobile clr-text3">{{ fmtRate(item.avg_buy_rate) }}</td>
            <!-- Kurs Saat Ini -->
            <td class="td-num mono tabnum">{{ fmtRate(item.current_rate) }}</td>
            <!-- Change -->
            <td
              class="td-num mono tabnum"
              :class="(item.change_pct ?? 0) >= 0 ? 'clr-green' : 'clr-red'"
            >
              {{ (item.change_pct ?? 0) >= 0 ? '▲' : '▼' }} {{ Math.abs(item.change_pct ?? 0).toFixed(2) }}%
            </td>
            <!-- Nilai IDR -->
            <td class="td-num mono tabnum">{{ formatRupiah(item.nilai_pasar) }}</td>
            <!-- P&L -->
            <td class="td-num">
              <div :class="['pl-cell', (item.pl ?? 0) >= 0 ? 'clr-green' : 'clr-red']">
                <span class="mono tabnum">{{ formatRupiah(item.pl) }}</span>
                <span class="pl-pct-sm mono tabnum">{{ formatPct(item.pl_pct) }}</span>
              </div>
            </td>
            <!-- Signal -->
            <td class="td-ctr">
              <SignalBadge v-if="item.signal" :signal="item.signal" />
              <span v-else class="no-signal">—</span>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="foot-row">
            <td class="foot-label">Total Valas</td>
            <td></td>
            <td class="col-hide-mobile"></td>
            <td></td>
            <td></td>
            <td class="td-num mono tabnum foot-nilai">{{ formatRupiah(summary?.total_nilai) }}</td>
            <td class="td-num">
              <div :class="['pl-cell', totalPL >= 0 ? 'clr-green' : 'clr-red']">
                <span class="mono tabnum">{{ formatRupiah(totalPL) }}</span>
                <span class="pl-pct-sm mono tabnum">{{ formatPct(summary?.total_pl_pct) }}</span>
              </div>
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>

  </section>
</template>

<style scoped>
.valas-section {
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}

/* ── Header ── */
.sec-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
}
.title-group { display: flex; align-items: center; gap: 10px; }
.sec-title {
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
}
.count-badge {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text3);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 2px 8px;
}
.hdr-pl {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
}
.pct-sm { font-size: 11px; opacity: 0.8; }

/* ── Empty state ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  gap: 8px;
}
.empty-icon { font-size: 32px; line-height: 1; }
.empty-title {
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 600;
  color: var(--text2);
  margin: 0;
}
.empty-sub {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text3);
  margin: 0;
}

/* ── Table ── */
.tbl-wrap { overflow-x: auto; }
.valas-tbl { width: 100%; border-collapse: collapse; font-size: 13px; }

th {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--text3);
  background: var(--surface);
  padding: 10px 14px;
  white-space: nowrap;
  border-bottom: 1px solid var(--border);
}
.col-left { text-align: left; }
.col-num  { text-align: right; }
.col-ctr  { text-align: center; }

/* Body rows */
.tbl-row {
  border-bottom: 1px solid var(--border);
  transition: background 0.12s;
}
.tbl-row:last-child { border-bottom: none; }
.tbl-row:hover { background: rgba(255, 255, 255, 0.02); }

.row-stoploss     { background: rgba(255, 71, 87, 0.04); }
.row-sell-partial { background: rgba(255, 217, 61, 0.03); }
.row-buy          { background: rgba(0, 229, 160, 0.03); }
.row-stoploss:hover     { background: rgba(255, 71, 87, 0.07); }
.row-sell-partial:hover { background: rgba(255, 217, 61, 0.05); }
.row-buy:hover          { background: rgba(0, 229, 160, 0.05); }

td { padding: 12px 14px; color: var(--text); }

/* Currency cell */
.currency-cell { display: flex; align-items: center; gap: 10px; }
.flag { font-size: 20px; line-height: 1; flex-shrink: 0; }
.currency-code {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: 0.5px;
}
.currency-name {
  font-family: var(--font-ui);
  font-size: 10px;
  color: var(--text3);
  margin-top: 2px;
}

/* Number cells */
.td-num { text-align: right; white-space: nowrap; }
.td-ctr { text-align: center; }
.mono   { font-family: var(--font-mono); }
.tabnum { font-variant-numeric: tabular-nums; }

/* P&L cell (2 lines) */
.pl-cell { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.pl-pct-sm { font-size: 10px; opacity: 0.8; }
.no-signal { color: var(--text3); font-size: 12px; }

/* Footer */
.foot-row {
  border-top: 2px solid var(--border);
  background: var(--surface);
}
.foot-label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text2);
  padding: 10px 14px;
}
.foot-nilai { font-size: 13px; font-weight: 600; }

/* Color utilities */
.clr-green { color: var(--green); }
.clr-red   { color: var(--red); }
.clr-text3 { color: var(--text3); }

/* Responsive: hide Avg Beli column on mobile */
@media (max-width: 767px) {
  .col-hide-mobile { display: none; }
}
</style>
