<script setup>
const months = [
  { label: 'Jan', value: 72 },
  { label: 'Feb', value: 78 },
  { label: 'Mar', value: 82 },
  { label: 'Apr', value: 88 },
  { label: 'May', value: 79 },
  { label: 'Jun', value: 91 }
];
</script>

<template>
  <div class="bars-wrap">
    <div class="chart-grid">
      <div v-for="item in months" :key="item.label" class="bar-col">
        <div class="bar-value-label">{{ item.value }}%</div>
        <div class="bar-bg">
          <div class="bar-fill" :style="{ height: item.value + '%' }"></div>
        </div>
        <div class="bar-label">{{ item.label }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
  align-items: end;
  height: 230px;
}
.bar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.bar-value-label {
  font-size: 11px;
  color: #374151;
  font-weight: 600;
}
.bar-bg {
  width: 100%;
  height: 170px;
  background: #f3f4f6;
  border-radius: 10px;
  padding: 4px;
  display: flex;
  align-items: flex-end;
}
.bar-fill {
  width: 100%;
  background: linear-gradient(180deg, #38bdf8, #2563eb);
  border-radius: 8px;
}
.bar-label {
  font-size: 12px;
  color: #6b7280;
}
</style>
