<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { formatRupiah, formatPct } from '@/utils/formatters'

const props = defineProps({
  editItem:   { type: Object, default: null },
  valasRates: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['close', 'save'])

const CURRENCY_OPTIONS = [
  { code: 'USD', flag: '🇺🇸', label: 'USD — US Dollar'        },
  { code: 'SGD', flag: '🇸🇬', label: 'SGD — Singapore Dollar' },
  { code: 'EUR', flag: '🇪🇺', label: 'EUR — Euro'              },
  { code: 'JPY', flag: '🇯🇵', label: 'JPY — Japanese Yen'     },
]

const isEdit = computed(() => props.editItem !== null)

function emptyForm() {
  return { id: '', code: '', nama: '', qty_unit: null, avg_buy_rate: null, catatan: '' }
}

const form   = reactive(emptyForm())
const errors = ref({})

watch(
  () => props.editItem,
  (item) => {
    errors.value = {}
    Object.assign(form, emptyForm())
    if (item) Object.assign(form, item)
  },
  { immediate: true },
)

// Auto-generate ID when code changes in add mode
watch(() => form.code, (code) => {
  if (isEdit.value || !code) return
  const ts = String(Date.now()).slice(-4)
  form.id = `${code.toLowerCase()}_${ts}`
})

const liveRate    = computed(() => props.valasRates[form.code] ?? null)
const qtyStep     = computed(() => form.code === 'JPY' ? 100 : 0.01)
const qtyPlaceholder = computed(() => form.code === 'JPY' ? '100000' : '100.00')
const selectedOpt = computed(() => CURRENCY_OPTIONS.find(c => c.code === form.code))

// P&L preview
const showPreview = computed(() => form.qty_unit > 0 && form.avg_buy_rate > 0)
const previewModal = computed(() =>
  showPreview.value ? form.qty_unit * form.avg_buy_rate : null,
)
const previewNilai = computed(() =>
  showPreview.value && liveRate.value?.rate ? form.qty_unit * liveRate.value.rate : null,
)
const previewPL = computed(() =>
  previewModal.value != null && previewNilai.value != null
    ? previewNilai.value - previewModal.value
    : null,
)
const previewPLPct = computed(() =>
  previewPL.value != null && previewModal.value
    ? (previewPL.value / previewModal.value) * 100
    : null,
)

// Validation (live — drives disabled state)
const isValid = computed(() =>
  !!form.code &&
  !!form.nama?.trim() &&
  form.qty_unit > 0 &&
  form.avg_buy_rate > 0,
)

function validate() {
  const e = {}
  if (!form.code)               e.code         = 'Pilih mata uang'
  if (!form.nama?.trim())       e.nama         = 'Nama wajib diisi'
  if (!(form.qty_unit > 0))     e.qty_unit     = 'Harus > 0'
  if (!(form.avg_buy_rate > 0)) e.avg_buy_rate = 'Harus > 0'
  errors.value = e
  return Object.keys(e).length === 0
}

function submit() {
  if (!validate()) return
  emit('save', {
    id:           form.id || `${form.code.toLowerCase()}_${String(Date.now()).slice(-4)}`,
    code:         form.code,
    nama:         form.nama.trim(),
    qty_unit:     +form.qty_unit,
    avg_buy_rate: +form.avg_buy_rate,
    catatan:      form.catatan?.trim() ?? '',
  })
}
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="emit('close')">
      <div class="modal">

        <!-- ── Header ── -->
        <div class="modal-header">
          <h2 class="modal-title">
            {{ isEdit ? '✏️ Edit Posisi Valas' : '💱 Tambah Posisi Valas' }}
          </h2>
          <button class="modal-close" @click="emit('close')">✕</button>
        </div>

        <div class="modal-body">

          <!-- ── Live Rate Banner ── -->
          <div v-if="liveRate" class="rate-banner">
            <span class="banner-flag">{{ selectedOpt?.flag }}</span>
            <span class="banner-pair mono">{{ form.code }}/IDR</span>
            <span class="banner-rate mono">Rp{{ Number(liveRate.rate).toLocaleString('id-ID') }}</span>
            <span
              class="banner-change mono"
              :class="(liveRate.change_pct ?? 0) >= 0 ? 'clr-green' : 'clr-red'"
            >
              {{ (liveRate.change_pct ?? 0) >= 0 ? '▲' : '▼' }} {{ Math.abs(liveRate.change_pct ?? 0).toFixed(2) }}%
            </span>
          </div>

          <!-- ── Mata Uang ── -->
          <div class="field">
            <label class="field-label">Mata Uang</label>
            <select
              v-model="form.code"
              class="field-input mono"
              :class="{ err: errors.code }"
              :disabled="isEdit"
            >
              <option value="" disabled>-- Pilih mata uang --</option>
              <option v-for="opt in CURRENCY_OPTIONS" :key="opt.code" :value="opt.code">
                {{ opt.flag }} {{ opt.label }}
              </option>
            </select>
            <span v-if="errors.code" class="err-msg">{{ errors.code }}</span>
            <span v-if="isEdit" class="field-hint">Mata uang tidak bisa diubah</span>
          </div>

          <!-- ── Label / Nama ── -->
          <div class="field">
            <label class="field-label">Label / Nama</label>
            <input
              v-model="form.nama"
              class="field-input"
              :class="{ err: errors.nama }"
              placeholder="cth: USD Tabungan BCA"
            />
            <span v-if="errors.nama" class="err-msg">{{ errors.nama }}</span>
          </div>

          <!-- ── Qty + Avg Rate ── -->
          <div class="form-row-2">
            <div class="field">
              <label class="field-label">Jumlah / Qty</label>
              <input
                v-model.number="form.qty_unit"
                type="number"
                :step="qtyStep"
                min="0"
                class="field-input mono"
                :class="{ err: errors.qty_unit }"
                :placeholder="qtyPlaceholder"
              />
              <span v-if="errors.qty_unit" class="err-msg">{{ errors.qty_unit }}</span>
            </div>
            <div class="field">
              <label class="field-label">Kurs Rata-rata Beli (Rp)</label>
              <input
                v-model.number="form.avg_buy_rate"
                type="number"
                step="1"
                min="0"
                class="field-input mono"
                :class="{ err: errors.avg_buy_rate }"
                placeholder="16000"
              />
              <span v-if="errors.avg_buy_rate" class="err-msg">{{ errors.avg_buy_rate }}</span>
              <span v-if="liveRate" class="field-hint hint-rate mono">
                Kurs saat ini: Rp{{ Number(liveRate.rate).toLocaleString('id-ID') }}
              </span>
            </div>
          </div>

          <!-- ── P&L Preview ── -->
          <div v-if="showPreview" class="pl-preview">
            <div class="preview-title mono">Est. P&amp;L Preview</div>
            <div class="preview-row">
              <span class="preview-label">Modal</span>
              <span class="preview-val mono">{{ formatRupiah(previewModal) }}</span>
            </div>
            <template v-if="previewPL !== null">
              <div class="preview-row">
                <span class="preview-label">Estimasi Nilai</span>
                <span class="preview-val mono">{{ formatRupiah(previewNilai) }}</span>
              </div>
              <div class="preview-divider"></div>
              <div class="preview-row preview-pl">
                <span class="preview-label">Est. P&amp;L</span>
                <span
                  class="preview-val mono preview-pl-val"
                  :class="previewPL >= 0 ? 'clr-green' : 'clr-red'"
                >
                  {{ formatRupiah(previewPL) }}
                  <span class="preview-pct">{{ formatPct(previewPLPct) }}</span>
                </span>
              </div>
            </template>
            <div v-else class="preview-row">
              <span class="preview-label">Estimasi Nilai</span>
              <span class="preview-val mono clr-text3">Kurs tidak tersedia</span>
            </div>
          </div>

          <!-- ── Catatan ── -->
          <div class="field">
            <label class="field-label">Catatan <span class="field-hint">(opsional)</span></label>
            <input
              v-model="form.catatan"
              class="field-input"
              placeholder="Catatan tambahan..."
            />
          </div>

        </div>

        <!-- ── Footer ── -->
        <div class="modal-footer">
          <button class="btn-cancel" @click="emit('close')">Batal</button>
          <button class="btn-save" :disabled="!isValid" @click="submit">
            {{ isEdit ? '💾 Simpan Perubahan' : '➕ Tambahkan' }}
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<style scoped>
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
  animation: fade-in 0.18s ease both;
}
.modal {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 12px;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: modal-in 0.2s ease both;
}

@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes modal-in {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
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
.modal-title { font-size: 15px; font-weight: 700; color: var(--text); margin: 0; }
.modal-close {
  background: none;
  border: none;
  color: var(--text3);
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: color 0.15s;
  line-height: 1;
}
.modal-close:hover { color: var(--text); }

/* ── Body ── */
.modal-body { padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; }

/* ── Live Rate Banner ── */
.rate-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(0, 132, 255, 0.06);
  border: 1px solid rgba(0, 132, 255, 0.2);
  border-radius: 8px;
}
.banner-flag   { font-size: 18px; line-height: 1; }
.banner-pair   { font-size: 11px; letter-spacing: 1px; color: var(--text2); }
.banner-rate   { font-size: 14px; font-weight: 700; color: var(--blue); margin-left: auto; }
.banner-change { font-size: 11px; font-weight: 600; }

/* ── Form rows ── */
.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

/* ── Field ── */
.field { display: flex; flex-direction: column; gap: 4px; }
.field-label {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--text3);
}
.field-hint {
  font-size: 9px;
  color: var(--text3);
  text-transform: none;
  letter-spacing: 0;
}
.field-input {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 7px;
  color: var(--text);
  font-size: 13px;
  padding: 9px 12px;
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
  box-sizing: border-box;
  appearance: none;
}
.field-input:focus   { border-color: var(--accent); }
.field-input.err     { border-color: var(--danger); }
.field-input:disabled { opacity: 0.5; cursor: not-allowed; }
.mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }

.err-msg  { font-size: 10px; color: var(--red); font-family: var(--font-mono); }
.hint-rate {
  font-size: 9px;
  letter-spacing: 0.5px;
  color: var(--blue);
  margin-top: 2px;
}

/* ── P&L Preview ── */
.pl-preview {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.preview-title {
  font-size: 9px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--text3);
  margin-bottom: 2px;
}
.preview-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.preview-label {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text2);
}
.preview-val {
  font-family: var(--font-mono);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 6px;
}
.preview-pct { font-size: 10px; opacity: 0.8; }
.preview-pl-val { font-weight: 600; }
.preview-divider {
  height: 1px;
  background: var(--border);
  margin: 2px 0;
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
  font-family: var(--font-ui);
}
.btn-cancel:hover { border-color: var(--text2); color: var(--text); }
.btn-save {
  padding: 9px 20px;
  background: rgba(0, 229, 160, 0.1);
  border: 1px solid rgba(0, 229, 160, 0.4);
  border-radius: 7px;
  color: var(--accent);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  font-family: var(--font-ui);
}
.btn-save:hover:not(:disabled) { background: rgba(0, 229, 160, 0.18); box-shadow: var(--glow-accent); }
.btn-save:disabled { opacity: 0.35; cursor: not-allowed; }

/* Color utilities */
.clr-green { color: var(--green); }
.clr-red   { color: var(--red); }
.clr-text3 { color: var(--text3); }

/* Responsive */
@media (max-width: 768px) {
  .modal-backdrop { align-items: flex-end; padding: 0; }
  .modal { max-width: 100%; border-radius: 16px 16px 0 0; max-height: 92vh; }
  .form-row-2 { grid-template-columns: 1fr; }
  @keyframes modal-in {
    from { opacity: 0; transform: translateY(100%); }
    to   { opacity: 1; transform: translateY(0); }
  }
}
</style>
