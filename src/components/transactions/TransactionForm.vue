<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useTransactionsStore } from '@/stores/transactions'
import { usePortfolioStore } from '@/stores/portfolio'
import { useToast } from '@/composables/useToast'
import { formatRupiah, formatRupiahCompact } from '@/utils/formatters'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  prefill:    { type: Object,  default: null },
})

const emit = defineEmits(['update:modelValue', 'submitted'])

const txStore        = useTransactionsStore()
const portfolioStore = usePortfolioStore()
const { showToast }  = useToast()

// ── Form state ──
const jenisAset  = ref('saham')
const aksi       = ref('BUY')
const kode       = ref('')
const namaAset   = ref('')
const qty        = ref(1)
const harga      = ref(0)
const catatan    = ref('')
const errors     = ref({})
const submitting = ref(false)

// Suppress jenis_aset watch during programmatic population to avoid clearing prefill values
const suppressJenisWatch = ref(false)

// ── Derived ──
const qtyLabel = computed(() => {
  const map = { saham: 'LOT', reksa: 'UNIT', emas: 'GRAM', valas: 'UNIT' }
  return map[jenisAset.value] ?? 'QTY'
})

const total = computed(() => {
  const q = Number(qty.value) || 0
  const p = Number(harga.value) || 0
  return jenisAset.value === 'saham' ? q * 100 * p : q * p
})

// ── Kode options from portfolio ──
const kodeOptions = computed(() => {
  const p = portfolioStore.portfolio
  if (!p) return []
  if (jenisAset.value === 'saham') {
    return p.saham?.map(s => ({ value: s.id, label: `${s.id} — ${s.nama}`, nama: s.nama })) ?? []
  }
  if (jenisAset.value === 'reksa') {
    return p.reksadana?.map(r => ({ value: r.id, label: `${r.id} — ${r.nama}`, nama: r.nama })) ?? []
  }
  if (jenisAset.value === 'emas') {
    return p.emas?.map(e => ({ value: e.id, label: `${e.id} — ${e.nama}`, nama: e.nama })) ?? []
  }
  if (jenisAset.value === 'valas') {
    return p.valas?.map(v => ({ value: v.code, label: `${v.code} — ${v.nama}`, nama: v.nama })) ?? []
  }
  return []
})

// Auto-fill nama when kode is selected from dropdown
watch(kode, (newKode) => {
  const match = kodeOptions.value.find(o => o.value === newKode)
  if (match) namaAset.value = match.nama
})

// Reset kode & nama when jenis_aset changes (skipped during programmatic populate)
watch(jenisAset, () => {
  if (suppressJenisWatch.value) return
  kode.value = ''
  namaAset.value = ''
})

// ── Form populate / reset ──
function populateFromPrefill(pf) {
  if (!pf) return
  suppressJenisWatch.value = true
  jenisAset.value = pf.aset      ?? 'saham'
  aksi.value      = pf.aksi      ?? 'BUY'
  kode.value      = pf.kode      ?? ''
  namaAset.value  = pf.nama      ?? ''
  harga.value     = pf.harga     ?? 0
  qty.value       = pf.qty_saran ?? 1
  catatan.value   = ''
  errors.value    = {}
  nextTick(() => { suppressJenisWatch.value = false })
}

function resetForm() {
  jenisAset.value = 'saham'
  aksi.value      = 'BUY'
  kode.value      = ''
  namaAset.value  = ''
  qty.value       = 1
  harga.value     = 0
  catatan.value   = ''
  errors.value    = {}
}

// When modal opens, populate or reset; also ensure portfolio is loaded
watch(() => props.modelValue, (open) => {
  if (open) {
    if (!portfolioStore.portfolio) portfolioStore.fetchPortfolio()
    props.prefill ? populateFromPrefill(props.prefill) : resetForm()
  }
})

// ── Keyboard close ──
function onKeydown(e) { if (e.key === 'Escape') close() }
onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  if (!portfolioStore.portfolio) portfolioStore.fetchPortfolio()
})
onUnmounted(() => document.removeEventListener('keydown', onKeydown))

// ── Close ──
function close() { emit('update:modelValue', false) }

// ── Validate ──
function validate() {
  const e = {}
  if (!kode.value.trim())        e.kode  = 'Kode wajib diisi'
  if (Number(qty.value) <= 0)    e.qty   = 'Qty harus > 0'
  if (Number(harga.value) <= 0)  e.harga = 'Harga harus > 0'
  errors.value = e
  return Object.keys(e).length === 0
}

// ── Submit ──
async function submit() {
  if (!validate()) return
  submitting.value = true
  const data = {
    jenis_aset: jenisAset.value,
    aksi:       aksi.value,
    kode:       kode.value.trim().toUpperCase(),
    nama:       namaAset.value.trim(),
    qty:        Number(qty.value),
    harga:      Number(harga.value),
    total:      total.value,
    catatan:    catatan.value.trim(),
  }
  const result = await txStore.addTransaction(data)
  submitting.value = false
  if (result.ok) {
    showToast('Transaksi berhasil disimpan', 'success')
    emit('submitted', data)
    close()
  } else {
    showToast(result.message ?? 'Gagal menyimpan transaksi', 'error')
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-backdrop" @click.self="close">
        <div class="modal" role="dialog" aria-modal="true">

          <!-- Header -->
          <div class="modal-header">
            <div class="modal-title-wrap">
              <span class="modal-icon">⊞</span>
              <h2 class="modal-title">Input Transaksi</h2>
            </div>
            <button class="modal-close" @click="close">✕</button>
          </div>

          <!-- Analyst suggestion banner (when pre-filled) -->
          <div v-if="prefill" class="analyst-box">
            <div class="analyst-label">💡 Saran dari Analyst</div>
            <div class="analyst-grid">
              <div class="ag-row">
                <span class="ag-key">Aset</span>
                <span class="ag-val mono">{{ prefill.kode }} — {{ prefill.nama }}</span>
              </div>
              <div class="ag-row">
                <span class="ag-key">Harga saat ini</span>
                <span class="ag-val mono">{{ formatRupiah(prefill.harga) }}</span>
              </div>
              <div class="ag-row">
                <span class="ag-key">Dana tersedia (10%)</span>
                <span class="ag-val mono">
                  ~{{ formatRupiahCompact(prefill.dana_tersedia ?? 0) }}
                </span>
              </div>
              <div class="ag-row">
                <span class="ag-key">Saran lot</span>
                <span class="ag-val ag-highlight mono">{{ prefill.qty_saran }} lot</span>
              </div>
            </div>
          </div>

          <!-- Form body -->
          <div class="modal-body">
            <div class="form-row-2">
              <!-- Jenis Aset -->
              <div class="field">
                <label class="field-label">Jenis Aset</label>
                <select v-model="jenisAset" class="field-select">
                  <option value="saham">Saham</option>
                  <option value="emas">Emas</option>
                  <option value="reksa">Reksa Dana</option>
                  <option value="valas">Valas</option>
                </select>
              </div>

              <!-- Aksi -->
              <div class="field">
                <label class="field-label">Aksi</label>
                <select v-model="aksi" class="field-select">
                  <option value="BUY">Beli</option>
                  <option value="SELL">Jual</option>
                </select>
              </div>
            </div>

            <!-- Kode -->
            <div class="field">
              <label class="field-label">
                {{ jenisAset === 'saham' ? 'Kode Saham' : jenisAset === 'emas' ? 'Jenis Emas' : jenisAset === 'valas' ? 'Kode Valas' : 'Kode Reksa Dana' }}
              </label>
              <template v-if="kodeOptions.length > 0">
                <select
                  v-model="kode"
                  class="field-select mono"
                  :class="{ 'input-error': errors.kode }"
                >
                  <option value="" disabled>Pilih kode...</option>
                  <option v-for="opt in kodeOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </template>
              <template v-else>
                <input
                  v-model="kode"
                  class="field-input mono"
                  :placeholder="jenisAset === 'saham' ? 'BBCA' : jenisAset === 'emas' ? 'ANTAM' : jenisAset === 'valas' ? 'USD' : 'SUCORINVEST_EQUITY'"
                  :class="{ 'input-error': errors.kode }"
                />
              </template>
              <span v-if="errors.kode" class="error-msg">{{ errors.kode }}</span>
            </div>

            <!-- Nama (optional) -->
            <div class="field">
              <label class="field-label">Nama Lengkap <span class="optional">(opsional)</span></label>
              <input
                v-model="namaAset"
                class="field-input"
                placeholder="Bank Central Asia"
              />
            </div>

            <div class="form-row-2">
              <!-- Qty -->
              <div class="field">
                <label class="field-label">Qty ({{ qtyLabel }})</label>
                <input
                  v-model.number="qty"
                  type="number"
                  min="1"
                  class="field-input mono"
                  :class="{ 'input-error': errors.qty }"
                  placeholder="1"
                />
                <span v-if="errors.qty" class="error-msg">{{ errors.qty }}</span>
              </div>

              <!-- Harga -->
              <div class="field">
                <label class="field-label">
                  Harga <span class="field-unit">(per {{ qtyLabel === 'LOT' ? 'lembar' : qtyLabel.toLowerCase() }})</span>
                </label>
                <input
                  v-model.number="harga"
                  type="number"
                  min="0"
                  class="field-input mono"
                  :class="{ 'input-error': errors.harga }"
                  placeholder="0"
                />
                <span v-if="errors.harga" class="error-msg">{{ errors.harga }}</span>
              </div>
            </div>

            <!-- Catatan -->
            <div class="field">
              <label class="field-label">Catatan <span class="optional">(opsional)</span></label>
              <input v-model="catatan" class="field-input" placeholder="Eksekusi sinyal BUY dari Analyst" />
            </div>

            <!-- Total preview -->
            <div class="total-preview">
              <div class="total-label">
                Total Transaksi
                <span v-if="jenisAset === 'saham'" class="total-calc">
                  ({{ qty || 0 }} lot × 100 lembar × {{ formatRupiah(harga || 0) }})
                </span>
              </div>
              <div class="total-value">{{ formatRupiah(total) }}</div>
            </div>
          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <button class="btn-cancel" @click="close">Batal</button>
            <button
              class="btn-submit"
              :disabled="submitting"
              @click="submit"
            >
              <span v-if="submitting" class="spin">⟳</span>
              <span v-else>{{ aksi === 'BUY' ? '✅ Konfirmasi Beli' : '🔴 Konfirmasi Jual' }}</span>
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── Backdrop ── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

/* ── Modal box ── */
.modal {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

/* ── Header ── */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.modal-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-icon {
  font-size: 18px;
  color: var(--accent);
}

.modal-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
}

.modal-close {
  background: none;
  border: none;
  color: var(--text3);
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: color 0.15s;
}
.modal-close:hover { color: var(--text); }

/* ── Analyst suggestion box ── */
.analyst-box {
  margin: 0;
  padding: 14px 20px;
  background: rgba(0, 229, 160, 0.05);
  border-bottom: 1px solid rgba(0, 229, 160, 0.15);
}

.analyst-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

.analyst-grid { display: flex; flex-direction: column; gap: 5px; }

.ag-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 12px;
}

.ag-key {
  min-width: 120px;
  color: var(--text3);
  font-size: 11px;
  flex-shrink: 0;
}

.ag-val { color: var(--text); }

.ag-highlight {
  color: var(--accent);
  font-weight: 700;
  font-size: 14px;
}

/* ── Form ── */
.modal-body {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 1.5px;
  color: var(--text3);
  text-transform: uppercase;
}

.field-unit { text-transform: none; letter-spacing: 0; }

.optional {
  font-family: var(--font-ui);
  text-transform: none;
  letter-spacing: 0;
  color: var(--text3);
  font-size: 10px;
}

.field-input,
.field-select {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 7px;
  color: var(--text);
  font-size: 13px;
  padding: 9px 12px;
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
  appearance: auto;
}

.field-input:focus,
.field-select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(0, 229, 160, 0.15);
}

.field-input.input-error,
.field-select.input-error { border-color: var(--danger); }

.mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }

.error-msg {
  font-size: 10px;
  color: var(--red);
  font-family: var(--font-mono);
}

/* ── Total preview ── */
.total-preview {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.total-label {
  font-size: 11px;
  color: var(--text3);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.total-calc {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--text3);
}

.total-value {
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 700;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* ── Footer ── */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.btn-cancel {
  padding: 9px 18px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 7px;
  color: var(--text2);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-cancel:hover { border-color: var(--text2); color: var(--text); }

.btn-submit {
  padding: 9px 20px;
  background: rgba(0, 229, 160, 0.12);
  border: 1px solid rgba(0, 229, 160, 0.4);
  border-radius: 7px;
  color: var(--accent);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  min-width: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.btn-submit:hover:not(:disabled) { background: rgba(0, 229, 160, 0.2); box-shadow: var(--glow-accent); }
.btn-submit:disabled { opacity: 0.4; cursor: not-allowed; }

.spin { display: inline-block; animation: spin 0.8s linear infinite; font-size: 16px; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Transition ── */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: translateY(16px);
  opacity: 0;
}

@media (max-width: 768px) {
  .modal-backdrop { align-items: flex-end; padding: 0; }
  .modal { max-width: 100%; border-radius: 16px 16px 0 0; max-height: 90vh; }
  .form-row-2 { grid-template-columns: 1fr; }
  .btn-cancel, .btn-submit { min-height: 44px; }
  .modal-enter-from .modal, .modal-leave-to .modal { transform: translateY(100%); opacity: 1; }
}
</style>
