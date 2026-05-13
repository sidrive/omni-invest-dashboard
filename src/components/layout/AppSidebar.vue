<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useReportStore } from '@/stores/report'

const route = useRoute()
const reportStore = useReportStore()

const signalCount = computed(() => reportStore.signalCount)

// ── Clock WIB ──
const clockStr = ref('--:--:--')
let clockTimer = null

onMounted(() => {
  const tick = () => {
    clockStr.value = new Date().toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }
  tick()
  clockTimer = setInterval(tick, 1000)
})

onUnmounted(() => clearInterval(clockTimer))

// ── Nav definition ──
const sections = [
  {
    label: 'MONITOR',
    items: [
      { icon: '⬡', label: 'Dashboard',  to: '/' },
      { icon: '◈', label: 'Portfolio',  to: '/portfolio' },
      { icon: '◎', label: 'Alerts',     to: '/alerts', badge: signalCount },
    ],
  },
  {
    label: 'ROLES',
    items: [
      { icon: '◐', label: 'Scavenger',  to: '/scavenger' },
      { icon: '◑', label: 'Analyst',    to: '/analyst' },
      { icon: '⊞', label: 'Transaksi',  to: '/transactions' },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { icon: '⚙', label: 'Settings',   to: '/settings' },
    ],
  },
]

function isActive(to) {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}
</script>

<template>
  <!-- ── Desktop sidebar ── -->
  <aside class="sidebar">
    <!-- Logo -->
    <div class="sidebar-logo">
      <span class="logo-tag">// v1.0.0</span>
      <div class="logo-name">Omni-Invest<br /><span class="logo-sub">Sentinel</span></div>
    </div>

    <!-- Nav -->
    <nav class="sidebar-nav">
      <template v-for="section in sections" :key="section.label">
        <div class="nav-section-label">{{ section.label }}</div>
        <RouterLink
          v-for="item in section.items"
          :key="item.to"
          :to="item.to"
          :class="['nav-item', { active: isActive(item.to) }]"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
          <span v-if="item.badge?.value" class="nav-badge">{{ item.badge.value }}</span>
        </RouterLink>
      </template>
    </nav>

    <!-- Footer -->
    <div class="sidebar-footer">
      <div class="footer-status">
        <span class="dot-live" />
        <span class="footer-status-text">STB ONLINE</span>
      </div>
      <div class="footer-clock">{{ clockStr }} WIB</div>
    </div>
  </aside>

</template>

<style scoped>
/* ══════════════════════════════
   DESKTOP SIDEBAR
══════════════════════════════ */
.sidebar {
  width: 220px;
  flex-shrink: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-right: 1px solid var(--glass-border);
  position: sticky;
  top: 0;
  z-index: 100;
  overflow-y: auto;
}

/* Logo */
.sidebar-logo {
  padding: 20px 18px 16px;
  border-bottom: 1px solid var(--glass-border);
}

.logo-tag {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--accent);
  opacity: 0.7;
  letter-spacing: 1px;
  display: block;
  margin-bottom: 6px;
}

.logo-name {
  font-family: var(--font-ui);
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.3;
}

.logo-sub {
  color: var(--accent);
}

/* Nav */
.sidebar-nav {
  flex: 1;
  padding: 12px 0;
  overflow-y: auto;
}

.nav-section-label {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 2px;
  color: var(--text3);
  padding: 14px 18px 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 18px;
  color: var(--text2);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  border-left: 2px solid transparent;
  transition: all 0.15s ease;
  position: relative;
}

.nav-item:hover {
  color: var(--text);
  background: rgba(255, 255, 255, 0.03);
}

.nav-item.active {
  border-left-color: var(--accent);
  background: rgba(0, 229, 160, 0.06);
  color: var(--accent);
}

.nav-icon {
  font-size: 15px;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.nav-label {
  flex: 1;
}

.nav-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  background: rgba(255, 71, 87, 0.15);
  color: var(--red);
  border: 1px solid rgba(255, 71, 87, 0.35);
  border-radius: 10px;
  padding: 1px 6px;
  min-width: 18px;
  text-align: center;
}

/* Footer */
.sidebar-footer {
  padding: 14px 18px;
  border-top: 1px solid var(--glass-border);
}

.footer-status {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 4px;
}

.dot-live {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: var(--glow-accent);
  flex-shrink: 0;
  animation: pulse-live 2s ease-in-out infinite;
}

@keyframes pulse-live {
  0%, 100% { opacity: 1; box-shadow: 0 0 6px rgba(0, 229, 160, 0.5); }
  50%       { opacity: 0.6; box-shadow: 0 0 12px rgba(0, 229, 160, 0.8); }
}

.footer-status-text {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 1.5px;
  color: var(--accent);
  font-weight: 700;
}

.footer-clock {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text3);
  letter-spacing: 0.5px;
}

@media (max-width: 768px) {
  .sidebar { display: none; }
}
</style>
