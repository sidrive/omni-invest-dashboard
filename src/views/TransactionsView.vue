<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTransactionsStore } from '@/stores/transactions'
import { useReportStore } from '@/stores/report'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import TransactionForm from '@/components/transactions/TransactionForm.vue'
import { formatRupiah } from '@/utils/formatters'

const txStore     = useTransactionsStore()
const reportStore = useReportStore()

const showModal = ref(false)

const transactions = computed(() => txStore.transactions)
const isFirstLoad  = computed(() => txStore.loading && !transactions.value.length)

// ── Formatters ────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

const JENIS_LABEL = {
  saham:     'Saham',
  emas:      'Emas',
  reksadana: 'Reksa',
}

// Saham: qty (lot) × 100 lembar × harga; others: qty × harga
function calcTotal(tx) {
  const q = tx.qty   ?? 0
  const p = tx.harga ?? 0
  return tx.jenis_aset === 'saham' ? q * 100 * p : q * p
}

function qtyLabel(tx) {
  const q = tx.qty ?? 0
  if (tx.jenis_aset === 'saham')     return `${q} lot`
  if (tx.jenis_aset === 'emas')      return `${q} gram`
  if (tx.jenis_aset === 'reksadana') return `${q.toLocaleString('id-ID')} unit`
  return String(q)
}

// ── After modal submitted ─────────────────────────────────────
async function onSubmitted() {
  showModal.value = false
  await txStore.fetchTransactions()
}

onMounted(async () => {
  await txStore.fetchTransactions()
  if (!reportStore.report) reportStore.fetchReport()
})
</script>

<template>
  <div class="transactions">
    <AppTopbar title="Transactions" subtitle="Input &amp; riwayat transaksi">
      <template #actions>
        <button class="btn-new" @click="showModal = true">
          ＋ Transaksi Baru
        </button>
      </template>
    </AppTopbar>

    <div v-if="isFirstLoad" class="spinner-wrap">
      <LoadingSpinner size="lg" />
    </div>

    <div v-else class="content">

      <!-- ── Summary strip ── -->
      <div class="summary-strip">
        <div class="strip-item">
          <span class="strip-label">Total Transaksi</span>
          <span class="strip-val mono">{{ transactions.length }}</span>
        </div>
        <div class="strip-sep" />
        <div class="strip-item">
          <span class="strip-label">Pembelian</span>
          <span class="strip-val mono pos">
            {{ transactions.filter(t => t.aksi === 'BUY').length }}×
          </span>
        </div>
        <div class="strip-sep" />
        <div class="strip-item">
          <span class="strip-label">Penjualan</span>
          <span class="strip-val mono neg">
            {{ transactions.filter(t => t.aksi === 'SELL').length }}×
          </span>
        </div>
      </div>

      <!-- ── Empty state ── -->
      <div v-if="transactions.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-title">Belum Ada Transaksi</div>
        <div class="empty-sub">Klik "+ Transaksi Baru" untuk mencatat pembelian atau penjualan aset</div>
        <button class="btn-new-lg" @click="showModal = true">＋ Tambah Transaksi Pertama</button>
      </div>

      <!-- ── Table ── -->
      <div v-else class="table-wrap">
        <table class="tx-table">
          <thead>
            <tr>
              <th class="th th-date">Tanggal</th>
              <th class="th th-asset">Aset</th>
              <th class="th th-action">Aksi</th>
              <th class="th th-num">Qty</th>
              <th class="th th-num">Harga</th>
              <th class="th th-num">Total</th>
              <th class="th th-note">Catatan</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(tx, i) in transactions"
              :key="tx.id ?? i"
              :class="['tx-row', `row-${tx.aksi?.toLowerCase()}`]"
            >
              <td class="td td-date mono">{{ formatDate(tx.timestamp) }}</td>

              <td class="td td-asset">
                <span class="asset-code mono">{{ tx.kode }}</span>
                <span class="asset-type">{{ JENIS_LABEL[tx.jenis_aset] ?? tx.jenis_aset }}</span>
              </td>

              <td class="td td-action">
                <span :class="['aksi-badge', tx.aksi === 'BUY' ? 'badge-buy' : 'badge-sell']">
                  {{ tx.aksi === 'BUY' ? 'BELI' : 'JUAL' }}
                </span>
              </td>

              <td class="td td-num mono">{{ qtyLabel(tx) }}</td>
              <td class="td td-num mono">{{ formatRupiah(tx.harga) }}</td>
              <td class="td td-num mono td-total">{{ formatRupiah(calcTotal(tx)) }}</td>

              <td class="td td-note">
                <span v-if="tx.catatan" class="note-text">{{ tx.catatan }}</span>
                <span v-else class="note-empty">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div><!-- /content -->

    <!-- ── TransactionForm modal ── -->
    <TransactionForm
      v-model="showModal"
      :prefill="null"
      @submitted="onSubmitted"
    />
  </div>
</template>

<style scoped>
.transactions {
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

/* ── Summary strip ── */
.summary-strip {
  display: flex;
  align-items: center;
  gap: 0;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 20px;
}

.strip-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.strip-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text3);
}

.strip-val {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
}
.strip-val.pos { color: var(--green); }
.strip-val.neg { color: var(--red); }

.strip-sep {
  width: 1px;
  height: 28px;
  background: var(--border);
  margin: 0 20px;
}

/* ── Empty state ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 64px 24px;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 10px;
  text-align: center;
}

.empty-icon  { font-size: 48px; line-height: 1; }
.empty-title { font-size: 16px; font-weight: 700; color: var(--text); }
.empty-sub   { font-size: 13px; color: var(--text2); max-width: 320px; line-height: 1.5; }

.btn-new-lg {
  margin-top: 8px;
  padding: 10px 24px;
  background: rgba(0,229,160,0.1);
  border: 1px solid rgba(0,229,160,0.35);
  border-radius: 8px;
  color: var(--accent);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-new-lg:hover { background: rgba(0,229,160,0.18); box-shadow: var(--glow-accent); }

/* ── Table ── */
.table-wrap {
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}

.tx-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.th {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: var(--text3);
  padding: 10px 14px;
  text-align: left;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.th-num  { text-align: right; }
.th-date { min-width: 110px; }
.th-note { min-width: 140px; }

.tx-row {
  border-bottom: 1px solid rgba(35,45,66,0.5);
  transition: background 0.1s;
}
.tx-row:last-child { border-bottom: none; }
.tx-row:hover      { background: rgba(255,255,255,0.02); }

/* Subtle row tint by action */
.row-buy  { border-left: 2px solid rgba(0,229,160,0.3); }
.row-sell { border-left: 2px solid rgba(255,71,87,0.3); }

.td {
  padding: 11px 14px;
  color: var(--text2);
  vertical-align: middle;
}

.td-date { font-size: 11px; color: var(--text3); white-space: nowrap; }

.td-asset {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.asset-code {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: 0.3px;
}

.asset-type {
  font-size: 10px;
  color: var(--text3);
}

.td-action { white-space: nowrap; }

.aksi-badge {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 3px 9px;
  border-radius: 4px;
  border: 1px solid;
}

.badge-buy {
  background: rgba(0,229,160,0.1);
  border-color: rgba(0,229,160,0.35);
  color: var(--green);
  box-shadow: 0 0 6px rgba(0,229,160,0.15);
}
.badge-sell {
  background: rgba(255,71,87,0.1);
  border-color: rgba(255,71,87,0.35);
  color: var(--red);
  box-shadow: 0 0 6px rgba(255,71,87,0.15);
}

.td-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--text);
}

.td-total {
  font-weight: 700;
  color: var(--text);
}

.note-text {
  font-size: 11px;
  color: var(--text3);
  font-style: italic;
}
.note-empty { color: var(--border); }

/* ── Topbar new button ── */
.btn-new {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 7px 16px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid rgba(0,229,160,0.4);
  background: rgba(0,229,160,0.08);
  color: var(--accent);
  transition: all 0.15s;
}
.btn-new:hover { background: rgba(0,229,160,0.16); box-shadow: var(--glow-accent); }

/* ── Responsive ── */
@media (max-width: 900px) {
  .th-note, .td:last-child { display: none; }
}

@media (max-width: 768px) {
  .content { padding: 12px; gap: 12px; }
  .summary-strip { flex-wrap: wrap; gap: 12px; }
  .strip-sep { display: none; }
  .th-date, .td-date { display: none; }
}
</style>
