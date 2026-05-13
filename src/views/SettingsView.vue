<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { usePortfolioStore } from '@/stores/portfolio'
import { useToast } from '@/composables/useToast'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import AssetFormModal from '@/components/portfolio/AssetFormModal.vue'
import PLPreviewModal from '@/components/portfolio/PLPreviewModal.vue'
import { formatRupiah, formatJuta } from '@/utils/formatters'

const portfolioStore = usePortfolioStore()
const { showToast } = useToast()

// ── Tabs ──────────────────────────────────────────────────────
const TABS = [
  { key: 'emas',   label: '🥇 Emas' },
  { key: 'saham',  label: '📈 Saham' },
  { key: 'reksa',  label: '🏦 Reksa Dana' },
  { key: 'target', label: '⚖️ Target Alokasi' },
]
const activeTab = ref('emas')

// ── Local state (never mutate store directly) ─────────────────
const localEmas   = ref([])
const localSaham  = ref([])
const localReksa  = ref([])
const localTarget = ref({ emas: 20, saham: 60, reksa: 20 })

function populateLocal() {
  const p = portfolioStore.portfolio
  if (!p) return
  localEmas.value   = JSON.parse(JSON.stringify(p.emas      ?? []))
  localSaham.value  = JSON.parse(JSON.stringify(p.saham     ?? []))
  localReksa.value  = JSON.parse(JSON.stringify(p.reksadana ?? []))
  localTarget.value = JSON.parse(JSON.stringify(
    p.target_alokasi ?? { emas: 20, saham: 60, reksa: 20 }
  ))
}

onMounted(async () => {
  if (!portfolioStore.portfolio) await portfolioStore.fetchPortfolio()
  populateLocal()
})

watch(() => portfolioStore.portfolio, () => {
  if (!portfolioStore.hasChanges) populateLocal()
})

// ── localPortfolio for PLPreviewModal ─────────────────────────
const localPortfolio = computed(() => ({
  emas:           localEmas.value,
  saham:          localSaham.value,
  reksadana:      localReksa.value,
  target_alokasi: localTarget.value,
}))

// ── Target allocation ─────────────────────────────────────────
const targetTotal = computed(() =>
  (localTarget.value.emas  ?? 0) +
  (localTarget.value.saham ?? 0) +
  (localTarget.value.reksa ?? 0)
)
const targetValid = computed(() => targetTotal.value === 100)

function onTargetChange() {
  portfolioStore.markChanged()
}

// ── Asset Form Modal ──────────────────────────────────────────
const showAssetForm = ref(false)
const assetFormType = ref('emas')
const editingItem   = ref(null)

function openAdd(type) {
  assetFormType.value = type
  editingItem.value   = null
  showAssetForm.value = true
}

function openEdit(type, item) {
  assetFormType.value = type
  editingItem.value   = item
  showAssetForm.value = true
}

function onAssetSave(data) {
  const listMap = { emas: localEmas, saham: localSaham, reksa: localReksa }
  const list = listMap[assetFormType.value]
  if (!list) return

  if (editingItem.value) {
    const idx = list.value.findIndex(i => i.id === data.id)
    if (idx !== -1) list.value.splice(idx, 1, data)
  } else {
    if (list.value.find(i => i.id === data.id)) {
      showToast(`ID "${data.id}" sudah ada`, 'error')
      return
    }
    list.value.push(data)
  }
  portfolioStore.markChanged()
}

// ── Delete confirm ────────────────────────────────────────────
const deleteConfirm = ref({ show: false, type: null, item: null })

function askDelete(type, item) {
  deleteConfirm.value = { show: true, type, item }
}

function confirmDelete() {
  const { type, item } = deleteConfirm.value
  const listMap = { emas: localEmas, saham: localSaham, reksa: localReksa }
  const list = listMap[type]
  if (list) {
    const idx = list.value.findIndex(i => i.id === item.id)
    if (idx !== -1) list.value.splice(idx, 1)
    portfolioStore.markChanged()
  }
  deleteConfirm.value = { show: false, type: null, item: null }
}

// ── Preview & Save modal ──────────────────────────────────────
const showPreview = ref(false)

function onPreviewSaved() {
  populateLocal()
}

// ── Reset ─────────────────────────────────────────────────────
function resetAll() {
  portfolioStore.resetChanges()
  populateLocal()
}
</script>

<template>
  <div class="settings">
    <AppTopbar title="Settings" subtitle="Kelola data portofolio Anda">
      <template #actions>
        <button
          class="btn-fetch"
          :disabled="portfolioStore.loading"
          @click="portfolioStore.fetchPortfolio().then(populateLocal)"
        >
          <span :class="{ spin: portfolioStore.loading }">⟳</span>
          Sync
        </button>
      </template>
    </AppTopbar>

    <div v-if="portfolioStore.loading && !portfolioStore.portfolio" class="spinner-wrap">
      <LoadingSpinner size="lg" />
    </div>

    <div v-else class="content">

      <!-- ── Tab nav ── -->
      <div class="tab-nav">
        <button
          v-for="tab in TABS"
          :key="tab.key"
          :class="['tab-btn', { active: activeTab === tab.key }]"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- ── EMAS ── -->
      <div v-if="activeTab === 'emas'" class="tab-content">
        <div class="tab-header">
          <span class="tab-count">{{ localEmas.length }} aset</span>
          <button class="btn-add" @click="openAdd('emas')">＋ Tambah Emas</button>
        </div>

        <div v-if="localEmas.length === 0" class="empty-tab">
          Belum ada data emas
        </div>

        <div v-else class="asset-grid">
          <div v-for="item in localEmas" :key="item.id" class="asset-card">
            <div class="asset-card-head">
              <div>
                <div class="asset-name">{{ item.nama }}</div>
                <div class="asset-id mono">{{ item.id }}</div>
              </div>
              <div class="asset-actions">
                <button class="btn-icon btn-edit" @click="openEdit('emas', item)">✏️</button>
                <button class="btn-icon btn-del"  @click="askDelete('emas', item)">🗑</button>
              </div>
            </div>
            <div class="asset-card-body">
              <div class="asset-stat">
                <span class="stat-label">Qty</span>
                <span class="stat-val mono">{{ item.qty_gram }} gram</span>
              </div>
              <div class="asset-stat">
                <span class="stat-label">Avg Beli</span>
                <span class="stat-val mono">{{ formatRupiah(item.avg_buy_price) }}</span>
              </div>
              <div class="asset-stat">
                <span class="stat-label">Modal</span>
                <span class="stat-val mono">{{ formatJuta(item.qty_gram * item.avg_buy_price) }} Jt</span>
              </div>
            </div>
            <div v-if="item.catatan" class="asset-note">{{ item.catatan }}</div>
          </div>
        </div>
      </div>

      <!-- ── SAHAM ── -->
      <div v-else-if="activeTab === 'saham'" class="tab-content">
        <div class="tab-header">
          <span class="tab-count">{{ localSaham.length }} aset</span>
          <button class="btn-add" @click="openAdd('saham')">＋ Tambah Saham</button>
        </div>

        <div v-if="localSaham.length === 0" class="empty-tab">
          Belum ada data saham
        </div>

        <div v-else class="asset-grid">
          <div v-for="item in localSaham" :key="item.id" class="asset-card">
            <div class="asset-card-head">
              <div>
                <div class="asset-name">
                  {{ item.id }}
                  <span class="ticker mono">{{ item.ticker }}</span>
                </div>
                <div class="asset-id">{{ item.nama }}</div>
              </div>
              <div class="asset-actions">
                <button class="btn-icon btn-edit" @click="openEdit('saham', item)">✏️</button>
                <button class="btn-icon btn-del"  @click="askDelete('saham', item)">🗑</button>
              </div>
            </div>
            <div class="asset-card-body">
              <div class="asset-stat">
                <span class="stat-label">Qty</span>
                <span class="stat-val mono">{{ item.qty_lot }} lot</span>
              </div>
              <div class="asset-stat">
                <span class="stat-label">Avg Buy</span>
                <span class="stat-val mono">{{ formatRupiah(item.avg_buy_price) }}</span>
              </div>
              <div class="asset-stat">
                <span class="stat-label">Support</span>
                <span class="stat-val mono">{{ formatRupiah(item.support) }}</span>
              </div>
              <div class="asset-stat">
                <span class="stat-label">Resistance</span>
                <span class="stat-val mono">{{ formatRupiah(item.resistance) }}</span>
              </div>
              <div class="asset-stat">
                <span class="stat-label">Stop Loss</span>
                <span class="stat-val mono sl">{{ formatRupiah(item.stop_loss) }}</span>
              </div>
            </div>
            <div v-if="item.catatan" class="asset-note">{{ item.catatan }}</div>
          </div>
        </div>
      </div>

      <!-- ── REKSA DANA ── -->
      <div v-else-if="activeTab === 'reksa'" class="tab-content">
        <div class="tab-header">
          <span class="tab-count">{{ localReksa.length }} aset</span>
          <button class="btn-add" @click="openAdd('reksa')">＋ Tambah Reksa Dana</button>
        </div>

        <div v-if="localReksa.length === 0" class="empty-tab">
          Belum ada data reksa dana
        </div>

        <div v-else class="asset-grid">
          <div v-for="item in localReksa" :key="item.id" class="asset-card">
            <div class="asset-card-head">
              <div>
                <div class="asset-name">{{ item.nama }}</div>
                <div class="asset-id mono">{{ item.id }}</div>
              </div>
              <div class="asset-actions">
                <button class="btn-icon btn-edit" @click="openEdit('reksa', item)">✏️</button>
                <button class="btn-icon btn-del"  @click="askDelete('reksa', item)">🗑</button>
              </div>
            </div>
            <div class="asset-card-body">
              <div class="asset-stat">
                <span class="stat-label">Qty</span>
                <span class="stat-val mono">{{ (item.qty_unit ?? 0).toLocaleString('id-ID') }} unit</span>
              </div>
              <div class="asset-stat">
                <span class="stat-label">Avg NAB</span>
                <span class="stat-val mono">{{ formatRupiah(item.avg_buy_nab) }}</span>
              </div>
              <div class="asset-stat">
                <span class="stat-label">Modal</span>
                <span class="stat-val mono">{{ formatJuta((item.qty_unit ?? 0) * (item.avg_buy_nab ?? 0)) }} Jt</span>
              </div>
            </div>
            <div v-if="item.catatan" class="asset-note">{{ item.catatan }}</div>
          </div>
        </div>
      </div>

      <!-- ── TARGET ALOKASI ── -->
      <div v-else-if="activeTab === 'target'" class="tab-content">
        <div class="target-section">
          <div class="target-desc">
            Tentukan target alokasi portofolio. Total harus tepat <strong>100%</strong>.
          </div>

          <div class="target-grid">
            <div class="target-field">
              <label class="target-label">🥇 Emas (%)</label>
              <input
                v-model.number="localTarget.emas"
                type="number" min="0" max="100"
                class="target-input mono"
                @input="onTargetChange"
              />
            </div>
            <div class="target-field">
              <label class="target-label">📈 Saham (%)</label>
              <input
                v-model.number="localTarget.saham"
                type="number" min="0" max="100"
                class="target-input mono"
                @input="onTargetChange"
              />
            </div>
            <div class="target-field">
              <label class="target-label">🏦 Reksa Dana (%)</label>
              <input
                v-model.number="localTarget.reksa"
                type="number" min="0" max="100"
                class="target-input mono"
                @input="onTargetChange"
              />
            </div>
          </div>

          <div :class="['target-total', targetValid ? 'total-ok' : 'total-err']">
            <span class="total-label">Total:</span>
            <span class="total-val mono">{{ targetTotal }}%</span>
            <span v-if="!targetValid" class="total-warn">
              ⚠️ Harus tepat 100%
              ({{ targetTotal > 100 ? '+' : '' }}{{ targetTotal - 100 }}%)
            </span>
            <span v-else class="total-ok-msg">✓ Valid</span>
          </div>

          <div class="alloc-bar-wrap">
            <div class="alloc-bar">
              <div
                class="alloc-seg seg-emas"
                :style="{ width: Math.min(localTarget.emas ?? 0, 100) + '%' }"
              >
                <span v-if="(localTarget.emas ?? 0) >= 10" class="seg-label">
                  Emas {{ localTarget.emas }}%
                </span>
              </div>
              <div
                class="alloc-seg seg-saham"
                :style="{ width: Math.min(localTarget.saham ?? 0, 100) + '%' }"
              >
                <span v-if="(localTarget.saham ?? 0) >= 10" class="seg-label">
                  Saham {{ localTarget.saham }}%
                </span>
              </div>
              <div
                class="alloc-seg seg-reksa"
                :style="{ width: Math.min(localTarget.reksa ?? 0, 100) + '%' }"
              >
                <span v-if="(localTarget.reksa ?? 0) >= 10" class="seg-label">
                  Reksa {{ localTarget.reksa }}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div><!-- /content -->

    <!-- ── Sticky Save Bar ── -->
    <Transition name="savebar">
      <div v-if="portfolioStore.hasChanges" class="save-bar">
        <div class="save-bar-msg">
          <span class="save-dot" />
          <span>Ada perubahan belum disimpan</span>
        </div>
        <div class="save-bar-actions">
          <button class="btn-reset" @click="resetAll">↩ Reset</button>
          <button class="btn-preview" @click="showPreview = true">
            👁 Preview &amp; Simpan →
          </button>
        </div>
      </div>
    </Transition>

    <!-- ── Delete confirm ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="deleteConfirm.show"
          class="del-backdrop"
          @click.self="deleteConfirm.show = false"
        >
          <div class="del-modal">
            <div class="del-icon">🗑</div>
            <div class="del-title">Hapus Aset?</div>
            <div class="del-msg">
              <span class="mono">{{ deleteConfirm.item?.nama ?? deleteConfirm.item?.id }}</span>
              akan dihapus dari daftar. Perubahan belum disimpan ke server.
            </div>
            <div class="del-actions">
              <button class="btn-del-cancel" @click="deleteConfirm.show = false">Batal</button>
              <button class="btn-del-confirm" @click="confirmDelete">Ya, Hapus</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── AssetFormModal ── -->
    <AssetFormModal
      v-model="showAssetForm"
      :type="assetFormType"
      :item="editingItem"
      @save="onAssetSave"
    />

    <!-- ── PLPreviewModal ── -->
    <PLPreviewModal
      v-model="showPreview"
      :after="localPortfolio"
      @saved="onPreviewSaved"
    />

  </div>
</template>

<style scoped>
.settings {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  padding-bottom: 80px;
}

.content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

.spinner-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px;
}

/* ── Tab nav ── */
.tab-nav {
  display: flex;
  gap: 4px;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 4px;
}

.tab-btn {
  flex: 1;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 7px;
  font-size: 12px;
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--text3);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.tab-btn:hover  { color: var(--text2); background: var(--surface); }
.tab-btn.active { background: var(--surface); color: var(--accent); border: 1px solid rgba(0,229,160,0.3); }

/* ── Tab content ── */
.tab-content { display: flex; flex-direction: column; gap: 14px; }

.tab-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tab-count {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text3);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.btn-add {
  padding: 8px 16px;
  background: rgba(0,229,160,0.08);
  border: 1px solid rgba(0,229,160,0.3);
  border-radius: 7px;
  color: var(--accent);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-add:hover { background: rgba(0,229,160,0.15); box-shadow: var(--glow-accent); }

.empty-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 56px;
  background: var(--bg3);
  border: 1px dashed var(--border);
  border-radius: 10px;
  color: var(--text3);
  font-size: 13px;
}

/* ── Asset grid ── */
.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.asset-card {
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: border-color 0.15s;
}
.asset-card:hover { border-color: rgba(0,229,160,0.2); }

.asset-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.asset-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 6px;
}

.ticker {
  font-size: 10px;
  color: var(--text3);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 3px;
  padding: 1px 5px;
}

.asset-id {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text3);
  margin-top: 2px;
}

.asset-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.btn-icon {
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-edit:hover { border-color: var(--blue); background: rgba(0,132,255,0.08); }
.btn-del:hover  { border-color: var(--red);  background: rgba(255,71,87,0.08); }

.asset-card-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 10px;
}

.asset-stat { display: flex; flex-direction: column; gap: 1px; }

.stat-label {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text3);
}

.stat-val { font-size: 12px; color: var(--text); }
.stat-val.sl { color: var(--red); }

.asset-note {
  font-size: 11px;
  color: var(--text3);
  background: var(--surface);
  border-radius: 5px;
  padding: 5px 8px;
  font-style: italic;
}

/* ── Target Alokasi ── */
.target-section {
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.target-desc {
  font-size: 13px;
  color: var(--text2);
  line-height: 1.5;
}

.target-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.target-field { display: flex; flex-direction: column; gap: 6px; }

.target-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text3);
}

.target-input {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 7px;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 20px;
  font-weight: 700;
  padding: 10px 12px;
  outline: none;
  text-align: center;
  transition: border-color 0.15s;
  width: 100%;
}
.target-input:focus { border-color: var(--accent); }

.target-total {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 7px;
  border: 1px solid;
}
.total-ok  { background: rgba(0,229,160,0.05); border-color: rgba(0,229,160,0.2); }
.total-err { background: rgba(255,71,87,0.05);  border-color: rgba(255,71,87,0.2); }

.total-label { font-size: 12px; color: var(--text3); }
.total-val   { font-family: var(--font-mono); font-weight: 700; font-size: 16px; color: var(--text); }
.total-warn  { font-size: 12px; color: var(--red); }
.total-ok-msg { font-size: 12px; color: var(--green); }

.alloc-bar-wrap { border-radius: 6px; overflow: hidden; }
.alloc-bar {
  display: flex;
  height: 36px;
  border-radius: 6px;
  overflow: hidden;
  background: var(--surface);
}
.alloc-seg {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  min-width: 0;
  transition: width 0.3s ease;
}
.seg-label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  color: #000;
  white-space: nowrap;
}
.seg-emas  { background: linear-gradient(90deg, #f5c842, #f0a500); }
.seg-saham { background: linear-gradient(90deg, var(--blue), #0060cc); }
.seg-reksa { background: linear-gradient(90deg, var(--accent), #00b07a); }

/* ── Save bar ── */
.save-bar {
  position: fixed;
  bottom: 0;
  left: var(--sidebar-w, 220px);
  right: 0;
  background: var(--bg2);
  border-top: 1px solid rgba(0,229,160,0.3);
  box-shadow: 0 -4px 24px rgba(0,0,0,0.3);
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  z-index: 500;
}

.save-bar-msg {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text2);
}

.save-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.4; transform: scale(0.8); }
}

.save-bar-actions { display: flex; gap: 8px; }

.btn-reset {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 7px;
  color: var(--text2);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-reset:hover { border-color: var(--text2); color: var(--text); }

.btn-preview {
  padding: 8px 20px;
  background: rgba(0,229,160,0.12);
  border: 1px solid rgba(0,229,160,0.4);
  border-radius: 7px;
  color: var(--accent);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-preview:hover { background: rgba(0,229,160,0.2); box-shadow: var(--glow-accent); }

/* ── Delete modal ── */
.del-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.del-modal {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 28px 24px;
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}
.del-icon  { font-size: 36px; }
.del-title { font-size: 16px; font-weight: 700; color: var(--text); }
.del-msg   { font-size: 13px; color: var(--text2); line-height: 1.5; }
.del-actions { display: flex; gap: 8px; width: 100%; margin-top: 6px; }

.btn-del-cancel {
  flex: 1; padding: 9px;
  background: transparent; border: 1px solid var(--border);
  border-radius: 7px; color: var(--text2); font-size: 13px; cursor: pointer;
  transition: all 0.15s;
}
.btn-del-cancel:hover { border-color: var(--text2); color: var(--text); }

.btn-del-confirm {
  flex: 1; padding: 9px;
  background: rgba(255,71,87,0.1); border: 1px solid rgba(255,71,87,0.4);
  border-radius: 7px; color: var(--red); font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.15s;
}
.btn-del-confirm:hover { background: rgba(255,71,87,0.2); }

/* ── Transitions ── */
.savebar-enter-active, .savebar-leave-active { transition: transform 0.25s ease, opacity 0.25s ease; }
.savebar-enter-from, .savebar-leave-to { transform: translateY(100%); opacity: 0; }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

/* ── Sync button ── */
.btn-fetch {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: 7px; font-size: 12px;
  font-family: var(--font-mono); font-weight: 600; cursor: pointer;
  border: 1px solid var(--border); background: transparent; color: var(--text2);
  transition: all 0.15s;
}
.btn-fetch:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.btn-fetch:disabled { opacity: 0.4; cursor: not-allowed; }

.spin { display: inline-block; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Responsive ── */
@media (max-width: 768px) {
  .content { padding: 12px; gap: 12px; }
  .tab-btn { font-size: 11px; padding: 7px 6px; }
  .target-grid { grid-template-columns: 1fr; }
  .asset-grid { grid-template-columns: 1fr; }
  .save-bar { left: 0; padding: 10px 16px; flex-wrap: wrap; }
  .save-bar-actions { width: 100%; justify-content: flex-end; }
}
</style>
