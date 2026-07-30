<script setup>
definePageMeta({
  layout: "dashboard"
});

const router = useRouter();

const {
  sections,
  dashboard,
  loading,
  error,
  fetchDashboard
} = useDashboard();

const roleKey = computed(() =>
  String(dashboard.value?.user?.role || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_")
);

const mode = computed(() => {
  if (sections.value.systemSummary) {
    return "system";
  }

  if (sections.value.teamAttendance) {
    return "team";
  }

  if (sections.value.employeeAttendance) {
    return "own";
  }

  return "empty";
});

const dashboardTitle = computed(() => {
  if (mode.value === "team") {
    return "Team Dashboard";
  }

  if (mode.value === "own") {
    return "My Dashboard";
  }

  return "Admin Dashboard";
});

const dashboardDescription = computed(() => {
  if (mode.value === "team") {
    return "Assigned team attendance overview";
  }

  if (mode.value === "own") {
    return "Your live attendance overview";
  }

  return "Attendance overview and system statistics";
});

const primarySummary = computed(() =>
  sections.value.systemSummary ||
  sections.value.teamAttendance?.summary ||
  {}
);

const attendanceTrend = computed(() =>
  sections.value.attendanceTrend ||
  sections.value.teamAttendance?.attendanceTrend ||
  []
);

const departmentAttendance = computed(() =>
  sections.value.departmentAttendance ||
  sections.value.teamAttendance?.departmentAttendance ||
  []
);

const topLateEmployees = computed(() =>
  sections.value.topLateEmployees ||
  sections.value.teamAttendance?.topLateEmployees ||
  []
);

const recentAttendance = computed(() =>
  sections.value.teamAttendance?.recentAttendance ||
  sections.value.recentAttendance ||
  []
);

let dashboardRefreshTimer = null;

onMounted(async () => {
  await fetchDashboard();

  if (roleKey.value === "EMPLOYEE") {
    await router.replace("/dashboard/employees");
    return;
  }

  dashboardRefreshTimer = window.setInterval(() => {
    fetchDashboard({ silent: true });
  }, 30000);
});

onUnmounted(() => {
  if (dashboardRefreshTimer) {
    window.clearInterval(dashboardRefreshTimer);
  }
});
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-3xl font-bold text-gray-800">
        {{ dashboardTitle }}
      </h1>

      <p class="text-gray-500 mt-2">
        {{ dashboardDescription }}
      </p>
    </div>

    <div
      v-if="loading"
      class="bg-white rounded-xl shadow border p-8 text-center text-gray-500"
    >
      Loading dashboard...
    </div>

    <div
      v-else-if="error"
      class="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600"
    >
      {{ error }}
    </div>

    <div
      v-else-if="mode === 'empty'"
      class="bg-white rounded-xl shadow border p-8 text-center text-gray-500"
    >
      No dashboard sections are available for this account.
    </div>

    <template v-else>
      <div
        v-if="mode !== 'own'"
        class="rounded-2xl border bg-white px-4 py-3 shadow-sm"
      >
        <div class="flex items-center gap-3 mb-3">
          <div class="h-px flex-1 bg-gray-300"></div>
          <span class="text-xs font-semibold text-gray-600 tracking-[0.2em] uppercase">
            Summary
          </span>
          <div class="h-px flex-1 bg-gray-300"></div>
        </div>

        <DashboardSummaryCards :summary="primarySummary" />
      </div>

      <div
        v-if="mode !== 'own'"
        class="space-y-3"
      >
        <div class="flex items-center gap-3">
          <div class="h-px flex-1 bg-gray-300"></div>
          <span class="text-sm font-semibold text-gray-700 whitespace-nowrap">
            Attendance Trend
          </span>
          <div class="h-px flex-1 bg-gray-300"></div>
        </div>

        <div class="bg-white rounded-2xl shadow border p-6">
          <DashboardAttendanceTrendChart :data="attendanceTrend" />
        </div>
      </div>

      <div
        v-if="mode !== 'own'"
        class="space-y-3"
      >
        <div class="flex items-center gap-3">
          <div class="h-px flex-1 bg-gray-300"></div>
          <span class="text-sm font-semibold text-gray-700 whitespace-nowrap">
            Department Attendance &amp; Today's Attendance
          </span>
          <div class="h-px flex-1 bg-gray-300"></div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div class="bg-white rounded-2xl shadow border p-6">
            <div class="mb-3 text-center text-sm font-semibold text-gray-700">
              Department Attendance
            </div>
            <DashboardDepartmentAttendanceChart :data="departmentAttendance" />
          </div>

          <div class="bg-white rounded-2xl shadow border p-6">
            <div class="mb-3 text-center text-sm font-semibold text-gray-700">
              Today's Attendance
            </div>
            <DashboardTodayAttendanceChart :summary="primarySummary" />
          </div>
        </div>
      </div>

      <div
        v-if="mode !== 'own'"
        class="space-y-3"
      >
        <div class="flex items-center gap-3">
          <div class="h-px flex-1 bg-gray-300"></div>
          <span class="text-sm font-semibold text-gray-700 whitespace-nowrap">
            Monthly Attendance &amp; Top Late Employees
          </span>
          <div class="h-px flex-1 bg-gray-300"></div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div class="bg-white rounded-2xl shadow border p-6">
            <div class="mb-3 text-center text-sm font-semibold text-gray-700">
              Monthly Attendance %
            </div>
            <DashboardMonthlyAttendanceChart />
          </div>

          <div class="bg-white rounded-2xl shadow border p-6">
            <div class="mb-3 text-center text-sm font-semibold text-gray-700">
              Top Late Employees
            </div>
            <DashboardTopLateEmployeesChart :employees="topLateEmployees" />
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <div class="h-px flex-1 bg-gray-300"></div>
          <span class="text-sm font-semibold text-gray-700 whitespace-nowrap">
            Recent Attendance
          </span>
          <div class="h-px flex-1 bg-gray-300"></div>
        </div>

        <div class="bg-white rounded-2xl shadow border overflow-hidden">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50 text-gray-600">
              <tr>
                <th class="text-left px-4 py-3 font-semibold">Date</th>
                <th class="text-left px-4 py-3 font-semibold">Name</th>
                <th class="text-left px-4 py-3 font-semibold">Department</th>
                <th class="text-left px-4 py-3 font-semibold">Event</th>
                <th class="text-left px-4 py-3 font-semibold">Time</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in recentAttendance"
                :key="item.id"
                class="border-t"
              >
                <td class="px-4 py-3 text-gray-700">
                  {{ item.attendanceDate }}
                </td>
                <td class="px-4 py-3 text-gray-700">
                  {{ item.fullName }}
                </td>
                <td class="px-4 py-3 text-gray-700">
                  {{ item.department }}
                </td>
                <td class="px-4 py-3 font-semibold text-gray-800">
                  {{ item.status?.replaceAll("_", " ") }}
                </td>
                <td class="px-4 py-3 text-gray-700">
                  {{ item.checkIn || item.checkOut || "-" }}
                </td>
              </tr>
              <tr v-if="recentAttendance.length === 0">
                <td
                  class="px-4 py-6 text-center text-gray-500"
                  colspan="5"
                >
                  No attendance records found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
