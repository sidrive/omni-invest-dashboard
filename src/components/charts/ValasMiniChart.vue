<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement,
         LineElement, Filler, Tooltip } from 'chart.js'
import { generateSparklineData } from '@/utils/calculator'
import { formatRupiah } from '@/utils/formatters'
import { buildChartOptions } from '@/utils/chartDefaults'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

const FLAG_MAP = { USD: '🇺🇸', SGD: '🇸🇬', EUR: '🇪🇺', JPY: '🇯🇵' }

const props = defineProps({
  code:       String,
  rate:       { type: Number, default: 0 },
  change_pct: { type: Number, default: 0 },
  status:     String,
  symbol:     String,
})

const isPositive = computed(() => props.change_pct >= 0)
const lineColor  = computed(() => isPositive.value ? '#0084ff' : '#ff4757')
const fillAlpha  = computed(() => isPositive.value ? 'rgba(0,132,255,0.1)' : 'rgba(255,71,87,0.1)')

const chartData = computed(() => {
  const points = generateSparklineData(props.change_pct, 14)
  return {
    labels: points.map((_, i) => `D-${14 - i}`),
    datasets: [{
      data: points,
      borderColor: lineColor.value,
      backgroundColor: fillAlpha.value,
      fill: true,
    }]
  }
})

const chartOptions = buildChartOptions({
  label: (ctx) => `${ctx.raw >= 0 ? '+' : ''}${Number(ctx.raw).toFixed(2)}%`
})
</script>

<template>
  <div class="vmc-card">
    <div class="vmc-header">
      <div class="vmc-left">
        <span class="vmc-code mono">{{ FLAG_MAP[code] ?? '🏳️' }} {{ code }} <span class="vmc-idr">/ IDR</span></span>
        <span class="vmc-rate mono">{{ formatRupiah(rate) }}</span>
      </div>
      <div :class="['vmc-change mono', isPositive ? 'clr-blue' : 'clr-red']">
        {{ isPositive ? '▲' : '▼' }}{{ Math.abs(change_pct).toFixed(2) }}%
      </div>
    </div>
    <div class="vmc-chart">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<style scoped>
.vmc-card {
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 12px;
}
.vmc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  gap: 8px;
}
.vmc-left  { display: flex; flex-direction: column; gap: 2px; }
.vmc-code  { font-size: 12px; font-weight: 700; color: var(--text); }
.vmc-idr   { font-size: 10px; color: var(--text3); font-weight: 400; }
.vmc-rate  { font-size: 11px; color: var(--text2); }
.vmc-change { font-size: 11px; font-weight: 600; }
.vmc-chart { height: 70px; }
.mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
.clr-blue { color: var(--blue); }
.clr-red  { color: var(--red); }
</style>
