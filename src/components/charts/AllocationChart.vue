<script setup>
import { computed } from 'vue'

const props = defineProps({
  aktual: {
    type: Object,
    default: () => ({ emas: 0, saham: 0, reksadana: 0 }),
  },
  target: {
    type: Object,
    default: () => ({ emas: 25, saham: 50, reksadana: 25 }),
  },
})

const rows = computed(() => [
  {
    key:     'emas',
    label:   'Emas',
    icon:    '🥇',
    actual:  props.aktual?.emas ?? 0,
    target:  props.target?.emas ?? 25,
    barClass: 'bar-emas',
  },
  {
    key:     'saham',
    label:   'Saham',
    icon:    '📈',
    actual:  props.aktual?.saham ?? 0,
    target:  props.target?.saham ?? 50,
    barClass: 'bar-saham',
  },
  {
    key:     'reksadana',
    label:   'Reksa Dana',
    icon:    '🏦',
    actual:  props.aktual?.reksadana ?? 0,
    target:  props.target?.reksadana ?? 25,
    barClass: 'bar-reksa',
  },
])

function isOver(row) {
  return row.actual > row.target
}

function barWidth(row) {
  // Cap at 100% visually, but still show the real number in text
  return Math.min((row.actual / 100) * 100, 100) + '%'
}
</script>

<template>
  <div class="alloc-chart">
    <div v-for="row in rows" :key="row.key" class="alloc-row">
      <!-- Label row -->
      <div class="alloc-meta">
        <span class="alloc-label">
          {{ row.icon }} {{ row.label }}
          <span v-if="isOver(row)" class="over-icon">⚠</span>
        </span>
        <span class="alloc-numbers">
          <span :class="['alloc-actual', isOver(row) ? 'text-warn' : 'text-accent']">
            {{ row.actual.toFixed(1) }}%
          </span>
          <span class="alloc-sep">/</span>
          <span class="alloc-target">{{ row.target }}%</span>
        </span>
      </div>

      <!-- Track + bar -->
      <div class="alloc-track">
        <!-- Target marker -->
        <div
          class="alloc-target-marker"
          :style="{ left: `${Math.min(row.target, 100)}%` }"
        />
        <!-- Fill bar -->
        <div
          :class="['alloc-bar', row.barClass, isOver(row) ? 'bar-over' : '']"
          :style="{ width: barWidth(row) }"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.alloc-chart {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.alloc-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.alloc-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alloc-label {
  font-size: 13px;
  font-family: var(--font-ui);
  color: var(--text2);
  display: flex;
  align-items: center;
  gap: 5px;
}

.over-icon {
  color: var(--warn);
  font-size: 12px;
}

.alloc-numbers {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.alloc-actual {
  font-weight: 700;
}

.text-accent { color: var(--accent); }
.text-warn   { color: var(--warn); }

.alloc-sep   { color: var(--text3); }
.alloc-target { color: var(--text3); }

/* Track */
.alloc-track {
  height: 6px;
  background: var(--surface);
  border-radius: 3px;
  position: relative;
  overflow: visible;
}

/* Target dashed marker */
.alloc-target-marker {
  position: absolute;
  top: -3px;
  bottom: -3px;
  width: 2px;
  background: var(--border);
  border-radius: 1px;
  transform: translateX(-50%);
  z-index: 2;
}

/* Fill bars */
.alloc-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.8s ease-out;
  position: relative;
  z-index: 1;
}

.bar-emas  { background: linear-gradient(90deg, var(--warn), #ff9f43); }
.bar-saham { background: linear-gradient(90deg, var(--blue), var(--accent)); }
.bar-reksa { background: linear-gradient(90deg, #a29bfe, #6c5ce7); }

/* Over-target: desaturate bar, show warn tint */
.bar-over  { filter: saturate(0.6) brightness(1.1); }
</style>
