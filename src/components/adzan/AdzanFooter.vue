<script setup>
import { formatCountdown, formatClock } from '@/utils/adzanFormat'

// phase: 'idle' -> tampilkan strip 6 waktu; 'notification' -> tampilkan
// banner countdown transparan untuk activeEvent. Fase takeover ditangani
// terpisah oleh AdzanTakeoverOverlay.vue (menutup seluruh frame, bukan
// cuma footer ini).
defineProps({
  events: { type: Array, default: () => [] },
  nextEvent: { type: Object, default: null },
  phase: { type: String, default: 'idle' },
  activeEvent: { type: Object, default: null },
  countdownRemainingMs: { type: Number, default: null },
})
</script>

<template>
  <div class="af-root">
    <transition name="af-fade" mode="out-in">
      <div v-if="phase === 'notification'" key="notif" class="af-notif">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 2a7 7 0 0 0-1 13.9V19H8v2h8v-2h-3v-3.1A7 7 0 0 0 12 2Z" fill="#e8c76f" />
        </svg>
        <div class="af-notif-text">{{ activeEvent?.label }} dalam</div>
        <div class="af-notif-countdown mono">{{ formatCountdown(countdownRemainingMs) }}</div>
      </div>
      <div v-else key="strip" class="af-strip">
        <div
          v-for="ev in events"
          :key="ev.key"
          :class="['af-segment', { 'af-segment--next': nextEvent && ev.key === nextEvent.key }]"
        >
          <div class="af-segment-label">{{ ev.label }}</div>
          <div class="af-segment-time mono">{{ formatClock(ev.time) }}</div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.mono { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }

.af-root { width: 100%; height: 100%; display: flex; align-items: center; }

.af-strip { display: flex; align-items: center; gap: 8px; width: 100%; }
.af-segment {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 7px 6px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid transparent;
}
.af-segment-label { font-size: 11px; font-weight: 600; color: #5b6b74; }
.af-segment-time { font-size: 12px; font-weight: 600; color: #8a99a1; }
.af-segment--next { background: rgba(52, 211, 153, 0.12); border-color: rgba(52, 211, 153, 0.3); }
.af-segment--next .af-segment-label { color: #34d399; }
.af-segment--next .af-segment-time { color: #e6edf3; }

.af-notif {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  background: rgba(232, 199, 111, 0.08);
  border: 1px solid rgba(232, 199, 111, 0.25);
  border-radius: 8px;
  padding: 8px 16px;
}
.af-notif-text { font-size: 12.5px; font-weight: 500; color: #e8c76f; }
.af-notif-countdown { font-size: 12.5px; font-weight: 600; color: #e8c76f; margin-left: auto; }

.af-fade-enter-active,
.af-fade-leave-active { transition: opacity 0.3s ease; }
.af-fade-enter-from,
.af-fade-leave-to { opacity: 0; }
</style>
