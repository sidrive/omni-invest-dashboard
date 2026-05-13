<script setup>
defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v),
  },
  fullpage: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div :class="['spinner-wrap', { 'spinner-fullpage': fullpage }]">
    <div :class="['spinner', `spinner-${size}`]" />
  </div>
</template>

<style scoped>
.spinner-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-fullpage {
  position: fixed;
  inset: 0;
  background: rgba(10, 12, 16, 0.7);
  z-index: 9999;
}

.spinner {
  border-radius: 50%;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  animation: spin 0.7s linear infinite;
}

.spinner-sm { width: 16px; height: 16px; }
.spinner-md { width: 24px; height: 24px; }
.spinner-lg { width: 40px; height: 40px; border-width: 3px; }

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
