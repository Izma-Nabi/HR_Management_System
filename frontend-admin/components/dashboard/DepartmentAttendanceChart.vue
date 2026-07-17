<script setup>
import { computed } from "vue";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { BarChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  TitleComponent
} from "echarts/components";
import VChart from "vue-echarts";

use([
  CanvasRenderer,
  BarChart,
  GridComponent,
  TooltipComponent,
  TitleComponent
]);

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  }
});

const option = computed(() => ({
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
    data: props.data.map(item => item.department)
  },

  series: [
    {
      type: "bar",
      data: props.data.map(item => item.present),
      barWidth: 18,
      itemStyle: {
        borderRadius: [0, 8, 8, 0]
      }
    }
  ]
}));
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
