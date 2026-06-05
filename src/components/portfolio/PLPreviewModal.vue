<script setup>
import { ref, computed } from 'vue'
import { usePortfolioStore } from '@/stores/portfolio'
import { useToast } from '@/composables/useToast'
import { formatRupiah, formatJuta } from '@/utils/formatters'

const props = defineProps({
  modelValue:         { type: Boolean, default: false },
  after:              { type: Object,  default: null },   // localPortfolio to save
  originalPortfolio:  { type: Object,  default: null },   // snapshot before edits
})

const emit = defineEmits(['update:modelValue', 'saved'])

const portfolioStore = usePortfolioStore()
const { showToast }  = useToast()

function close() { emit('update:modelValue', false) }

// ── Change detection ──
function detectChanges(beforeList, afterList) {
  const bList = beforeList ?? []
  const aList = afterList  ?? []
  return {
    added:   aList.filter(a  => !bList.find(b => b.id === a.id)),
    deleted: bList.filter(b  => !aList.find(a => a.id === b.id)),
    edited:  aList.filter(a  => {
      const b = bList.find(b => b.id === a.id)
      return b && JSON.stringify(a) !== JSON.stringify(b)
    }),
  }
}

const before = computed(() => props.originalPortfolio ?? portfolioStore.originalPortfolio)

const emasChanges  = computed(() => detectChanges(before.value?.emas,      props.after?.emas))
const sahamChanges = computed(() => detectChanges(before.value?.saham,     props.after?.saham))
const reksaChanges = computed(() => detectChanges(before.value?.reksadana, props.after?.reksadana))
const valasChanges = computed(() => detectChanges(before.value?.valas,     props.after?.valas))

const allChanges = computed(() => [
  ...emasChanges.value.added.map(i    => ({ label: i.nama ?? i.id,    type: 'add',    cat: 'Emas'  })),
  ...emasChanges.value.deleted.map(i  => ({ label: i.nama ?? i.id,    type: 'delete', cat: 'Emas'  })),
  ...emasChanges.value.edited.map(i   => ({ label: i.nama ?? i.id,    type: 'edit',   cat: 'Emas'  })),
  ...sahamChanges.value.added.map(i   => ({ label: i.id,               type: 'add',    cat: 'Saham' })),
  ...sahamChanges.value.deleted.map(i => ({ label: i.id,               type: 'delete', cat: 'Saham' })),
  ...sahamChanges.value.edited.map(i  => ({ label: i.id,               type: 'edit',   cat: 'Saham' })),
  ...reksaChanges.value.added.map(i   => ({ label: i.nama ?? i.id,    type: 'add',    cat: 'Reksa' })),
  ...reksaChanges.value.deleted.map(i => ({ label: i.nama ?? i.id,    type: 'delete', cat: 'Reksa' })),
  ...reksaChanges.value.edited.map(i  => ({ label: i.nama ?? i.id,    type: 'edit',   cat: 'Reksa' })),
  ...valasChanges.value.added.map(i   => ({ label: i.code ?? i.id,    type: 'add',    cat: 'Valas' })),
  ...valasChanges.value.deleted.map(i => ({ label: i.code ?? i.id,    type: 'delete', cat: 'Valas' })),
  ...valasChanges.value.edited.map(i  => ({ label: i.code ?? i.id,    type: 'edit',   cat: 'Valas' })),
])

const hasChanges = computed(() => allChanges.value.length > 0)

// ── Comparison metrics ──
function calcModal(p) {
  if (!p) return { emas: 0, saham: 0, reksa: 0, total: 0 }
  const e = (p.emas       ?? []).reduce((s, i) => s + (i.qty_gram ?? 0) * (i.avg_buy_price ?? 0), 0)
  const s = (p.saham      ?? []).reduce((s, i) => s + (i.qty_lot ?? 0) * 100 * (i.avg_buy_price ?? 0), 0)
  const r = (p.reksadana  ?? []).reduce((s, i) => s + (i.qty_unit ?? 0) * (i.avg_buy_nab ?? 0), 0)
  return { emas: e, saham: s, reksa: r, total: e + s + r }
}

function countItems(p) {
  return {
    emas:  (p?.emas ?? []).length,
    saham: (p?.saham ?? []).length,
    reksa: (p?.reksadana ?? []).length,
    valas: (p?.valas ?? []).length,
    total: ((p?.emas?.length ?? 0) + (p?.saham?.length ?? 0) + (p?.reksadana?.length ?? 0) + (p?.valas?.length ?? 0)),
  }
}

const beforeMetrics = computed(() => ({ modal: calcModal(before.value), count: countItems(before.value) }))
const afterMetrics  = computed(() => ({ modal: calcModal(props.after),  count: countItems(props.after) }))

const modalValasBefore = computed(() =>
  (before.value?.valas ?? []).reduce((s, i) => s + (i.qty_unit ?? 0) * (i.avg_buy_rate ?? 0), 0),
)
const modalValasAfter = computed(() =>
  (props.after?.valas ?? []).reduce((s, i) => s + (i.qty_unit ?? 0) * (i.avg_buy_rate ?? 0), 0),
)

function diffClass(after, bef) {
  if (after > bef) return 'diff-pos'
  if (after < bef) return 'diff-neg'
  return ''
}

// ── Save ──
const savePhase = ref('')  // '' | 'saving' | 'pipeline'

async function confirmSave() {
  savePhase.value = 'saving'
  const result = await portfolioStore.savePortfolio(props.after)
  if (result.ok) {
    savePhase.value = 'pipeline'
    showToast('✅ Portfolio disimpan & analisis diperbarui!', 'success')
    emit('saved')
    // Brief pause so phase-2 label is visible before close
    await new Promise(r => setTimeout(r, 600))
    close()
    savePhase.value = ''
  } else {
    savePhase.value = ''
    showToast(result.message ?? 'Gagal menyimpan', 'error')
  }
}

const CHANGE_LABELS = { add: 'TAMBAH', edit: 'UBAH', delete: 'HAPUS' }
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-backdrop" @click.self="close">
        <div class="modal">

          <div class="modal-header">
            <h2 class="modal-title">👁 Preview Perubahan</h2>
            <button class="modal-close" @click="close">✕</button>
          </div>

          <div class="modal-body">

            <!-- Change badges -->
            <div v-if="hasChanges" class="changes-section">
              <div class="changes-label">Perubahan yang akan disimpan</div>
              <div class="change-list">
                <span
                  v-for="(ch, i) in allChanges"
                  :key="i"
                  :class="['change-badge', `badge-${ch.type}`]"
                >
                  {{ CHANGE_LABELS[ch.type] }}: {{ ch.label }}
                </span>
              </div>
            </div>

            <div v-else class="no-changes">
              <span>⚠️ Tidak ada perubahan terdeteksi</span>
            </div>

            <!-- Comparison table -->
            <div class="compare-section">
              <div class="compare-label">Perbandingan Data</div>
              <table class="compare-table">
                <thead>
                  <tr>
                    <th class="th-metric">Metrik</th>
                    <th class="th-val">Sebelum</th>
                    <th class="th-val">Sesudah</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- Modal totals -->
                  <tr>
                    <td class="td-metric">Total Modal</td>
                    <td class="td-val mono">{{ formatJuta(beforeMetrics.modal.total) }} Jt</td>
                    <td :class="['td-val mono', diffClass(afterMetrics.modal.total, beforeMetrics.modal.total)]">
                      {{ formatJuta(afterMetrics.modal.total) }} Jt
                    </td>
                  </tr>
                  <tr>
                    <td class="td-metric">Modal Emas</td>
                    <td class="td-val mono">{{ formatJuta(beforeMetrics.modal.emas) }} Jt</td>
                    <td :class="['td-val mono', diffClass(afterMetrics.modal.emas, beforeMetrics.modal.emas)]">
                      {{ formatJuta(afterMetrics.modal.emas) }} Jt
                    </td>
                  </tr>
                  <tr>
                    <td class="td-metric">Modal Saham</td>
                    <td class="td-val mono">{{ formatJuta(beforeMetrics.modal.saham) }} Jt</td>
                    <td :class="['td-val mono', diffClass(afterMetrics.modal.saham, beforeMetrics.modal.saham)]">
                      {{ formatJuta(afterMetrics.modal.saham) }} Jt
                    </td>
                  </tr>
                  <tr>
                    <td class="td-metric">Modal Reksa</td>
                    <td class="td-val mono">{{ formatJuta(beforeMetrics.modal.reksa) }} Jt</td>
                    <td :class="['td-val mono', diffClass(afterMetrics.modal.reksa, beforeMetrics.modal.reksa)]">
                      {{ formatJuta(afterMetrics.modal.reksa) }} Jt
                    </td>
                  </tr>
                  <tr>
                    <td class="td-metric">Modal Valas</td>
                    <td class="td-val mono">{{ formatJuta(modalValasBefore) }} Jt</td>
                    <td :class="['td-val mono', diffClass(modalValasAfter, modalValasBefore)]">
                      {{ formatJuta(modalValasAfter) }} Jt
                    </td>
                  </tr>

                  <!-- Item counts -->
                  <tr class="tr-sep"><td colspan="3" /></tr>
                  <tr>
                    <td class="td-metric">Jumlah Emas</td>
                    <td class="td-val">{{ beforeMetrics.count.emas }} item</td>
                    <td :class="['td-val', diffClass(afterMetrics.count.emas, beforeMetrics.count.emas)]">
                      {{ afterMetrics.count.emas }} item
                    </td>
                  </tr>
                  <tr>
                    <td class="td-metric">Jumlah Saham</td>
                    <td class="td-val">{{ beforeMetrics.count.saham }} item</td>
                    <td :class="['td-val', diffClass(afterMetrics.count.saham, beforeMetrics.count.saham)]">
                      {{ afterMetrics.count.saham }} item
                    </td>
                  </tr>
                  <tr>
                    <td class="td-metric">Jumlah Reksa</td>
                    <td class="td-val">{{ beforeMetrics.count.reksa }} item</td>
                    <td :class="['td-val', diffClass(afterMetrics.count.reksa, beforeMetrics.count.reksa)]">
                      {{ afterMetrics.count.reksa }} item
                    </td>
                  </tr>
                  <tr>
                    <td class="td-metric">Jumlah Valas</td>
                    <td class="td-val">{{ beforeMetrics.count.valas }} item</td>
                    <td :class="['td-val', diffClass(afterMetrics.count.valas, beforeMetrics.count.valas)]">
                      {{ afterMetrics.count.valas }} item
                    </td>
                  </tr>
                  <tr>
                    <td class="td-metric td-total">Total Aset</td>
                    <td class="td-val td-total">{{ beforeMetrics.count.total }} item</td>
                    <td :class="['td-val td-total', diffClass(afterMetrics.count.total, beforeMetrics.count.total)]">
                      {{ afterMetrics.count.total }} item
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

          <div class="modal-footer">
            <button class="btn-back" @click="close">← Kembali Edit</button>
            <button
              class="btn-confirm"
              :disabled="savePhase !== ''"
              @click="confirmSave"
            >
              <span v-if="savePhase === 'saving'"><span class="spin">⟳</span> Menyimpan portfolio...</span>
              <span v-else-if="savePhase === 'pipeline'">⚙️ Mengupdate analisis...</span>
              <span v-else>✅ Konfirmasi &amp; Simpan</span>
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px); z-index: 1000;
  display: flex; align-items: center; justify-content: center; padding: 16px;
}
.modal {
  background: var(--bg2); border: 1px solid var(--border); border-radius: 12px;
  width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto;
  display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
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

.modal-body { padding: 18px 20px; display: flex; flex-direction: column; gap: 18px; }

/* Changes section */
.changes-section { display: flex; flex-direction: column; gap: 8px; }
.changes-label, .compare-label {
  font-family: var(--font-mono); font-size: 9px; letter-spacing: 1.5px;
  text-transform: uppercase; color: var(--text3);
}

.change-list { display: flex; flex-wrap: wrap; gap: 6px; }

.change-badge {
  font-family: var(--font-mono); font-size: 10px; font-weight: 700;
  padding: 3px 8px; border-radius: 4px; border: 1px solid;
}
.badge-add    { background: rgba(0,229,160,0.1);  border-color: rgba(0,229,160,0.3); color: var(--green);  }
.badge-edit   { background: rgba(0,132,255,0.1);  border-color: rgba(0,132,255,0.3); color: var(--blue);   }
.badge-delete { background: rgba(255,71,87,0.1);  border-color: rgba(255,71,87,0.3); color: var(--red);    }

.no-changes {
  font-size: 13px; color: var(--text3); padding: 8px;
  background: var(--surface); border-radius: 8px; text-align: center;
}

/* Compare table */
.compare-section { display: flex; flex-direction: column; gap: 8px; }
.compare-table { width: 100%; border-collapse: collapse; font-size: 12px; }

.th-metric, .th-val {
  font-family: var(--font-mono); font-size: 9px; letter-spacing: 1px;
  text-transform: uppercase; color: var(--text3);
  padding: 6px 10px; text-align: left; border-bottom: 1px solid var(--border);
}
.th-val { text-align: right; }

.td-metric {
  padding: 8px 10px; color: var(--text2); font-size: 12px;
  border-bottom: 1px solid rgba(35,45,66,0.4);
}
.td-val {
  padding: 8px 10px; text-align: right; color: var(--text);
  border-bottom: 1px solid rgba(35,45,66,0.4);
}
.mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }

.diff-pos { color: var(--green) !important; }
.diff-neg { color: var(--red)   !important; }

.tr-sep td { height: 4px; background: var(--surface); }

.td-total { font-weight: 700; color: var(--text) !important; }

/* Footer */
.modal-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 14px 20px; border-top: 1px solid var(--border);
}
.btn-back {
  padding: 9px 18px; background: transparent; border: 1px solid var(--border);
  border-radius: 7px; color: var(--text2); font-size: 13px; cursor: pointer; transition: all 0.15s;
}
.btn-back:hover { border-color: var(--text2); color: var(--text); }
.btn-confirm {
  padding: 9px 20px; min-width: 180px;
  background: rgba(0,229,160,0.1); border: 1px solid rgba(0,229,160,0.4);
  border-radius: 7px; color: var(--accent); font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 6px;
}
.btn-confirm:hover:not(:disabled) { background: rgba(0,229,160,0.18); box-shadow: var(--glow-accent); }
.btn-confirm:disabled { opacity: 0.4; cursor: not-allowed; }
.spin { display: inline-block; animation: spin 0.8s linear infinite; font-size: 16px; }
@keyframes spin { to { transform: rotate(360deg); } }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-active .modal, .modal-leave-active .modal { transition: transform 0.25s ease, opacity 0.25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal, .modal-leave-to .modal { transform: translateY(16px); opacity: 0; }

@media (max-width: 768px) {
  .modal-backdrop { align-items: flex-end; padding: 0; }
  .modal { max-width: 100%; border-radius: 16px 16px 0 0; max-height: 90vh; }
  .compare-table { font-size: 11px; }
  .modal-enter-from .modal, .modal-leave-to .modal { transform: translateY(100%); opacity: 1; }
}
</style>
