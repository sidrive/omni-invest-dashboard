<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { IDX80 } from '@/data/idx80'

const emit = defineEmits(['select'])

const query       = ref('')
const isOpen      = ref(false)
const activeIndex = ref(-1)
const wrapperRef  = ref(null)
const listRef     = ref(null)

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return IDX80.filter(
    s => s.kode.toLowerCase().startsWith(q) || s.nama.toLowerCase().includes(q)
  ).slice(0, 20)
})

const showManual  = computed(() => query.value.trim().length >= 1)
const totalItems  = computed(() => results.value.length + (showManual.value ? 1 : 0))

function onInput() {
  isOpen.value      = query.value.trim().length > 0
  activeIndex.value = -1
}

function onFocus() {
  if (query.value.trim().length > 0) isOpen.value = true
}

function onKeydown(e) {
  if (!isOpen.value) {
    if (e.key === 'ArrowDown') { isOpen.value = true }
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % totalItems.value
    scrollActive()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value - 1 + totalItems.value) % totalItems.value
    scrollActive()
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (activeIndex.value === -1) return
    if (activeIndex.value < results.value.length) {
      selectItem(results.value[activeIndex.value])
    } else {
      selectManual()
    }
  } else if (e.key === 'Escape') {
    isOpen.value      = false
    activeIndex.value = -1
  }
}

function scrollActive() {
  if (!listRef.value) return
  const items = listRef.value.querySelectorAll('.dd-item')
  const el    = items[activeIndex.value]
  if (el) el.scrollIntoView({ block: 'nearest' })
}

function selectItem(item) {
  emit('select', { kode: item.kode, nama: item.nama, sektor: item.sektor, isManual: false })
  query.value       = ''
  isOpen.value      = false
  activeIndex.value = -1
}

function selectManual() {
  const kode = query.value.trim().toUpperCase()
  emit('select', { kode, nama: '', sektor: '', isManual: true })
  query.value       = ''
  isOpen.value      = false
  activeIndex.value = -1
}

function handleClickOutside(e) {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target)) {
    isOpen.value      = false
    activeIndex.value = -1
  }
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

<template>
  <div ref="wrapperRef" class="ssi-wrap">
    <input
      v-model="query"
      class="ssi-input"
      placeholder="Cari kode atau nama saham..."
      autocomplete="off"
      @input="onInput"
      @focus="onFocus"
      @keydown="onKeydown"
    />
    <Transition name="dd">
      <div
        v-if="isOpen && totalItems > 0"
        ref="listRef"
        class="ssi-dropdown"
      >
        <div
          v-for="(item, idx) in results"
          :key="item.kode"
          :class="['dd-item', { 'dd-active': activeIndex === idx }]"
          @mousedown.prevent="selectItem(item)"
        >
          <div class="dd-main">
            <span class="dd-kode mono">{{ item.kode }}</span>
            <span class="dd-nama">{{ item.nama }}</span>
          </div>
          <span class="dd-sektor">{{ item.sektor }}</span>
        </div>

        <div
          v-if="showManual"
          :class="['dd-item dd-manual', { 'dd-active': activeIndex === results.length }]"
          @mousedown.prevent="selectManual"
        >
          <span class="dd-manual-icon">✏️</span>
          <span class="dd-manual-text">
            Input manual: <span class="mono dd-kode">{{ query.trim().toUpperCase() }}</span>
          </span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.ssi-wrap {
  position: relative;
  width: 100%;
}

.ssi-input {
  width: 100%;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 7px;
  color: var(--text);
  font-size: 13px;
  font-family: var(--font-ui);
  padding: 9px 12px;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}
.ssi-input::placeholder { color: var(--text3); }
.ssi-input:focus { border-color: var(--accent); }

.ssi-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 8px;
  max-height: 280px;
  overflow-y: auto;
  z-index: 200;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
}

.dd-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
  border-left: 2px solid transparent;
  gap: 8px;
  transition: background 0.08s;
}
.dd-item:hover  { background: var(--surface); }
.dd-active      { background: rgba(0, 229, 160, 0.08) !important; border-left-color: var(--accent); }

.dd-main {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.dd-kode {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  color: var(--accent);
}

.dd-nama {
  font-size: 11px;
  color: var(--text2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}

.dd-sektor {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--text3);
  white-space: nowrap;
  flex-shrink: 0;
  letter-spacing: 0.5px;
}

.dd-manual {
  border-top: 1px solid var(--border);
  gap: 8px;
}
.dd-manual-icon { font-size: 13px; flex-shrink: 0; }
.dd-manual-text { font-size: 12px; color: var(--text2); }

/* Scrollbar */
.ssi-dropdown::-webkit-scrollbar       { width: 4px; }
.ssi-dropdown::-webkit-scrollbar-track { background: transparent; }
.ssi-dropdown::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

/* Dropdown transition */
.dd-enter-active, .dd-leave-active { transition: opacity 0.12s ease, transform 0.12s ease; }
.dd-enter-from, .dd-leave-to       { opacity: 0; transform: translateY(-4px); }
</style>
