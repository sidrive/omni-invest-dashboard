<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: String, default: '--' },
  prefix: { type: String, default: '' },
  change: { type: String, default: '' },
  changeLabel: { type: String, default: '' },
  isPositive: { type: Boolean, default: null },
  variant: {
    type: String,
    default: 'default',
    validator: (v) => ['default', 'accent', 'danger', 'warn', 'blue'].includes(v),
  },
})
</script>

<template>
  <div :class="['stat-card', `stat-card--${variant}`]">
    <div class="stat-label">{{ label }}</div>
    <div class="stat-value-row">
      <span v-if="prefix" class="stat-prefix">{{ prefix }}</span>
      <span class="stat-value">{{ value }}</span>
    </div>
    <div
      v-if="change"
      :class="['stat-change', isPositive === true ? 'pos' : isPositive === false ? 'neg' : '']"
    >
      {{ change }}<span v-if="changeLabel" class="change-label"> {{ changeLabel }}</span>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  background: var(--bg3);
  border: 1px solid var(--border);
  border-left: 3px solid transparent;
  border-radius: 10px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: box-shadow 0.2s ease;
}

/* ── Variant border + glow ── */
.stat-card--accent {
  border-left-color: var(--accent);
  box-shadow: -2px 0 12px rgba(0, 229, 160, 0.15);
}
.stat-card--danger {
  border-left-color: var(--danger);
  box-shadow: -2px 0 12px rgba(255, 71, 87, 0.15);
}
.stat-card--warn {
  border-left-color: var(--warn);
  box-shadow: -2px 0 12px rgba(255, 217, 61, 0.12);
}
.stat-card--blue {
  border-left-color: var(--blue);
  box-shadow: -2px 0 12px rgba(0, 132, 255, 0.15);
}
.stat-card--default {
  border-left-color: var(--border);
}

/* ── Label ── */
.stat-label {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 2px;
  color: var(--text3);
  text-transform: uppercase;
}

/* ── Value ── */
.stat-value-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.stat-prefix {
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 700;
  color: var(--text2);
  font-variant-numeric: tabular-nums;
}

.stat-value {
  font-family: var(--font-mono);
  font-size: clamp(20px, 5vw, 28px);
  font-weight: 700;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

/* ── Change ── */
.stat-change {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text3);
  font-variant-numeric: tabular-nums;
}
.stat-change.pos { color: var(--green); }
.stat-change.neg { color: var(--red); }

.change-label {
  font-size: 10px;
  color: var(--text3);
}

@media (max-width: 768px) {
  .stat-card { padding: 12px 14px; gap: 4px; }
  .stat-value { font-size: 20px; }
  .stat-prefix { font-size: 13px; }
  .stat-change { font-size: 10px; }
}
</style>
