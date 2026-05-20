<script setup>
import { reactive, ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  type:       { type: String,  required: true,
                validator: (v) => ['emas', 'saham', 'reksa'].includes(v) },
  item:       { type: Object,  default: null },  // null = add mode
})

const emit = defineEmits(['update:modelValue', 'save'])

const isEdit  = computed(() => props.item !== null)
const typeLabel = computed(() => ({
  emas: 'Emas', saham: 'Saham', reksa: 'Reksa Dana',
}[props.type]))

// ── Form state ──
function emptyForm() {
  return {
    id: '', nama: '', catatan: '',
    // emas
    qty_gram: null, avg_buy_price: null,
    // saham
    ticker: '', qty_lot: null, support: null, resistance: null, stop_loss: null,
    // reksa
    qty_unit: null, avg_buy_nab: null, current_nab: null,
  }
}

const form   = reactive(emptyForm())
const errors = ref({})

// Populate when modal opens
watch(() => props.modelValue, (open) => {
  if (!open) return
  errors.value = {}
  Object.assign(form, emptyForm())
  if (props.item) Object.assign(form, props.item)
})

// Auto uppercase ID for saham + auto-fill ticker
watch(() => form.id, (val) => {
  if (props.type === 'saham') {
    const up = (val ?? '').toUpperCase()
    if (form.id !== up) form.id = up
    // only auto-fill ticker if it still matches the old pattern
    if (!form.ticker || form.ticker.endsWith('.JK')) {
      form.ticker = up ? up + '.JK' : ''
    }
  }
})

// ── Validation ──
function validate() {
  const e = {}
  if (!form.id?.trim())   e.id   = 'ID wajib diisi'
  if (!form.nama?.trim()) e.nama = 'Nama wajib diisi'

  if (props.type === 'emas') {
    if (!(form.qty_gram > 0))     e.qty_gram     = 'Harus > 0'
    if (!(form.avg_buy_price > 0)) e.avg_buy_price = 'Harus > 0'
  }
  if (props.type === 'saham') {
    if (!form.ticker?.trim())     e.ticker       = 'Ticker wajib diisi'
    if (!(form.qty_lot > 0))      e.qty_lot      = 'Harus > 0'
    if (!(form.avg_buy_price > 0)) e.avg_buy_price = 'Harus > 0'
    if (!(form.support > 0))      e.support      = 'Harus > 0'
    if (!(form.resistance > 0))   e.resistance   = 'Harus > 0'
    if (!(form.stop_loss > 0))    e.stop_loss    = 'Harus > 0'
  }
  if (props.type === 'reksa') {
    if (!(form.qty_unit > 0))     e.qty_unit     = 'Harus > 0'
    if (!(form.avg_buy_nab > 0))  e.avg_buy_nab  = 'Harus > 0'
  }

  errors.value = e
  return Object.keys(e).length === 0
}

function close() { emit('update:modelValue', false) }

function submit() {
  if (!validate()) return

  let data = {}
  if (props.type === 'emas') {
    data = { id: form.id.trim(), nama: form.nama.trim(),
             qty_gram: +form.qty_gram, avg_buy_price: +form.avg_buy_price,
             catatan: form.catatan.trim() }
  }
  if (props.type === 'saham') {
    data = { id: form.id.trim(), ticker: form.ticker.trim(), nama: form.nama.trim(),
             qty_lot: +form.qty_lot, avg_buy_price: +form.avg_buy_price,
             support: +form.support, resistance: +form.resistance,
             stop_loss: +form.stop_loss, catatan: form.catatan.trim() }
  }
  if (props.type === 'reksa') {
    data = { id: form.id.trim(), nama: form.nama.trim(),
             qty_unit: +form.qty_unit, avg_buy_nab: +form.avg_buy_nab,
             current_nab: form.current_nab ? +form.current_nab : +form.avg_buy_nab,
             catatan: form.catatan.trim() }
  }

  emit('save', data)
  close()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-backdrop" @click.self="close">
        <div class="modal">

          <div class="modal-header">
            <h2 class="modal-title">{{ isEdit ? '✏️ Edit' : '＋ Tambah' }} {{ typeLabel }}</h2>
            <button class="modal-close" @click="close">✕</button>
          </div>

          <div class="modal-body">
            <!-- ── ID & Nama (common) ── -->
            <div class="form-row-2">
              <div class="field">
                <label class="field-label">
                  ID <span class="field-hint">{{ type === 'saham' ? '(auto uppercase)' : '(unik)' }}</span>
                </label>
                <input
                  v-model="form.id"
                  class="field-input mono"
                  :class="{ err: errors.id }"
                  :placeholder="type === 'saham' ? 'BBCA' : type === 'emas' ? 'emas_antam' : 'SUCORINVEST_EQUITY'"
                  :readonly="isEdit"
                />
                <span v-if="errors.id" class="err-msg">{{ errors.id }}</span>
                <span v-if="isEdit" class="field-hint">ID tidak bisa diubah</span>
              </div>

              <div class="field">
                <label class="field-label">Nama</label>
                <input
                  v-model="form.nama"
                  class="field-input"
                  :class="{ err: errors.nama }"
                  placeholder="Nama lengkap aset"
                />
                <span v-if="errors.nama" class="err-msg">{{ errors.nama }}</span>
              </div>
            </div>

            <!-- ── EMAS fields ── -->
            <template v-if="type === 'emas'">
              <div class="form-row-2">
                <div class="field">
                  <label class="field-label">Qty (gram)</label>
                  <input v-model.number="form.qty_gram" type="number" min="0.01" step="0.01"
                    class="field-input mono" :class="{ err: errors.qty_gram }" placeholder="10" />
                  <span v-if="errors.qty_gram" class="err-msg">{{ errors.qty_gram }}</span>
                </div>
                <div class="field">
                  <label class="field-label">Avg Beli (Rp/gram)</label>
                  <input v-model.number="form.avg_buy_price" type="number" min="1"
                    class="field-input mono" :class="{ err: errors.avg_buy_price }" placeholder="1050000" />
                  <span v-if="errors.avg_buy_price" class="err-msg">{{ errors.avg_buy_price }}</span>
                </div>
              </div>
            </template>

            <!-- ── SAHAM fields ── -->
            <template v-else-if="type === 'saham'">
              <div class="field">
                <label class="field-label">Ticker <span class="field-hint">(auto dari ID)</span></label>
                <input v-model="form.ticker" class="field-input mono"
                  :class="{ err: errors.ticker }" placeholder="BBCA.JK" />
                <span v-if="errors.ticker" class="err-msg">{{ errors.ticker }}</span>
              </div>

              <div class="form-row-2">
                <div class="field">
                  <label class="field-label">Qty (lot)</label>
                  <input v-model.number="form.qty_lot" type="number" min="1"
                    class="field-input mono" :class="{ err: errors.qty_lot }" placeholder="50" />
                  <span v-if="errors.qty_lot" class="err-msg">{{ errors.qty_lot }}</span>
                </div>
                <div class="field">
                  <label class="field-label">Avg Buy (Rp/lembar)</label>
                  <input v-model.number="form.avg_buy_price" type="number" min="1"
                    class="field-input mono" :class="{ err: errors.avg_buy_price }" placeholder="6100" />
                  <span v-if="errors.avg_buy_price" class="err-msg">{{ errors.avg_buy_price }}</span>
                </div>
              </div>

              <div class="form-row-3">
                <div class="field">
                  <label class="field-label">Support (Rp)</label>
                  <input v-model.number="form.support" type="number" min="1"
                    class="field-input mono" :class="{ err: errors.support }" placeholder="5800" />
                  <span v-if="errors.support" class="err-msg">{{ errors.support }}</span>
                </div>
                <div class="field">
                  <label class="field-label">Resistance (Rp)</label>
                  <input v-model.number="form.resistance" type="number" min="1"
                    class="field-input mono" :class="{ err: errors.resistance }" placeholder="6500" />
                  <span v-if="errors.resistance" class="err-msg">{{ errors.resistance }}</span>
                </div>
                <div class="field">
                  <label class="field-label">Stop Loss (Rp)</label>
                  <input v-model.number="form.stop_loss" type="number" min="1"
                    class="field-input mono" :class="{ err: errors.stop_loss }" placeholder="5500" />
                  <span v-if="errors.stop_loss" class="err-msg">{{ errors.stop_loss }}</span>
                </div>
              </div>
            </template>

            <!-- ── REKSA fields ── -->
            <template v-else-if="type === 'reksa'">
              <div class="form-row-2">
                <div class="field">
                  <label class="field-label">Qty (unit)</label>
                  <input v-model.number="form.qty_unit" type="number" min="1"
                    class="field-input mono" :class="{ err: errors.qty_unit }" placeholder="12450" />
                  <span v-if="errors.qty_unit" class="err-msg">{{ errors.qty_unit }}</span>
                </div>
                <div class="field">
                  <label class="field-label">Avg NAB (Rp/unit)</label>
                  <input v-model.number="form.avg_buy_nab" type="number" min="1"
                    class="field-input mono" :class="{ err: errors.avg_buy_nab }" placeholder="2340" />
                  <span v-if="errors.avg_buy_nab" class="err-msg">{{ errors.avg_buy_nab }}</span>
                </div>
              </div>
              <div class="field">
                <label class="field-label">NAB Saat Ini (Rp)</label>
                <input
                  v-model.number="form.current_nab"
                  type="number"
                  min="1"
                  class="field-input mono"
                  :placeholder="form.avg_buy_nab ? String(form.avg_buy_nab) : '2340'"
                />
                <span class="field-hint nab-hint">Update setiap hari setelah jam 16:30 WIB</span>
              </div>
            </template>

            <!-- ── Catatan (common) ── -->
            <div class="field">
              <label class="field-label">Catatan <span class="field-hint">(opsional)</span></label>
              <input v-model="form.catatan" class="field-input" placeholder="Catatan tambahan..." />
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="close">Batal</button>
            <button class="btn-save" @click="submit">
              {{ isEdit ? '💾 Simpan Perubahan' : '➕ Tambahkan' }}
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
}
.modal {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 12px;
  width: 100%; max-width: 520px; max-height: 90vh;
  overflow-y: auto;
  display: flex; flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid var(--border);
}
.modal-title { font-size: 15px; font-weight: 700; color: var(--text); }
.modal-close {
  background: none; border: none; color: var(--text3); font-size: 14px;
  cursor: pointer; padding: 4px 8px; border-radius: 4px; transition: color 0.15s;
}
.modal-close:hover { color: var(--text); }

.modal-body { padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; }

.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }

.field { display: flex; flex-direction: column; gap: 4px; }
.field-label {
  font-family: var(--font-mono);
  font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text3);
}
.field-hint { font-size: 9px; color: var(--text3); text-transform: none; letter-spacing: 0; }
.field-input {
  background: var(--surface); border: 1px solid var(--border); border-radius: 7px;
  color: var(--text); font-size: 13px; padding: 9px 12px; outline: none;
  transition: border-color 0.15s; width: 100%;
}
.field-input:focus { border-color: var(--accent); }
.field-input.err   { border-color: var(--danger); }
.field-input:read-only { opacity: 0.5; cursor: not-allowed; }
.mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
.err-msg { font-size: 10px; color: var(--red); font-family: var(--font-mono); }
.nab-hint { display: block; font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.5px; color: var(--blue); margin-top: 2px; }

.modal-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 14px 20px; border-top: 1px solid var(--border);
}
.btn-cancel {
  padding: 9px 18px; background: transparent; border: 1px solid var(--border);
  border-radius: 7px; color: var(--text2); font-size: 13px; cursor: pointer;
  transition: all 0.15s;
}
.btn-cancel:hover { border-color: var(--text2); color: var(--text); }
.btn-save {
  padding: 9px 20px; background: rgba(0,229,160,0.1); border: 1px solid rgba(0,229,160,0.4);
  border-radius: 7px; color: var(--accent); font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.15s;
}
.btn-save:hover { background: rgba(0,229,160,0.18); box-shadow: var(--glow-accent); }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-active .modal, .modal-leave-active .modal { transition: transform 0.2s ease, opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal, .modal-leave-to .modal { transform: translateY(16px); opacity: 0; }

@media (max-width: 768px) {
  .modal-backdrop {
    align-items: flex-end;
    padding: 0;
  }
  .modal {
    max-width: 100%;
    border-radius: 16px 16px 0 0;
    max-height: 90vh;
  }
  .form-row-2 { grid-template-columns: 1fr; }
  .form-row-3 { grid-template-columns: 1fr; }
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: translateY(16px);
  opacity: 0;
}

@media (max-width: 768px) {
  .modal-enter-from .modal,
  .modal-leave-to .modal {
    transform: translateY(100%);
    opacity: 1;
  }
}
</style>
