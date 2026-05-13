<script setup>
defineProps({
  role: { type: String, required: true },
})

function roleClass(r) {
  const map = {
    scavenger: 'scavenger',
    analyst:   'analyst',
    messenger: 'messenger',
    auditor:   'auditor',
  }
  return map[r?.toLowerCase()] ?? 'scavenger'
}
</script>

<template>
  <span :class="['role-badge', `role-${roleClass(role)}`]">
    {{ role }}
  </span>
</template>

<style scoped>
.role-badge {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  border: 1px solid transparent;
}

.role-scavenger {
  background: rgba(0, 132, 255, 0.12);
  color: var(--blue);
  border-color: rgba(0, 132, 255, 0.3);
}

.role-analyst {
  background: rgba(0, 229, 160, 0.1);
  color: var(--accent);
  border-color: rgba(0, 229, 160, 0.3);
}

.role-messenger {
  background: rgba(255, 107, 53, 0.1);
  color: var(--orange);
  border-color: rgba(255, 107, 53, 0.3);
}

.role-auditor {
  background: rgba(255, 217, 61, 0.1);
  color: var(--warn);
  border-color: rgba(255, 217, 61, 0.3);
}
</style>
