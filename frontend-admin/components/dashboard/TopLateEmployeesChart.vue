<script setup>
import { ref, onMounted } from "vue";
import dashboardService from "~/services/dashboard.service";

const employees = ref([]);

onMounted(async () => {
  try {
    employees.value = await dashboardService.getTopLateEmployees();
  } catch (err) {
    console.error(err);
  }
});
</script>

<template>
  <div class="bars-wrap">
    <div
      v-for="item in employees"
      :key="item.name"
      class="bar-row"
    >
      <div class="bar-label">
        {{ item.name }}
      </div>

      <div class="bar-track">
        <div
          class="bar-fill"
          :style="{ width: `${item.value * 30}px` }"
        ></div>
      </div>

      <div class="bar-value">
        {{ item.value }}
      </div>
    </div>

    <div
      v-if="employees.length === 0"
      class="text-gray-500 text-center py-4"
    >
      No late employees found.
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
