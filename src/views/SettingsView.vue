<script setup>
import { ref, computed, watch, onMounted, onActivated } from 'vue'
import { usePortfolioStore } from '@/stores/portfolio'
import { useWatchlistStore } from '@/stores/watchlist'
import { useToast } from '@/composables/useToast'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import StockSearchInput from '@/components/ui/StockSearchInput.vue'
import AssetFormModal from '@/components/portfolio/AssetFormModal.vue'
import PLPreviewModal from '@/components/portfolio/PLPreviewModal.vue'
import ValasFormModal from '@/components/portfolio/ValasFormModal.vue'
import { useMarketStore } from '@/stores/market'
import { formatRupiah, formatJuta } from '@/utils/formatters'

const portfolioStore = usePortfolioStore()
const watchlistStore = useWatchlistStore()
const marketStore    = useMarketStore()
const { showToast } = useToast()

// ── Valas ─────────────────────────────────────────────────────
const valasRates     = computed(() => marketStore.valasRates)
const showValasModal = ref(false)
const editValasItem  = ref(null)

const FLAG_MAP = { USD: '🇺🇸', SGD: '🇸🇬', EUR: '🇪🇺', JPY: '🇯🇵' }
const flagEmoji = (code) => FLAG_MAP[code] ?? '🏳️'

function openAddValas() {
  editValasItem.value  = null
  showValasModal.value = true
}

function openEditValas(item) {
  editValasItem.value  = { ...item }
  showValasModal.value = true
}

function deleteValas(id) {
  const valas = portfolioStore.portfolio?.valas
  if (!valas) return
  const idx = valas.findIndex((i) => i.id === id)
  if (idx !== -1) valas.splice(idx, 1)
  portfolioStore.markChanged()
}

function handleValasSave(item) {
  if (!portfolioStore.portfolio) return
  if (!portfolioStore.portfolio.valas) portfolioStore.portfolio.valas = []
  const valas = portfolioStore.portfolio.valas
  const idx   = valas.findIndex((i) => i.id === item.id)
  if (idx !== -1) {
    valas.splice(idx, 1, item)
  } else {
    valas.push(item)
  }
  portfolioStore.markChanged()
  showValasModal.value = false
}

// ── Tabs ──────────────────────────────────────────────────────
const TABS = [
  { key: 'emas',      label: '🥇 Emas' },
  { key: 'saham',     label: '📈 Saham' },
  { key: 'reksa',     label: '🏦 Reksa Dana' },
  { key: 'valas',     label: '💱 Valas' },
  { key: 'target',    label: '⚖️ Target Alokasi' },
  { key: 'watchlist', label: '📡 Watchlist' },
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
    p.target_allocation ?? { emas: 20, saham: 60, reksa: 20 }
  ))
}

async function loadData() {
  await portfolioStore.fetchPortfolio()
  populateLocal()
}

onMounted(() => { loadData(); loadWatchlist() })
onActivated(() => { loadData(); loadWatchlist() })

watch(() => portfolioStore.portfolio, () => {
  if (!portfolioStore.hasChanges) populateLocal()
})

// ── localPortfolio for PLPreviewModal ─────────────────────────
const localPortfolio = computed(() => ({
  emas:              localEmas.value,
  saham:             localSaham.value,
  reksadana:         localReksa.value,
  target_allocation: localTarget.value,
  valas:             portfolioStore.portfolio?.valas ?? [],
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

function openPreview() {
  if (!portfolioStore.portfolio) {
    showToast('Data portfolio belum loaded. Coba Sync dulu.', 'error')
    return
  }
  showPreview.value = true
}

function onPreviewSaved() {
  populateLocal()
}

// ── Reset ─────────────────────────────────────────────────────
function resetAll() {
  portfolioStore.resetChanges()
  populateLocal()
}

// ── Watchlist ──────────────────────────────────────────────────
const watchSaham      = ref([])
const watchReksa      = ref([])
const watchHasChanges = ref(false)

const showSahamAdd   = ref(false)
const sahamPick      = ref(null)   // { kode, nama, sektor, isManual }
const manualTicker   = ref('')
const validating     = ref(false)
const validateResult = ref(null)

const showReksaForm = ref(false)
const newReksaId    = ref('')
const newReksaNama  = ref('')

const SEKTOR_STYLE = {
  'Keuangan':      { background: 'rgba(0,132,255,0.12)',   color: '#0084ff' },
  'Teknologi':     { background: 'rgba(0,229,160,0.12)',   color: '#00e5a0' },
  'Energi':        { background: 'rgba(255,107,53,0.12)',  color: '#ff6b35' },
  'Konsumer':      { background: 'rgba(163,130,255,0.12)', color: '#a382ff' },
  'Tambang':       { background: 'rgba(255,217,61,0.12)',  color: '#ffd93d' },
  'Pertanian':     { background: 'rgba(82,196,82,0.12)',   color: '#52c452' },
  'Komunikasi':    { background: 'rgba(0,200,220,0.12)',   color: '#00c8dc' },
  'Properti':      { background: 'rgba(255,165,0,0.12)',   color: '#ffa500' },
  'Infrastruktur': { background: 'rgba(136,153,187,0.12)', color: '#8899bb' },
  'Kesehatan':     { background: 'rgba(255,120,130,0.12)', color: '#ff7882' },
  'Industri':      { background: 'rgba(100,140,255,0.12)', color: '#648cff' },
  'Perdagangan':   { background: 'rgba(255,140,60,0.12)',  color: '#ff8c3c' },
}
function sektorStyle(sektor) {
  return SEKTOR_STYLE[sektor] ?? { background: 'rgba(136,153,187,0.1)', color: '#8899bb' }
}

function populateWatchlist() {
  const wl = watchlistStore.watchlist
  watchSaham.value = (wl.saham ?? []).map(s =>
    typeof s === 'string' ? { kode: s, nama: s, sektor: '' } : s
  )
  watchReksa.value      = [...(wl.reksa ?? [])]
  watchHasChanges.value = false
}

async function loadWatchlist() {
  await watchlistStore.fetchWatchlist()
  populateWatchlist()
}

function onSearchSelect(item) {
  sahamPick.value      = item
  manualTicker.value   = item.isManual ? item.kode : ''
  validateResult.value = null
}

async function doValidate() {
  const ticker = sahamPick.value?.isManual
    ? manualTicker.value.trim()
    : sahamPick.value?.kode
  if (!ticker) return
  validating.value     = true
  validateResult.value = null
  validateResult.value = await watchlistStore.validateTicker(ticker)
  validating.value     = false
}

function addSahamToWatch() {
  if (!validateResult.value?.valid) return
  const entry = sahamPick.value?.isManual
    ? { kode: validateResult.value.ticker, nama: validateResult.value.name ?? validateResult.value.ticker, sektor: 'Manual' }
    : { kode: sahamPick.value.kode, nama: sahamPick.value.nama, sektor: sahamPick.value.sektor }

  if (watchSaham.value.find(s => s.kode === entry.kode)) {
    showToast(`${entry.kode} sudah ada di watchlist`, 'error')
    return
  }
  watchSaham.value.push(entry)
  watchHasChanges.value = true
  sahamPick.value      = null
  manualTicker.value   = ''
  validateResult.value = null
  showSahamAdd.value   = false
}

function removeSaham(kode) {
  if (watchSaham.value.length <= 1) return
  watchSaham.value      = watchSaham.value.filter(s => s.kode !== kode)
  watchHasChanges.value = true
}

function addReksaToWatch() {
  const id   = newReksaId.value.trim()
  const nama = newReksaNama.value.trim()
  if (!id || !nama) return
  if (watchReksa.value.find(r => r.id === id)) {
    showToast(`ID "${id}" sudah ada di watchlist`, 'error')
    return
  }
  watchReksa.value.push({ id, nama })
  watchHasChanges.value = true
  newReksaId.value      = ''
  newReksaNama.value    = ''
  showReksaForm.value   = false
}

function removeReksa(id) {
  watchReksa.value      = watchReksa.value.filter(r => r.id !== id)
  watchHasChanges.value = true
}

async function saveWatchlistChanges() {
  const result = await watchlistStore.saveWatchlist({
    saham: watchSaham.value,
    reksa: watchReksa.value,
  })
  if (result.ok) {
    watchHasChanges.value = false
    showToast('✅ Watchlist disimpan! Perubahan aktif mulai fetch berikutnya.', 'success')
  } else {
    showToast(result.message || 'Gagal menyimpan watchlist', 'error')
  }
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

      <!-- ── VALAS ── -->
      <div v-else-if="activeTab === 'valas'" class="tab-content">
        <div class="panel-header">
          <h3 class="panel-title">💱 Posisi Valas</h3>
          <button class="btn-add" @click="openAddValas">＋ Tambah</button>
        </div>

        <div v-if="!portfolioStore.valasList.length" class="empty-panel">
          <span class="empty-panel-icon">💱</span>
          <span>Belum ada posisi valas ditambahkan</span>
        </div>

        <div v-else class="asset-cards">
          <div v-for="item in portfolioStore.valasList" :key="item.id" class="valas-card">
            <div class="card-left">
              <span class="card-flag">{{ flagEmoji(item.code) }}</span>
              <div>
                <div class="card-code mono">{{ item.code }}</div>
                <div class="card-subtext">{{ item.nama }}</div>
              </div>
            </div>
            <div class="card-center">
              <div class="mono">
                {{ (item.qty_unit ?? 0).toLocaleString('id-ID', { maximumFractionDigits: 2 }) }}
                <span class="card-unit">{{ item.code }}</span>
              </div>
              <div class="card-subtext mono">@ {{ formatRupiah(item.avg_buy_rate) }}/{{ item.code }}</div>
            </div>
            <div class="card-actions">
              <button class="btn-icon btn-edit" @click="openEditValas(item)">✏️</button>
              <button class="btn-icon btn-del"  @click="deleteValas(item.id)">🗑</button>
            </div>
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

      <!-- ── WATCHLIST ── -->
      <div v-else-if="activeTab === 'watchlist'" class="tab-content">

        <div class="info-box">
          ℹ️ Data saham IDX80 tersedia. Saham lain bisa ditambah via input manual dengan validasi Yahoo Finance.
          <br /><span style="color: var(--text3); font-size: 11px">Perubahan aktif pada fetch berikutnya (jam 09:00–16:00)</span>
        </div>

        <!-- Section 1: Saham -->
        <div class="wl-section">
          <div class="tab-header">
            <span class="wl-section-title">📈 Saham Dipantau</span>
            <button
              class="btn-add"
              @click="showSahamAdd = !showSahamAdd; sahamPick = null; validateResult = null"
            >
              {{ showSahamAdd ? '✕ Batal' : '+ Tambah Saham' }}
            </button>
          </div>

          <div v-if="showSahamAdd" class="wl-add-form">
            <StockSearchInput @select="onSearchSelect" />

            <!-- Preview card after selection -->
            <div v-if="sahamPick" class="saham-preview-card">
              <div class="preview-head">
                <span class="mono preview-kode">
                  {{ sahamPick.isManual ? (manualTicker || sahamPick.kode) : sahamPick.kode }}
                </span>
                <span v-if="!sahamPick.isManual" class="preview-nama">{{ sahamPick.nama }}</span>
                <span
                  v-if="!sahamPick.isManual && sahamPick.sektor"
                  class="sektor-badge"
                  :style="sektorStyle(sahamPick.sektor)"
                >{{ sahamPick.sektor }}</span>
              </div>

              <!-- Manual: ticker input -->
              <input
                v-if="sahamPick.isManual"
                :value="manualTicker"
                class="wl-input mono"
                placeholder="Kode saham (contoh: BMRI)"
                @input="manualTicker = $event.target.value.toUpperCase(); validateResult = null"
                @keyup.enter="doValidate"
              />

              <!-- Validate row -->
              <div class="preview-validate-row">
                <button
                  class="btn-validate"
                  :disabled="(sahamPick.isManual && !manualTicker.trim()) || validating"
                  @click="doValidate"
                >
                  <span v-if="validating" class="spin">⟳</span>
                  <span v-else>🔍 {{ sahamPick.isManual ? 'Validasi' : 'Validasi Harga' }}</span>
                </button>

                <div
                  v-if="validateResult"
                  :class="['wl-validate-result wl-validate-inline', validateResult.valid ? 'result-ok' : 'result-err']"
                >
                  <template v-if="validateResult.valid">
                    ✅ <span class="mono wl-price">Rp{{ validateResult.price?.toLocaleString('id-ID') }}</span>
                    <span v-if="sahamPick.isManual" class="preview-nama"> — {{ validateResult.name }}</span>
                  </template>
                  <template v-else>❌ Tidak valid</template>
                </div>
              </div>

              <button
                class="btn-add-confirmed"
                :disabled="!validateResult?.valid"
                @click="addSahamToWatch"
              >
                ➕ Tambah ke Watchlist
              </button>
            </div>
          </div>

          <div v-if="watchSaham.length === 0 && !showSahamAdd" class="empty-tab">
            Belum ada saham dipantau
          </div>
          <div v-else-if="watchSaham.length > 0" class="wl-list">
            <div v-for="s in watchSaham" :key="s.kode" class="wl-item">
              <div class="wl-item-info">
                <div class="wl-item-row1">
                  <span class="mono wl-ticker">{{ s.kode }}</span>
                  <span v-if="s.sektor" class="sektor-badge sektor-badge-sm" :style="sektorStyle(s.sektor)">
                    {{ s.sektor }}
                  </span>
                </div>
                <span class="wl-item-nama">{{ s.nama }}</span>
              </div>
              <button
                class="btn-icon btn-del"
                :disabled="watchSaham.length <= 1"
                :title="watchSaham.length <= 1 ? 'Minimal 1 saham di watchlist' : 'Hapus'"
                @click="removeSaham(s.kode)"
              >🗑</button>
            </div>
          </div>
        </div>

        <!-- Section 2: Reksa Dana -->
        <div class="wl-section">
          <div class="tab-header">
            <span class="wl-section-title">🏦 Reksa Dana Dipantau</span>
            <button class="btn-add" @click="showReksaForm = !showReksaForm">
              {{ showReksaForm ? '✕ Batal' : '+ Tambah Reksa Dana' }}
            </button>
          </div>

          <div v-if="showReksaForm" class="wl-add-form">
            <input
              :value="newReksaId"
              class="wl-input mono"
              placeholder="ID (contoh: MANULIFE_SAHAM)"
              @input="newReksaId = $event.target.value.toUpperCase()"
            />
            <input
              v-model="newReksaNama"
              class="wl-input"
              placeholder="Nama lengkap produk"
            />
            <button
              class="btn-add-confirmed"
              :disabled="!newReksaId.trim() || !newReksaNama.trim()"
              @click="addReksaToWatch"
            >
              ➕ Tambah ke Watchlist
            </button>
          </div>

          <div v-if="watchReksa.length === 0 && !showReksaForm" class="empty-tab">
            Belum ada reksa dana dipantau
          </div>
          <div v-else-if="watchReksa.length > 0" class="wl-list">
            <div v-for="item in watchReksa" :key="item.id" class="wl-item">
              <div class="wl-item-info">
                <span class="wl-item-nama">{{ item.nama }}</span>
                <span class="mono wl-item-id">{{ item.id }}</span>
              </div>
              <button class="btn-icon btn-del" @click="removeReksa(item.id)">🗑</button>
            </div>
          </div>
        </div>

      </div>
      <!-- /watchlist -->

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
          <button
            class="btn-preview"
            :disabled="portfolioStore.loading || !portfolioStore.portfolio"
            @click="openPreview"
          >
            👁 Preview &amp; Simpan →
          </button>
        </div>
      </div>
    </Transition>

    <!-- ── Watchlist Save Bar ── -->
    <Transition name="savebar">
      <div v-if="watchHasChanges" class="save-bar wl-save-bar">
        <div class="save-bar-msg">
          <span class="save-dot wl-dot" />
          <span>Watchlist belum disimpan</span>
        </div>
        <div class="save-bar-actions">
          <button class="btn-reset" @click="populateWatchlist">↩ Reset</button>
          <button
            class="btn-save-wl"
            :disabled="watchlistStore.saving"
            @click="saveWatchlistChanges"
          >
            <span v-if="watchlistStore.saving" class="spin">⟳</span>
            <span v-else>💾 Simpan Watchlist</span>
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
      :original-portfolio="portfolioStore.originalPortfolio"
      @saved="onPreviewSaved"
    />

    <!-- ── ValasFormModal ── -->
    <ValasFormModal
      v-if="showValasModal"
      :edit-item="editValasItem"
      :valas-rates="valasRates"
      @close="showValasModal = false"
      @save="handleValasSave"
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

/* ── Watchlist tab ── */
.info-box {
  background: rgba(0, 132, 255, 0.06);
  border: 1px solid rgba(0, 132, 255, 0.25);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 12px;
  color: var(--text2);
  line-height: 1.5;
}

.wl-section {
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wl-section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.wl-add-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
}

.wl-form-row {
  display: flex;
  gap: 8px;
}

.wl-input {
  flex: 1;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 7px;
  color: var(--text);
  font-size: 13px;
  padding: 8px 12px;
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
}
.wl-input::placeholder { color: var(--text3); }
.wl-input:focus { border-color: var(--accent); }
.wl-input.mono { font-family: var(--font-mono); }

.btn-validate {
  padding: 8px 14px;
  background: rgba(0, 132, 255, 0.08);
  border: 1px solid rgba(0, 132, 255, 0.35);
  border-radius: 7px;
  color: var(--blue);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.btn-validate:hover:not(:disabled) { background: rgba(0, 132, 255, 0.15); box-shadow: var(--glow-blue); }
.btn-validate:disabled { opacity: 0.4; cursor: not-allowed; }

.wl-validate-result {
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.result-ok  { background: rgba(0,229,160,0.07); border: 1px solid rgba(0,229,160,0.25); color: var(--text); }
.result-err { background: rgba(255,71,87,0.07);  border: 1px solid rgba(255,71,87,0.25);  color: var(--red); }

.wl-price {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--accent);
  margin-left: 4px;
}

.btn-add-confirmed {
  align-self: flex-start;
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
.btn-add-confirmed:hover:not(:disabled) { background: rgba(0,229,160,0.15); box-shadow: var(--glow-accent); }
.btn-add-confirmed:disabled { opacity: 0.3; cursor: not-allowed; }

.wl-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.wl-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 7px;
  transition: border-color 0.15s;
}
.wl-item:hover { border-color: rgba(0,229,160,0.2); }

.wl-ticker {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: 0.5px;
}

.wl-item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.wl-item-nama { font-size: 13px; font-weight: 500; color: var(--text); }
.wl-item-id   { font-family: var(--font-mono); font-size: 10px; color: var(--text3); }

/* Saham preview card */
.saham-preview-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
}

.preview-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.preview-kode {
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 0.5px;
}

.preview-nama {
  font-size: 12px;
  color: var(--text2);
}

.preview-validate-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.wl-validate-inline {
  flex: 1;
  margin: 0;
}

/* Sektor badge */
.sektor-badge {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 2px 7px;
  border-radius: 20px;
  border: 1px solid currentColor;
  opacity: 0.9;
  text-transform: uppercase;
}

.sektor-badge-sm {
  font-size: 8px;
  padding: 1px 6px;
}

.wl-item-row1 {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Watchlist save bar variant */
.wl-save-bar   { border-top-color: rgba(0, 132, 255, 0.35); }
.wl-dot        { background: var(--blue) !important; }

.btn-save-wl {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  background: rgba(0, 132, 255, 0.12);
  border: 1px solid rgba(0, 132, 255, 0.4);
  border-radius: 7px;
  color: var(--blue);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-save-wl:hover:not(:disabled) { background: rgba(0, 132, 255, 0.2); box-shadow: var(--glow-blue); }
.btn-save-wl:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Valas tab ── */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.panel-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}

.empty-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 56px;
  background: var(--bg3);
  border: 1px dashed var(--border);
  border-radius: 10px;
  color: var(--text3);
  font-size: 13px;
}
.empty-panel-icon { font-size: 22px; }

.asset-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.valas-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 10px;
  transition: border-color 0.15s;
}
.valas-card:hover { border-color: rgba(0, 229, 160, 0.2); }

.card-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  min-width: 140px;
}
.card-flag { font-size: 22px; line-height: 1; }
.card-code {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: 0.5px;
}
.card-subtext {
  font-size: 11px;
  color: var(--text3);
  margin-top: 2px;
}

.card-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.card-center .mono {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 13px;
  color: var(--text);
}
.card-unit {
  font-size: 10px;
  color: var(--text3);
  margin-left: 3px;
}
.card-center .card-subtext {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

.card-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .content { padding: 12px; gap: 12px; }
  .tab-btn { font-size: 11px; padding: 7px 6px; }
  .target-grid { grid-template-columns: 1fr; }
  .asset-grid { grid-template-columns: 1fr; }
  .save-bar { left: 0; padding: 10px 16px; flex-wrap: wrap; }
  .save-bar-actions { width: 100%; justify-content: flex-end; }
  .wl-form-row { flex-direction: column; }
  .btn-validate { width: 100%; justify-content: center; }
}
</style>
