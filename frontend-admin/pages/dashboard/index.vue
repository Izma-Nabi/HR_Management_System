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
  <div class="dashboard-page">
    <header class="overview-hero">
      <div>
        <span class="overview-eyebrow">
          <span class="live-dot"></span>
          Live workforce overview
        </span>
        <h1>{{ dashboardTitle }}</h1>
        <p>{{ dashboardDescription }}</p>
      </div>

      <div class="refresh-note">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M20 11a8 8 0 1 0-2.3 5.7" />
          <path d="M20 4v7h-7" />
        </svg>
        <span><strong>Auto refresh</strong>Every 30 seconds</span>
      </div>
    </header>

    <div v-if="loading" class="dashboard-state">
      <span class="state-spinner"></span>
      <p>Preparing your workforce overview...</p>
    </div>

    <div v-else-if="error" class="dashboard-state dashboard-state--error">
      <strong>Dashboard unavailable</strong>
      <p>{{ error }}</p>
    </div>

    <div v-else-if="mode === 'empty'" class="dashboard-state">
      <strong>No dashboard sections available</strong>
      <p>Your role does not currently include dashboard reporting.</p>
    </div>

    <template v-else>
      <section v-if="mode !== 'own'" class="overview-section">
        <div class="section-heading">
          <div>
            <span>Today at a glance</span>
            <h2>Workforce summary</h2>
          </div>
          <p>Live headcount and attendance signals</p>
        </div>
        <DashboardSummaryCards :summary="primarySummary" />
      </section>

      <section v-if="mode !== 'own'" class="chart-grid chart-grid--feature">
        <article class="chart-card chart-card--wide">
          <div class="chart-heading">
            <div>
              <span>7-day movement</span>
              <h3>Attendance trend</h3>
            </div>
            <span class="chart-tag">Weekly</span>
          </div>
          <DashboardAttendanceTrendChart :data="attendanceTrend" />
        </article>

        <article class="chart-card">
          <div class="chart-heading">
            <div>
              <span>Distribution</span>
              <h3>Today’s attendance</h3>
            </div>
          </div>
          <DashboardTodayAttendanceChart :summary="primarySummary" />
        </article>
      </section>

      <section v-if="mode !== 'own'" class="chart-grid">
        <article class="chart-card">
          <div class="chart-heading">
            <div>
              <span>Team health</span>
              <h3>Department attendance</h3>
            </div>
          </div>
          <DashboardDepartmentAttendanceChart :data="departmentAttendance" />
        </article>

        <article class="chart-card">
          <div class="chart-heading">
            <div>
              <span>Monthly signal</span>
              <h3>Attendance percentage</h3>
            </div>
          </div>
          <DashboardMonthlyAttendanceChart />
        </article>

        <article class="chart-card">
          <div class="chart-heading">
            <div>
              <span>Needs attention</span>
              <h3>Top late employees</h3>
            </div>
          </div>
          <DashboardTopLateEmployeesChart :employees="topLateEmployees" />
        </article>
      </section>

      <section class="recent-card">
        <div class="section-heading section-heading--table">
          <div>
            <span>Latest activity</span>
            <h2>Recent attendance</h2>
          </div>
          <p>{{ recentAttendance.length }} recent records</p>
        </div>

        <div class="recent-table-wrap">
          <table class="recent-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee</th>
                <th>Department</th>
                <th>Event</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in recentAttendance" :key="item.id">
                <td data-label="Date">{{ item.attendanceDate }}</td>
                <td data-label="Employee" class="employee-cell">{{ item.fullName }}</td>
                <td data-label="Department">{{ item.department }}</td>
                <td data-label="Event">
                  <span class="event-pill">{{ item.status?.replaceAll("_", " ") }}</span>
                </td>
                <td data-label="Time" class="time-cell">{{ item.checkIn || item.checkOut || "-" }}</td>
              </tr>
              <tr v-if="recentAttendance.length === 0">
                <td class="table-empty" colspan="5">No attendance records found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.dashboard-page {
  display: grid;
  gap: 24px;
}

.overview-hero {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 30px;
  overflow: hidden;
  padding: clamp(24px, 4vw, 38px);
  color: rgba(255, 255, 255, 0.74);
  background:
    radial-gradient(circle at 90% 10%, rgba(242, 197, 109, 0.24), transparent 18rem),
    linear-gradient(125deg, #143a40, #0c5e59);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.overview-hero::after {
  content: "";
  position: absolute;
  right: -55px;
  bottom: -100px;
  width: 240px;
  height: 240px;
  border: 42px solid rgba(255, 255, 255, 0.06);
  border-radius: 50%;
}

.overview-eyebrow {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 12px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.live-dot {
  width: 8px;
  height: 8px;
  background: #78e0ad;
  border-radius: 50%;
  box-shadow: 0 0 0 5px rgba(120, 224, 173, 0.12);
}

.overview-hero h1 {
  margin: 0;
  color: #fff;
  font-size: clamp(2rem, 4vw, 3.25rem);
  font-weight: 760;
  letter-spacing: -0.045em;
  line-height: 1;
}

.overview-hero p {
  margin: 12px 0 0;
}

.refresh-note {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  min-width: 175px;
  gap: 11px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.09);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  backdrop-filter: blur(10px);
}

.refresh-note svg {
  width: 20px;
}

.refresh-note span,
.refresh-note strong {
  display: block;
}

.refresh-note span {
  font-size: 11px;
}

.refresh-note strong {
  color: #fff;
  font-size: 12px;
}

.dashboard-state {
  display: grid;
  min-height: 220px;
  place-items: center;
  align-content: center;
  gap: 8px;
  padding: 32px;
  color: var(--ink-500);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  text-align: center;
}

.dashboard-state strong,
.dashboard-state p {
  margin: 0;
}

.dashboard-state--error {
  color: var(--danger);
  background: var(--danger-soft);
}

.state-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--brand-soft);
  border-top-color: var(--brand);
  border-radius: 50%;
  animation: spin 800ms linear infinite;
}

.overview-section,
.chart-card,
.recent-card {
  background: rgba(255, 254, 250, 0.94);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.overview-section {
  padding: 22px;
}

.section-heading,
.chart-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.section-heading {
  margin-bottom: 18px;
}

.section-heading span,
.chart-heading span:not(.chart-tag) {
  color: var(--brand);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.section-heading h2,
.chart-heading h3 {
  margin: 3px 0 0;
}

.section-heading h2 {
  font-size: 21px;
}

.section-heading p {
  margin: 0;
  color: var(--ink-500);
  font-size: 12px;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.chart-grid--feature {
  grid-template-columns: minmax(0, 1.7fr) minmax(300px, 0.8fr);
}

.chart-card {
  min-width: 0;
  padding: 22px;
}

.chart-heading {
  align-items: center;
  margin-bottom: 12px;
}

.chart-heading h3 {
  font-size: 17px;
}

.chart-tag {
  padding: 5px 9px;
  color: var(--ink-700);
  background: var(--surface-muted);
  border: 1px solid var(--line);
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
}

.recent-card {
  overflow: hidden;
}

.section-heading--table {
  margin: 0;
  padding: 22px 22px 18px;
}

.recent-table-wrap {
  overflow-x: auto;
}

.recent-table th,
.recent-table td {
  padding: 14px 22px;
  text-align: left;
}

.recent-table td {
  color: var(--ink-700);
  border-top: 1px solid #e8ece8;
}

.employee-cell {
  color: var(--ink-950) !important;
  font-weight: 750;
}

.time-cell {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}

.event-pill {
  display: inline-flex;
  padding: 5px 9px;
  color: var(--brand-dark);
  background: var(--brand-soft);
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
}

.table-empty {
  padding: 32px !important;
  color: var(--ink-500) !important;
  text-align: center !important;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 1180px) {
  .chart-grid,
  .chart-grid--feature {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .chart-card--wide {
    grid-column: 1 / -1;
  }
}

@media (max-width: 720px) {
  .overview-hero,
  .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .refresh-note {
    width: 100%;
  }

  .chart-grid,
  .chart-grid--feature {
    grid-template-columns: 1fr;
  }

  .chart-card--wide {
    grid-column: auto;
  }

  .recent-table thead {
    display: none;
  }

  .recent-table,
  .recent-table tbody,
  .recent-table tr,
  .recent-table td {
    display: block;
    width: 100%;
  }

  .recent-table tr {
    padding: 14px 18px;
    border-top: 1px solid var(--line);
  }

  .recent-table td {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    padding: 5px 0;
    border: 0;
    text-align: right;
  }

  .recent-table td::before {
    content: attr(data-label);
    color: var(--ink-500);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
}
</style>
