<script setup>
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useReportStore } from '@/stores/report'

const route = useRoute()
const reportStore = useReportStore()
const signalCount = computed(() => reportStore.signalCount)

const items = [
  { icon: '⬡', label: 'Home',      to: '/' },
  { icon: '◈', label: 'Portfolio', to: '/portfolio' },
  { icon: '◎', label: 'Alerts',    to: '/alerts', badge: signalCount },
  { icon: '⊞', label: 'Transaksi', to: '/transactions' },
  { icon: '⚙', label: 'Settings',  to: '/settings' },
]

function isActive(to) {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}
</script>

<template>
  <nav class="bottom-nav" aria-label="Navigation">
    <RouterLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      :class="['bnav-item', { active: isActive(item.to) }]"
    >
      <span class="bnav-icon">{{ item.icon }}</span>
      <span v-if="item.badge?.value" class="bnav-badge">{{ item.badge.value }}</span>
      <span class="bnav-label">{{ item.label }}</span>
      <span v-if="isActive(item.to)" class="bnav-dot" />
    </RouterLink>
  </nav>
</template>

<style scoped>
/* Hidden on desktop — only visible via media query */
.bottom-nav { display: none; }

@media (max-width: 768px) {
  .bottom-nav {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border-top: 1px solid var(--glass-border);
    z-index: 200;
    align-items: stretch;
  }

  .bnav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    text-decoration: none;
    color: var(--text3);
    position: relative;
    min-height: 44px;
    transition: color 0.15s;
  }

  .bnav-item.active { color: var(--accent); }

  .bnav-icon {
    font-size: 18px;
    line-height: 1;
  }

  .bnav-label {
    font-size: 9px;
    font-family: var(--font-mono);
    letter-spacing: 0.5px;
  }

  .bnav-dot {
    position: absolute;
    bottom: 5px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--accent);
  }

  .bnav-badge {
    position: absolute;
    top: 6px;
    right: calc(50% - 16px);
    background: var(--red);
    color: #fff;
    font-size: 8px;
    font-family: var(--font-mono);
    font-weight: 700;
    border-radius: 8px;
    padding: 1px 4px;
    min-width: 14px;
    text-align: center;
    line-height: 1.4;
  }
}
</style>
