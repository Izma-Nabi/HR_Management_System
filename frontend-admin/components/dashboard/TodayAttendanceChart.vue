<script setup>
const present = 76;
const absent = 24;
</script>

<template>
  <div class="donut-layout">
    <div class="donut-chart" :style="{ background: `conic-gradient(#16a34a 0 ${present}%, #ef4444 ${present}% 100%)` }">
      <div class="donut-inner">
        <div class="donut-value">{{ present }}%</div>
        <div class="donut-text">Present</div>
      </div>
    </div>
    <div class="donut-legend">
      <div class="legend-item"><span class="dot present"></span> Present {{ present }}%</div>
      <div class="legend-item"><span class="dot absent"></span> Absent {{ absent }}%</div>
    </div>
  </div>
</template>

<style scoped>
.donut-layout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}
.donut-chart {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.donut-inner {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.donut-value {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}
.donut-text {
  font-size: 12px;
  color: #6b7280;
}
.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
  color: #374151;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
.present {
  background: #16a34a;
}
.absent {
  background: #ef4444;
}
</style>
