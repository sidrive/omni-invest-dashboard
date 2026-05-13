<script setup>
defineProps({
  signal: { type: String, required: true },
})

// Normalize to CSS class key
function signalClass(s) {
  const map = {
    BUY:      'buy',
    SELL:     'sell',
    HOLD:     'hold',
    AVG_DOWN: 'avg-down',
    DCA:      'dca',
    STOPLOSS: 'stoploss',
  }
  return map[s?.toUpperCase()] ?? 'hold'
}
</script>

<template>
  <span :class="['signal-badge', `signal-${signalClass(signal)}`]">
    {{ signal }}
  </span>
</template>

<style scoped>
.signal-badge {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 3px 10px;
  border-radius: 20px;
  text-transform: uppercase;
  border: 1px solid transparent;
  white-space: nowrap;
}

.signal-buy {
  background: rgba(0, 229, 160, 0.12);
  color: var(--green);
  border-color: rgba(0, 229, 160, 0.4);
  box-shadow: 0 0 8px rgba(0, 229, 160, 0.2);
}

.signal-avg-down {
  background: rgba(0, 132, 255, 0.12);
  color: var(--blue);
  border-color: rgba(0, 132, 255, 0.4);
  box-shadow: 0 0 8px rgba(0, 132, 255, 0.2);
}

.signal-sell {
  background: rgba(255, 71, 87, 0.12);
  color: var(--red);
  border-color: rgba(255, 71, 87, 0.4);
  box-shadow: 0 0 8px rgba(255, 71, 87, 0.2);
}

.signal-hold {
  background: rgba(255, 217, 61, 0.1);
  color: var(--warn);
  border-color: rgba(255, 217, 61, 0.4);
  box-shadow: 0 0 8px rgba(255, 217, 61, 0.15);
}

.signal-dca {
  background: rgba(255, 107, 53, 0.1);
  color: var(--orange);
  border-color: rgba(255, 107, 53, 0.4);
  box-shadow: 0 0 6px rgba(255, 107, 53, 0.15);
}

.signal-stoploss {
  background: rgba(255, 71, 87, 0.2);
  color: var(--red);
  border-color: var(--red);
  box-shadow: 0 0 10px rgba(255, 71, 87, 0.35);
  animation: pulse-danger 1.5s ease-in-out infinite;
}

@keyframes pulse-danger {
  0%, 100% { box-shadow: 0 0 8px rgba(255, 71, 87, 0.3); }
  50%       { box-shadow: 0 0 18px rgba(255, 71, 87, 0.65); }
}
</style>
