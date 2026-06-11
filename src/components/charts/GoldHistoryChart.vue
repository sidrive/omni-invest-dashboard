<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement,
         LineElement, Filler, Tooltip } from 'chart.js'
import { useMarketStore } from '@/stores/market'
import { formatRupiah } from '@/utils/formatters'
import { buildChartOptions } from '@/utils/chartDefaults'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

const marketStore = useMarketStore()

const history    = computed(() => marketStore.goldHistory ?? [])
const goldPrice  = computed(() => marketStore.goldPrice ?? 0)
const changePct  = computed(() => marketStore.goldChangePct ?? 0)

const chartData = computed(() => {
  const prices = history.value.length > 0
    ? history.value.map(h => h.price)
    : marketStore.goldSparklineData ?? []

  const labels = history.value.length > 0
    ? history.value.map(h => h.date.slice(5))
    : prices.map((_, i) => `D-${prices.length - i}`)

  const color = '#ffd93d'
  return {
    labels,
    datasets: [{
      data: prices,
      borderColor: color,
      backgroundColor: (ctx) => {
        const canvas = ctx.chart.canvas
        const gradient = canvas.getContext('2d').createLinearGradient(0, 0, 0, 110)
        gradient.addColorStop(0, 'rgba(255,217,61,0.2)')
        gradient.addColorStop(1, 'rgba(255,217,61,0)')
        return gradient
      },
      fill: true,
    }]
  }
})

const chartOptions = buildChartOptions({
  title: (ctx) => ctx[0]?.label ?? '',
  label: (ctx) => `Rp${Number(ctx.raw).toLocaleString('id-ID')}/g`
})
</script>

<template>
  <div class="gold-chart-card">
    <div class="gc-header">
      <div class="gc-price mono">{{ formatRupiah(goldPrice) }}<span class="gc-unit">/g</span></div>
      <div :class="['gc-change mono', changePct >= 0 ? 'clr-green' : 'clr-red']">
        {{ changePct >= 0 ? '▲' : '▼' }}{{ Math.abs(changePct).toFixed(2) }}%
      </div>
      <div class="gc-tag">{{ history.length > 0 ? history.length + ' hari' : '— hari' }}</div>
    </div>
    <div class="gc-chart">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<style scoped>
.gold-chart-card {
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 14px;
}
.gc-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.gc-price { font-size: 16px; font-weight: 700; color: var(--text); }
.gc-unit  { font-size: 11px; color: var(--text3); margin-left: 2px; }
.gc-change { font-size: 12px; }
.gc-tag {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--text3);
  background: var(--surface);
  padding: 2px 6px;
  border-radius: 4px;
}
.gc-chart { height: 110px; }
.mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
.clr-green { color: var(--green); }
.clr-red   { color: var(--red); }
</style>
