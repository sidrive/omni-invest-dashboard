<script setup>
import { provide } from 'vue'
import { RouterView } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppBottomNav from '@/components/layout/AppBottomNav.vue'
import ToastNotif from '@/components/ui/ToastNotif.vue'
import StbDashboardView from '@/views/stb/StbDashboardView.vue'
import ViewportDebugBadge from '@/components/ui/ViewportDebugBadge.vue'
import { useToast } from '@/composables/useToast'
import { useSTBMode } from '@/composables/useSTBMode'

const { showToast } = useToast()
// Provide for components that prefer inject('showToast')
provide('showToast', showToast)

// STB/kiosk (1024x768, tanpa mouse/keyboard) mengganti seluruh layout dengan
// tampilan 2-panel statis — tidak lewat router, murni deteksi viewport
// on-mount/on-resize sesuai design handoff.
const { isSTB } = useSTBMode()
</script>

<template>
  <StbDashboardView v-if="isSTB" />
  <div v-else class="app-layout">
    <AppSidebar />
    <main class="app-main">
      <RouterView />
    </main>
    <AppBottomNav />
    <ToastNotif />
  </div>
  <!-- TEMP DEBUG: lihat komentar di ViewportDebugBadge.vue -->
  <ViewportDebugBadge />
</template>

<style>
/* ── CSS Custom Properties ── */
:root {
  /* Backgrounds */
  --bg:      #0a0c10;
  --bg2:     #0f1219;
  --bg3:     #151a24;
  --surface: #1a2133;
  --border:  #232d42;

  /* Accent colors */
  --accent:  #00e5a0;
  --blue:    #0084ff;
  --orange:  #ff6b35;
  --warn:    #ffd93d;
  --danger:  #ff4757;

  /* Text */
  --text:    #e8edf5;
  --text2:   #8899bb;
  --text3: #FFFFFF;

  /* Semantic */
  --green:   #00e5a0;
  --red:     #ff4757;

  /* Glassmorphism */
  --glass-bg:     rgba(26, 33, 51, 0.7);
  --glass-border: rgba(255, 255, 255, 0.06);
  --glass-blur:   blur(10px);

  /* Glow effects */
  --glow-accent: 0 0 12px rgba(0, 229, 160, 0.4);
  --glow-blue:   0 0 12px rgba(0, 132, 255, 0.4);
  --glow-red:    0 0 12px rgba(255, 71, 87, 0.4);
  --glow-warn:   0 0 12px rgba(255, 217, 61, 0.4);

  /* Fonts */
  --font-ui:   'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Courier New', monospace;
}

/* ── Reset ── */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body,
#app {
  height: 100%;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-ui);
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  /* Prevent body scroll — each pane scrolls independently */
  overflow: hidden;
}

/* Background grid — "terminal / trading system" feel */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 229, 160, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 229, 160, 0.02) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
  z-index: 0;
}

/* ── Layout ── */
.app-layout {
  display: flex;
  height: 100%;
  position: relative;
}

.app-main {
  flex: 1;
  min-width: 0;   /* prevent flex child from overflowing */
  height: 100%;
  overflow-y: auto;
  position: relative;
  z-index: 1;
}

@media (max-width: 768px) {
  body { overflow: hidden; }
  .app-main { padding-bottom: 60px; }
}

/* ── Global utility classes ── */
.text-green  { color: var(--green); }
.text-red    { color: var(--red); }
.text-muted  { color: var(--text3); }
.text-accent { color: var(--accent); }
.text-warn   { color: var(--warn); }
.text-blue   { color: var(--blue); }
.text-orange { color: var(--orange); }

.mono    { font-family: var(--font-mono); }
.tabular { font-variant-numeric: tabular-nums; }

/* ── Scrollbar ── */
::-webkit-scrollbar        { width: 6px; height: 6px; }
::-webkit-scrollbar-track  { background: var(--bg2); }
::-webkit-scrollbar-thumb  { background: var(--border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--text3); }
</style>
