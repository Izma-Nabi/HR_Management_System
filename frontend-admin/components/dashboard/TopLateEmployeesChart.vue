<script setup>
const employees = [
  { name: 'Ali', value: 18 },
  { name: 'Sara', value: 14 },
  { name: 'Nadia', value: 11 },
  { name: 'Hamza', value: 9 }
];
</script>

<template>
  <div class="bars-wrap">
    <div v-for="item in employees" :key="item.name" class="bar-row">
      <div class="bar-label">{{ item.name }}</div>
      <div class="bar-track">
        <div class="bar-fill" :style="{ width: item.value * 4 + 'px' }"></div>
      </div>
      <div class="bar-value">{{ item.value }}</div>
    </div>
  </div>
</template>

<style scoped>
.bars-wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.bar-row {
  display: grid;
  grid-template-columns: 70px 1fr 40px;
  align-items: center;
  gap: 10px;
}
.bar-label,
.bar-value {
  font-size: 12px;
  color: #4b5563;
}
.bar-track {
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
  height: 12px;
}
.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #f59e0b, #fcd34d);
  border-radius: 999px;
}
</style>
