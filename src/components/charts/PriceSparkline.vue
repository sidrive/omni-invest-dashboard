<script setup>
import { computed } from 'vue'
import { generateSparklineData } from '@/utils/calculator'

const props = defineProps({
  changePct: { type: Number, default: 0 },
  data:      { type: Array, default: null },
  width:     { type: Number, default: 60 },
  height:    { type: Number, default: 24 },
})

const points = computed(() => props.data?.length ? props.data : generateSparklineData(props.changePct))

const lineColor = computed(() => props.changePct >= 0 ? 'var(--green)' : 'var(--red)')

// Build smooth cubic bezier SVG path from data points
const svgPath = computed(() => {
  const pts = points.value
  if (!pts || pts.length < 2) return ''

  const padV = 2 // vertical padding in px
  const min = Math.min(...pts)
  const max = Math.max(...pts)
  const range = max - min || 1

  const toX = (i) => (i / (pts.length - 1)) * props.width
  const toY = (v) => props.height - padV - ((v - min) / range) * (props.height - padV * 2)

  let d = `M ${toX(0).toFixed(2)},${toY(pts[0]).toFixed(2)}`

  for (let i = 1; i < pts.length; i++) {
    const cpX = ((toX(i - 1) + toX(i)) / 2).toFixed(2)
    const y0  = toY(pts[i - 1]).toFixed(2)
    const y1  = toY(pts[i]).toFixed(2)
    const x1  = toX(i).toFixed(2)
    d += ` C ${cpX},${y0} ${cpX},${y1} ${x1},${y1}`
  }

  return d
})
</script>

<template>
  <svg
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="sparkline"
  >
    <path
      :d="svgPath"
      :stroke="lineColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
  </svg>
</template>

<style scoped>
.sparkline {
  display: block;
  flex-shrink: 0;
}
</style>
