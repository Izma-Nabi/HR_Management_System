<script setup>
import { ref, computed, onMounted } from "vue";
import dashboardService from "~/services/dashboard.service";

const total = ref(0);
const present = ref(0);
const absent = ref(0);
const late = ref(0);
const leave = ref(0);

const presentPercent = computed(() =>
  total.value ? Math.round((present.value / total.value) * 100) : 0
);

const absentPercent = computed(() =>
  total.value ? Math.round((absent.value / total.value) * 100) : 0
);

const latePercent = computed(() =>
  total.value ? Math.round((late.value / total.value) * 100) : 0
);

const leavePercent = computed(() =>
  total.value ? Math.round((leave.value / total.value) * 100) : 0
);

const chartStyle = computed(() => ({
  background: `conic-gradient(
    #16a34a 0% ${presentPercent.value}%,
    #f59e0b ${presentPercent.value}% ${presentPercent.value + latePercent.value}%,
    #ef4444 ${presentPercent.value + latePercent.value}% ${
      presentPercent.value + latePercent.value + absentPercent.value
    }%,
    #3b82f6 ${
      presentPercent.value + latePercent.value + absentPercent.value
    }% 100%
  )`
}));

onMounted(async () => {
  try {
    const summary = await dashboardService.getDashboardSummary();

    total.value = summary.total;
    present.value = summary.present;
    absent.value = summary.absent;
    late.value = summary.late;
    leave.value = summary.leave;
  } catch (err) {
    console.error(err);
  }
});
</script>

<template>
  <div class="donut-layout">
    <div
      class="donut-chart"
      :style="chartStyle"
    >
      <div class="donut-inner">
        <div class="donut-value">
          {{ total }}
        </div>

        <div class="donut-text">
          Today
        </div>
      </div>
    </div>

    <div class="donut-legend">
      <div class="legend-item">
        <span class="dot present"></span>
        Present {{ present }} ({{ presentPercent }}%)
      </div>

      <div class="legend-item">
        <span class="dot late"></span>
        Late {{ late }} ({{ latePercent }}%)
      </div>

      <div class="legend-item">
        <span class="dot absent"></span>
        Absent {{ absent }} ({{ absentPercent }}%)
      </div>

      <div class="legend-item">
        <span class="dot leave"></span>
        Leave {{ leave }} ({{ leavePercent }}%)
      </div>
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
.late {
  background: #f59e0b;
}

.leave {
  background: #3b82f6;
}
</style>
