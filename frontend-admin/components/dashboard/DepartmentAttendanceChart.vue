<script setup>
import { ref, onMounted } from "vue";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { BarChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  TitleComponent
} from "echarts/components";
import VChart from "vue-echarts";
import dashboardService from "~/services/dashboard.service";

use([
  CanvasRenderer,
  BarChart,
  GridComponent,
  TooltipComponent,
  TitleComponent
]);

const option = ref({});

onMounted(async () => {
  try {
    const data = await dashboardService.getDepartmentAttendance();

    option.value = {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow"
        }
      },

      grid: {
        left: "22%",
        right: "5%",
        top: "5%",
        bottom: "5%",
        containLabel: true
      },

      xAxis: {
        type: "value"
      },

      yAxis: {
        type: "category",
        data: data.map(item => item.department)
      },

      series: [
        {
          type: "bar",
          data: data.map(item => item.present),
          barWidth: 18,
          itemStyle: {
            borderRadius: [0, 8, 8, 0]
          }
        }
      ]
    };

  } catch (err) {
    console.error(err);
  }
});
</script>

<template>
  <div>
    <h3 class="text-lg font-semibold mb-4">
      Department Attendance
    </h3>

    <VChart
      :option="option"
      autoresize
      style="height:350px"
    />
  </div>
</template>