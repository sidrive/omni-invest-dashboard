<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMarketStore } from '@/stores/market'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
})

const marketStore = useMarketStore()
const lastSync = computed(() => marketStore.lastSync)

const formattedSubtitle = computed(() => {
  if (!props.subtitle) return ''
  return props.subtitle.startsWith('//') ? props.subtitle : `// ${props.subtitle}`
})

// ── Jam WIB real-time ──
const currentTime = ref('')

function updateClock() {
  const now = new Date()
  const wib = new Date(now.getTime() + (7 * 60 * 60 * 1000))
  const h = String(wib.getUTCHours()).padStart(2, '0')
  const m = String(wib.getUTCMinutes()).padStart(2, '0')
  const s = String(wib.getUTCSeconds()).padStart(2, '0')
  currentTime.value = `${h}:${m}:${s}`
}

let clockInterval = null

onMounted(() => {
  updateClock()
  clockInterval = setInterval(updateClock, 1000)
})

onUnmounted(() => {
  clearInterval(clockInterval)
})
</script>

<template>
  <header class="topbar">
    <div class="topbar-left">
      <h1 class="topbar-title">{{ title }}</h1>
      <span v-if="formattedSubtitle" class="topbar-subtitle">{{ formattedSubtitle }}</span>
    </div>

    <div class="topbar-right">
      <span class="topbar-clock">
        <span class="clock-time">{{ currentTime }}</span>
        <span class="clock-label">WIB</span>
      </span>
      <span class="sync-info">
        <span class="sync-dot" />
        <span class="sync-label">sync {{ lastSync }}</span>
      </span>
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--border);
  background: rgba(10, 12, 16, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  position: sticky;
  top: 0;
  z-index: 50;
  gap: 12px;
}

.topbar-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.topbar-title {
  font-family: var(--font-ui);
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.topbar-subtitle {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text3);
  letter-spacing: 0.3px;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.topbar-clock {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-right: 12px;
  padding-right: 12px;
  border-right: 1px solid var(--border);
}

.clock-time {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  color: var(--text2);
  letter-spacing: 0.5px;
}

.clock-label {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text3);
  letter-spacing: 1px;
}

.sync-info {
  display: flex;
  align-items: center;
  gap: 5px;
}

.sync-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent);
  opacity: 0.7;
  flex-shrink: 0;
}

.sync-label {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text3);
  letter-spacing: 0.3px;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .topbar {
    padding: 14px 16px;
  }
  .topbar-title {
    font-size: 16px;
  }
  .sync-label {
    display: none;
  }
}
</style>
