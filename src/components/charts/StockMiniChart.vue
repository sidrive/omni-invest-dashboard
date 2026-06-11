<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement,
         LineElement, Filler, Tooltip } from 'chart.js'
import { generateSparklineData } from '@/utils/calculator'
import { formatRupiah } from '@/utils/formatters'
import { buildChartOptions } from '@/utils/chartDefaults'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

const props = defineProps({
  id:          String,
  ticker:      String,
  nama:        String,
  pl:          { type: Number, default: 0 },
  pl_pct:      { type: Number, default: 0 },
  nilai_pasar: { type: Number, default: 0 },
  change_pct:  { type: Number, default: 0 },
})

const isPositive = computed(() => props.pl >= 0)
const lineColor  = computed(() => isPositive.value ? '#00e5a0' : '#ff4757')
const fillAlpha  = computed(() => isPositive.value ? 'rgba(0,229,160,0.1)' : 'rgba(255,71,87,0.1)')
const code       = computed(() => props.ticker?.replace('.JK', '') ?? props.id)

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

const fmtPL = (n) => {
  if (!n || n === 0) return formatRupiah(0)
  return (n > 0 ? '+' : '-') + formatRupiah(Math.abs(n))
}
const fmtPct = (n) => (n > 0 ? '+' : '') + Number(n).toFixed(2) + '%'
</script>

<template>
  <div class="smc-card">
    <div class="smc-header">
      <div class="smc-left">
        <span class="smc-code mono clr-accent">{{ code }}</span>
        <span class="smc-nama">{{ nama }}</span>
      </div>
      <div :class="['smc-pl mono', isPositive ? 'clr-green' : 'clr-red']">
        {{ fmtPL(pl) }}<span class="smc-pct"> ({{ fmtPct(pl_pct) }})</span>
      </div>
    </div>
    <div class="smc-chart">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<style scoped>
.smc-card {
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 12px;
}
.smc-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8px;
  gap: 8px;
}
.smc-left  { display: flex; flex-direction: column; gap: 1px; }
.smc-code  { font-size: 12px; font-weight: 700; }
.smc-nama  { font-size: 10px; color: var(--text3); }
.smc-pl    { font-size: 11px; font-weight: 600; text-align: right; }
.smc-pct   { font-size: 10px; font-weight: 400; }
.smc-chart { height: 70px; }
.mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
.clr-green  { color: var(--green); }
.clr-red    { color: var(--red); }
.clr-accent { color: var(--accent); }
</style>
