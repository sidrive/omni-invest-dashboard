<script setup>
import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()

const ICONS = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
}
</script>

<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          :class="['toast', `toast-${t.type}`]"
          @click="dismiss(t.id)"
        >
          <span class="toast-icon">{{ ICONS[t.type] ?? ICONS.info }}</span>
          <span class="toast-msg">{{ t.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid;
  font-size: 13px;
  font-family: var(--font-ui);
  cursor: pointer;
  pointer-events: all;
  backdrop-filter: blur(10px);
  min-width: 240px;
  max-width: 360px;
}

.toast-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.toast-success {
  background: rgba(0, 229, 160, 0.1);
  border-color: rgba(0, 229, 160, 0.35);
  color: var(--green);
}
.toast-error {
  background: rgba(255, 71, 87, 0.1);
  border-color: rgba(255, 71, 87, 0.35);
  color: var(--red);
}
.toast-warning {
  background: rgba(255, 217, 61, 0.1);
  border-color: rgba(255, 217, 61, 0.35);
  color: var(--warn);
}
.toast-info {
  background: rgba(0, 132, 255, 0.1);
  border-color: rgba(0, 132, 255, 0.35);
  color: var(--blue);
}

/* Transition */
.toast-enter-active { transition: all 0.25s ease; }
.toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from   { opacity: 0; transform: translateX(20px); }
.toast-leave-to     { opacity: 0; transform: translateX(20px); }

@media (max-width: 768px) {
  .toast-container {
    bottom: 72px;
    right: 12px;
    left: 12px;
  }
  .toast { min-width: unset; max-width: unset; }
}
</style>
