<script setup>

definePageMeta({
  layout: "dashboard"
});

const {
  summary,
  loading,
  error,
  fetchSummary
} = useDashboard();

onMounted(async () => {
  await fetchSummary();
});

</script>

<template>

<div class="space-y-8">

  <!-- Title -->
  <div>

    <h1 class="text-3xl font-bold text-gray-800">
      Admin Dashboard
    </h1>

    <p class="text-gray-500 mt-2">
      Attendance overview and system statistics
    </p>

  </div>

  <!-- Loading -->
  <div
    v-if="loading"
    class="bg-white rounded-xl shadow border p-8 text-center text-gray-500"
  >
    Loading dashboard...
  </div>

  <!-- Error -->
  <div
    v-else-if="error"
    class="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600"
  >
    {{ error }}
  </div>

  <!-- Summary -->
  <div class="rounded-2xl border bg-white px-4 py-3 shadow-sm">
    <div class="flex items-center gap-3 mb-3">
      <div class="h-px flex-1 bg-gray-300"></div>
      <span class="text-xs font-semibold text-gray-600 tracking-[0.2em] uppercase">Summary</span>
      <div class="h-px flex-1 bg-gray-300"></div>
    </div>
    <DashboardSummaryCards :summary="summary" />
  </div>

  <!-- Attendance Trend -->
  <div class="space-y-3">
    <div class="flex items-center gap-3">
      <div class="h-px flex-1 bg-gray-300"></div>
      <span class="text-sm font-semibold text-gray-700 whitespace-nowrap">Attendance Trend (Line Chart)</span>
      <div class="h-px flex-1 bg-gray-300"></div>
    </div>

    <div class="bg-white rounded-2xl shadow border p-6">
      

<DashboardAttendanceTrendChart />


    </div>
  </div>

  <!-- Department + Today -->
  <div class="space-y-3">
    <div class="flex items-center gap-3">
      <div class="h-px flex-1 bg-gray-300"></div>
      <span class="text-sm font-semibold text-gray-700 whitespace-nowrap">Department Attendance &amp; Today's Attendance</span>
      <div class="h-px flex-1 bg-gray-300"></div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">

      <div class="bg-white rounded-2xl shadow border p-6">
        <div class="mb-3 text-center text-sm font-semibold text-gray-700">Department Attendance</div>
        <div class="mb-2 text-center text-xs text-gray-500">Horizontal Bar</div>
        <DashboardDepartmentAttendanceChart />
      </div>

      <div class="bg-white rounded-2xl shadow border p-6">
        <div class="mb-3 text-center text-sm font-semibold text-gray-700">Today's Attendance</div>
        <div class="mb-2 text-center text-xs text-gray-500">Donut Chart</div>
        <DashboardTodayAttendanceChart />
      </div>

    </div>
  </div>

  <!-- Monthly + Late -->
  <div class="space-y-3">
    <div class="flex items-center gap-3">
      <div class="h-px flex-1 bg-gray-300"></div>
      <span class="text-sm font-semibold text-gray-700 whitespace-nowrap">Monthly Attendance &amp; Top Late Employees</span>
      <div class="h-px flex-1 bg-gray-300"></div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">

      <div class="bg-white rounded-2xl shadow border p-6">
        <div class="mb-3 text-center text-sm font-semibold text-gray-700">Monthly Attendance %</div>
        <div class="mb-2 text-center text-xs text-gray-500">Bar Chart</div>
        <DashboardMonthlyAttendanceChart />
      </div>

      <div class="bg-white rounded-2xl shadow border p-6">
        <div class="mb-3 text-center text-sm font-semibold text-gray-700">Top Late Employees</div>
        <div class="mb-2 text-center text-xs text-gray-500">Horizontal Bar</div>
        <DashboardTopLateEmployeesChart />
      </div>

    </div>
  </div>

</div>

</template>