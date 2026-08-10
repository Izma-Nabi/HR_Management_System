<script setup lang="ts">
import attendanceService from "~/services/attendance.service";

definePageMeta({
  layout: "dashboard"
});

const currentWorkingTime = ref("0h 0m 0s");

const {
  dashboard,
  loading,
  error,
  fetchEmployeeDashboard
} = useEmployeeDashboard();

const today = ref({
  attendanceDate: "",
  firstCheckIn: null as string | null,
  finalCheckOut: null as string | null,
  workedMinutes: 0,
  lateMinutes: 0,
  overtimeMinutes: 0,
  status: "NO_RECORD"
});

const entries = ref<any[]>([]);

const user = computed(() => {
  return dashboard.value?.user || {};
});

const todayString = () => {
  const d = new Date();

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
};

const calculateLateMinutes = ()=>{

 if(!today.value.firstCheckIn){
   return;
 }

 const [h,m] =today.value.firstCheckIn.split(":") .map(Number);
 const actual = h*60+m;
 const officeStart = 10*60;

 today.value.lateMinutes =
 Math.max(
   0,
   actual-officeStart
 );

};

const loadTodayAttendance = async () => {
  try {
    const data =
      await attendanceService.getMyDayDetails(
        todayString()
      );

    entries.value = data.records || [];

    const checkIns =
      entries.value.filter(
        x => x.eventType === "CHECK_IN"
      );

    const checkOuts =
      entries.value.filter(
        x => x.eventType === "CHECK_OUT"
      );

    const firstCheckIn =
      checkIns[0];

    const lastCheckOut =
      checkOuts.length
        ? checkOuts[checkOuts.length - 1]
        : null;

    today.value = {
      attendanceDate:
        data.attendanceDate,

      firstCheckIn:
        firstCheckIn?.eventTime || null,

      finalCheckOut:
        lastCheckOut?.eventTime || null,

      workedMinutes: today.value.workedMinutes || 0,
      lateMinutes: today.value.lateMinutes || 0,
      overtimeMinutes: today.value.overtimeMinutes || 0,

      status:
        entries.value.length
          ? "PRESENT"
          : "NO_RECORD"
    };

    calculateLateMinutes();

  } catch (error) {
    console.log(error);

    entries.value = [];
  }
};

const formatMinutes = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  return `${h}h ${m}m`;
};

const updateWorkingTime = () => {
  if (!entries.value.length) {
    currentWorkingTime.value = "0h 0m 0s";
    today.value.workedMinutes = 0;
    today.value.overtimeMinutes = 0;
    return;
  }

  let totalSeconds = 0;
  let overtimeSeconds = 0;
  let activeCheckIn: any = null;

  const officeEndDate = new Date(
    `${today.value.attendanceDate}T00:00:00`
  );
  officeEndDate.setHours(18, 0, 0, 0); // 6:00 PM office end

  const overlapWithOvertime = (start: Date, end: Date) => {
    const overtimeStart = start > officeEndDate ? start : officeEndDate;
    return Math.max(0, (end.getTime() - overtimeStart.getTime()) / 1000);
  };

  for (const event of entries.value) {
    const eventTime = new Date(
      `${today.value.attendanceDate}T${event.eventTime}`
    );

    if (event.eventType === "CHECK_IN") {
      activeCheckIn = eventTime;
    }

    if (event.eventType === "CHECK_OUT" && activeCheckIn) {
      totalSeconds += Math.floor(
        (eventTime.getTime() - activeCheckIn.getTime()) / 1000
      );

      overtimeSeconds += overlapWithOvertime(activeCheckIn, eventTime);

      activeCheckIn = null;
    }
  }

  if (activeCheckIn) {
    const now = new Date();

    totalSeconds += Math.floor(
      (now.getTime() - activeCheckIn.getTime()) / 1000
    );

    overtimeSeconds += overlapWithOvertime(activeCheckIn, now);
  }

  if (totalSeconds < 0) {
    totalSeconds = 0;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  currentWorkingTime.value =
    `${hours}h ${minutes}m ${seconds}s`;

  today.value.workedMinutes =
    Math.floor(totalSeconds / 60);

  today.value.overtimeMinutes =
    Math.floor(overtimeSeconds / 60);
};

const attendanceStatus = computed(() => {
  if (!today.value.firstCheckIn) {
    return "-";
  }

  return today.value.lateMinutes > 0
    ? "LATE"
    : "PRESENT";
});

const formatTime = (time: any) => {
  if (!time) return "-";
  if (/^\d{2}:\d{2}:\d{2}$/.test(time)) {
    const [h, m] = time.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0);
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  }

  const d = new Date(time);
  if (isNaN(d.getTime())) {
    return "-";
  }
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
};
const formatDate = (value: any) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
};

let refreshTimer: any = null;
let workingTimer: any = null;

onMounted(async () => {

  await Promise.all([
    fetchEmployeeDashboard(),
    loadTodayAttendance()
  ]);

  updateWorkingTime();

  workingTimer = setInterval(() => {
    updateWorkingTime();
  }, 1000);

  refreshTimer = setInterval(async () => {
    await Promise.all([
      fetchEmployeeDashboard({
        silent: true
      }),
      loadTodayAttendance()
    ]);
  }, 30000);

});

onUnmounted(() => {

  clearInterval(refreshTimer);

  clearInterval(workingTimer);

});
</script>

<template>
  <div class="page-wrap">
    <!-- Header -->
    <div class="header-block">
      <h1 class="page-title">
        Welcome, {{ user.fullName || "User" }}
      </h1>

      <p class="page-subtitle">
        {{ user.role || "Employee" }} Dashboard
      </p>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="state-panel"
    >
      <div class="spinner"></div>
      Loading dashboard...
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="state-panel error-panel"
    >
      {{ error }}
    </div>

    <template v-else>
      <!-- Today Attendance -->
      <div class="section-block">
        <h2 class="section-title">
          Today's Attendance
        </h2>

        <div class="stats-row">
          <!-- Check In -->
          <div class="card">
            <div class="card-icon icon-blue">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </div>

            <p class="card-label">
              Check In
            </p>

            <h2 class="card-value">
              {{ formatTime(today.firstCheckIn) }}
            </h2>
          </div>

          <!-- Check Out -->
          <div class="card">
            <div class="card-icon icon-rose">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>

            <p class="card-label">
              Check Out
            </p>

            <h2 class="card-value">
              {{ formatTime(today.finalCheckOut) }}
            </h2>
          </div>

          <!-- Working Hours -->
          <div class="card">
            <div class="card-icon icon-emerald">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>

            <p class="card-label">
              Working Hours
            </p>

            <h2 class="card-value">
              {{ currentWorkingTime }}
            </h2>
          </div>

          <!-- Late Minutes -->
          <div class="card">
            <div class="card-icon icon-amber">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>

            <p class="card-label">
              Late Minutes
            </p>

            <h2 class="card-value">
              {{ formatMinutes(today.lateMinutes || 0) }}
            </h2>
          </div>

          <!-- Extra Time -->
          <div class="card">
            <div class="card-icon icon-violet">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 2v4" />
                <path d="m16.24 7.76 2.83-2.83" />
                <path d="M18 12h4" />
                <path d="m16.24 16.24 2.83 2.83" />
                <path d="M12 18v4" />
                <path d="m4.93 19.07 2.83-2.83" />
                <path d="M2 12h4" />
                <path d="m4.93 4.93 2.83 2.83" />
              </svg>
            </div>

            <p class="card-label">
              Extra Time
            </p>

            <h2 class="card-value">
              {{ formatMinutes(today.overtimeMinutes || 0) }}
            </h2>
          </div>
        </div>
      </div>

      <!-- Attendance Date -->
      <div class="panel">
        <h2 class="panel-title">
          Attendance Date
        </h2>

        <p class="panel-text">
          {{ formatDate(today.date || new Date()) }}
        </p>
      </div>

      <!-- Today Events -->
      <div class="panel table-panel">
        <div class="panel-header">
          <h2 class="panel-title">
            Today's Attendance Events
          </h2>
        </div>

        <div class="table-scroll">
          <table class="events-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Time</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="item in entries"
                :key="item.id"
              >
                <td>
                  <span
                    class="event-badge"
                    :class="
                      item.eventType === 'CHECK_IN'
                        ? 'badge-in'
                        : 'badge-out'
                    "
                  >
                    {{ item.eventType }}
                  </span>
                </td>

                <td class="event-time">
                  {{ formatTime(item.eventTime) }}
                </td>
              </tr>

              <tr v-if="entries.length === 0">
                <td
                  colspan="2"
                  class="empty-state"
                >
                  No attendance events today.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.page-wrap {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 4px;
}

/* Header */
.header-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.02em;
}

.page-subtitle {
  color: #6b7280;
  font-size: 15px;
}

/* Loading / error states */
.state-panel {
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  color: #6b7280;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-weight: 500;
}

.error-panel {
  background: #fef2f2;
  color: #dc2626;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #e5e7eb;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Section */
.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 16px;
}

/* Stats row - always horizontal in a single line */
.stats-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}

.stats-row::-webkit-scrollbar {
  height: 6px;
}

.stats-row::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 999px;
}

.card {
  flex: 1 1 0;
  min-width: 170px;
  background: #ffffff;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  border: 1px solid #f1f5f9;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.08);
}

.card-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}

.card-icon svg {
  width: 20px;
  height: 20px;
}

.icon-blue {
  background: #eef2ff;
  color: #4f46e5;
}

.icon-rose {
  background: #fef2f2;
  color: #e11d48;
}

.icon-emerald {
  background: #eff6ff;
  color: #2563eb;
}

.icon-amber {
  background: #fffbeb;
  color: #d97706;
}

.icon-violet {
  background: #f5f3ff;
  color: #7c3aed;
}

.card-label {
  color: #6b7280;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 6px;
}

.card-value {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

/* Generic panel */
.panel {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  border: 1px solid #f1f5f9;
  padding: 20px;
}

.panel-title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.panel-text {
  color: #6b7280;
  margin-top: 8px;
  font-size: 14px;
}

.table-panel {
  padding: 0;
  overflow: hidden;
}

.panel-header {
  padding: 20px 20px 12px;
}

.table-scroll {
  overflow-x: auto;
}

/* Table */
.events-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.events-table thead {
  background: #f9fafb;
}

.events-table th {
  text-align: left;
  padding: 12px 20px;
  color: #6b7280;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.events-table td {
  padding: 14px 20px;
  border-top: 1px solid #f1f5f9;
  color: #111827;
}

.event-time {
  color: #374151;
  font-variant-numeric: tabular-nums;
}

.event-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.badge-in {
  background: #eff6ff;
  color: #2563eb;
}

.badge-out {
  background: #fef2f2;
  color: #e11d48;
}

.empty-state {
  text-align: center;
  padding: 32px;
  color: #9ca3af;
}

/* Responsive */
@media (max-width: 768px) {
  .card {
    min-width: 150px;
  }

  .card-value {
    font-size: 19px;
  }
}
</style>