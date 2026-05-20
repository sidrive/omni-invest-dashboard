<script setup>
import { computed } from 'vue'
import { generateSparklineData } from '@/utils/calculator'

const uid = Math.random().toString(36).slice(2, 7)

const props = defineProps({
  changePct: { type: Number, default: 0 },
  data:      { type: Array,  default: null },
  width:     { type: Number, default: 100 },
  height:    { type: Number, default: 40 },
})

const lineColor = computed(() =>
  (props.changePct ?? 0) >= 0 ? 'var(--green)' : 'var(--red)',
)

const pts = computed(() =>
  props.data?.length >= 2 ? props.data : generateSparklineData(props.changePct ?? 0),
)

function toCoords(raw) {
  const pad = 4
  const min = Math.min(...raw)
  const max = Math.max(...raw)
  const range = max - min || 0.001
  const w = props.width - pad * 2
  const h = props.height - pad * 2
  return raw.map((v, i) => ({
    x: (i / (raw.length - 1)) * w + pad,
    y: props.height - pad - ((v - min) / range) * h,
  }))
}

// Cubic bezier line path
const linePath = computed(() => {
  const raw = pts.value
  if (!raw || raw.length < 2) return ''
  const coords = toCoords(raw)
  let d = `M ${coords[0].x.toFixed(2)},${coords[0].y.toFixed(2)}`
  for (let i = 1; i < coords.length; i++) {
    const cpX = ((coords[i - 1].x + coords[i].x) / 2).toFixed(2)
    d += ` C ${cpX},${coords[i - 1].y.toFixed(2)} ${cpX},${coords[i].y.toFixed(2)} ${coords[i].x.toFixed(2)},${coords[i].y.toFixed(2)}`
  }
  return d
})

// Closed area path for gradient fill
const areaPath = computed(() => {
  if (!linePath.value) return ''
  const raw = pts.value
  const coords = toCoords(raw)
  const bottom = props.height
  const x0 = coords[0].x.toFixed(2)
  const xN = coords[coords.length - 1].x.toFixed(2)
  return `${linePath.value} L ${xN},${bottom} L ${x0},${bottom} Z`
})
</script>

<template>
  <svg
    v-if="linePath"
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    class="sparkline"
  >
    <defs>
      <linearGradient :id="`grad-${uid}`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   :stop-color="lineColor" stop-opacity="0.18" />
        <stop offset="100%" :stop-color="lineColor" stop-opacity="0" />
      </linearGradient>
    </defs>

    <!-- Gradient area fill -->
    <path
      v-if="areaPath"
      :d="areaPath"
      :fill="`url(#grad-${uid})`"
    />

    <!-- Line -->
    <path
      :d="linePath"
      fill="none"
      :stroke="lineColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<style scoped>
.sparkline {
  display: block;
  flex-shrink: 0;
  overflow: visible;
}
</style>
