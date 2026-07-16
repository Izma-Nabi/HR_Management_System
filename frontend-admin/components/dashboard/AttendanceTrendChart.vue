<script setup>
import { ref, onMounted } from "vue";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent
} from "echarts/components";
import VChart from "vue-echarts";
import dashboardService from "~/services/dashboard.service";

use([
  CanvasRenderer,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent
]);

const option = ref({});

onMounted(async () => {
  try {
    const data = await dashboardService.getAttendanceTrend();

    option.value = {
      tooltip: {
        trigger: "axis"
      },

      grid: {
        left: "5%",
        right: "5%",
        top: "10%",
        bottom: "10%",
        containLabel: true
      },

      xAxis: {
        type: "category",
        data: data.map(item => item.date),
        boundaryGap: false
      },

      yAxis: {
        type: "value"
      },

      series: [
        {
          name: "Attendance",
          type: "line",
          smooth: true,
          data: data.map(item => item.count),
          areaStyle: {},
          lineStyle: {
            width: 4
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
      Attendance Trend
    </h3>

    <VChart
      :option="option"
      autoresize
      style="height:350px"
    />
  </div>
</template>