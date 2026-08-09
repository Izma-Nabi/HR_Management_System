<script setup lang="ts">
import AttendanceComplaintModal from "~/components/attendance/AttendanceComplaintModal.vue";
import AttendanceDayDetails from "~/components/attendance/AttendanceDayDetails.vue";
import AttendanceWeekList from "~/components/attendance/AttendanceWeekList.vue";
import AllUsersAttendanceWeek from "~/components/attendance/AllUsersAttendanceWeek.vue";
import attendanceService from "~/services/attendance.service";

type AttendanceDay = {
  dailyAttendanceId: number | null;
  attendanceDate: string;
  dayName: string;
  firstCheckIn: string | null;
  finalCheckOut: string | null;
  workedMinutes: number | null;
  lateMinutes: number | null;
  earlyLeaveMinutes: number | null;
  overtimeMinutes: number | null;
  status: string;
  source: string | null;
  adjustmentReason: string | null;
  canComplain: boolean;
};

type AttendanceComplaint = {
  id: number;
  complaintType: string;
  reason: string;
  status: string;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type RawAttendanceRecord = {
  id: number;
  userId: number;
  userCode: string;
  attendanceDate: string;
  eventType: string;
  eventTime: string;
  remarks: string | null;
  complaint: AttendanceComplaint | null;
};

type DayDetails = {
  attendanceDate: string;
  dailyAttendanceId: number | null;
  canComplain: boolean;
  records: RawAttendanceRecord[];
};

type AttendanceUser = {
  id: number;
  userCode: string | null;
  fullName: string;
  department: string | null;
  designation: string | null;
  days: AttendanceDay[];
};

type ComplaintType = "CHECK_IN" | "CHECK_OUT" | "BOTH" | "STATUS" | "OTHER";

definePageMeta({
  layout: "dashboard"
});

const { isSuperAdmin } = useAuthUser();

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;
const selectedMonth = ref(currentMonth);
const selectedYear = ref(currentYear);
const selectedWeekIndex = ref(0);
const weekStart = ref("");
const weekEnd = ref("");
const days = ref<AttendanceDay[]>([]);
const allUsers = ref<AttendanceUser[]>([]);
const userSearch = ref("");
const selectedDate = ref<string | null>(null);
const dayDetails = ref<DayDetails | null>(null);
const selectedRecord = ref<RawAttendanceRecord | null>(null);
const loadingWeek = ref(true);
const loadingDay = ref(false);
const submittingComplaint = ref(false);
const pageError = ref("");
const detailError = ref("");
const complaintError = ref("");
const successMessage = ref("");
let dayRequestId = 0;

const monthOptions = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" }
];

const yearOptions = Array.from(
  { length: 11 },
  (_, index) => currentYear - index
);

const localDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const mondayOnOrBefore = (date: Date) => {
  const monday = new Date(date);
  const daysFromMonday = (monday.getDay() + 6) % 7;

  monday.setDate(monday.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);

  return monday;
};

const weekStarts = computed(() => {
  const firstDay = new Date(
    selectedYear.value,
    selectedMonth.value - 1,
    1
  );
  const lastDay = new Date(
    selectedYear.value,
    selectedMonth.value,
    0
  );
  const cursor = mondayOnOrBefore(firstDay);
  const starts: string[] = [];

  while (cursor <= lastDay) {
    starts.push(localDateString(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }

  return starts;
});

const selectedWeekStart = computed(() => {
  return weekStarts.value[selectedWeekIndex.value] || "";
});

const selectedMonthLabel = computed(() => {
  return monthOptions.find(
    (month) => month.value === selectedMonth.value
  )?.label || "";
});

const filteredUsers = computed(() => {
  const query = userSearch.value.trim().toLowerCase();

  if (!query) {
    return allUsers.value;
  }

  return allUsers.value.filter((user) => {
    return [
      user.fullName,
      user.userCode,
      user.department,
      user.designation
    ].some((value) => String(value || "").toLowerCase().includes(query));
  });
});

const canGoToPreviousWeek = computed(() => {
  return selectedWeekIndex.value > 0;
});

const canGoToNextWeek = computed(() => {
  return selectedWeekIndex.value < weekStarts.value.length - 1;
});

const weekLabel = computed(() => {
  if (!weekStart.value || !weekEnd.value) {
    return "Current week";
  }

  const formatter = new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  return `${formatter.format(new Date(`${weekStart.value}T00:00:00`))} - ${formatter.format(new Date(`${weekEnd.value}T00:00:00`))}`;
});

const clearSelectedDay = () => {
  dayRequestId += 1;
  selectedDate.value = null;
  dayDetails.value = null;
  selectedRecord.value = null;
  loadingDay.value = false;
  detailError.value = "";
  complaintError.value = "";
  successMessage.value = "";
};

const setDefaultWeekIndex = () => {
  if (
    selectedYear.value === currentYear &&
    selectedMonth.value === currentMonth
  ) {
    const today = localDateString(now);
    const currentIndex = weekStarts.value.findIndex((startDate) => {
      const endDate = new Date(`${startDate}T00:00:00`);

      endDate.setDate(endDate.getDate() + 6);

      return (
        today >= startDate &&
        today <= localDateString(endDate)
      );
    });

    selectedWeekIndex.value = currentIndex >= 0
      ? currentIndex
      : 0;

    return;
  }

  selectedWeekIndex.value = 0;
};

const loadDay = async (attendanceDate: string) => {
  const requestId = ++dayRequestId;

  loadingDay.value = true;
  detailError.value = "";
  dayDetails.value = null;

  try {
    const result = await attendanceService.getMyDayDetails(attendanceDate);

    if (requestId === dayRequestId) {
      dayDetails.value = result;
    }
  } catch (error: any) {
    if (requestId === dayRequestId) {
      detailError.value =
        error?.data?.message ||
        "Unable to load attendance details";
    }
  } finally {
    if (requestId === dayRequestId) {
      loadingDay.value = false;
    }
  }
};

const loadWeek = async () => {
  loadingWeek.value = true;
  pageError.value = "";
  successMessage.value = "";

  try {
    const result = isSuperAdmin.value
      ? await attendanceService.getAllUsersWeek(selectedWeekStart.value)
      : await attendanceService.getMyCurrentWeek(selectedWeekStart.value);

    weekStart.value = result.weekStart;
    weekEnd.value = result.weekEnd;
    days.value = isSuperAdmin.value ? [] : result.days;
    allUsers.value = isSuperAdmin.value ? result.users : [];

    if (isSuperAdmin.value) {
      clearSelectedDay();
      return;
    }

    if (selectedDate.value) {
      const stillInWeek = result.days.some(
        (day: AttendanceDay) => day.attendanceDate === selectedDate.value
      );

      if (stillInWeek) {
        await loadDay(selectedDate.value);
      } else {
        selectedDate.value = null;
        dayDetails.value = null;
      }
    }
  } catch (error: any) {
    pageError.value =
      error?.data?.message ||
      "Unable to load attendance week";
    days.value = [];
    allUsers.value = [];
    selectedDate.value = null;
    dayDetails.value = null;
  } finally {
    loadingWeek.value = false;
  }
};

const changePeriod = async () => {
  setDefaultWeekIndex();
  clearSelectedDay();

  await loadWeek();
};

const navigateWeek = async (offset: number) => {
  const nextIndex = selectedWeekIndex.value + offset;

  if (
    nextIndex < 0 ||
    nextIndex >= weekStarts.value.length
  ) {
    return;
  }

  selectedWeekIndex.value = nextIndex;
  clearSelectedDay();

  await loadWeek();
};

const selectDay = async (attendanceDate: string) => {
  if (isSuperAdmin.value) {
    return;
  }

  selectedDate.value = attendanceDate;
  successMessage.value = "";

  await loadDay(attendanceDate);
};

const openComplaint = (record: RawAttendanceRecord) => {
  if (!dayDetails.value?.canComplain) {
    return;
  }

  complaintError.value = "";
  selectedRecord.value = record;
};

const closeComplaint = () => {
  if (!submittingComplaint.value) {
    complaintError.value = "";
    selectedRecord.value = null;
  }
};

const submitComplaint = async (payload: {
  complaintType: ComplaintType;
  reason: string;
}) => {
  if (
    !selectedRecord.value ||
    !dayDetails.value?.dailyAttendanceId ||
    !selectedDate.value
  ) {
    return;
  }

  submittingComplaint.value = true;
  complaintError.value = "";

  try {
    await attendanceService.createComplaint({
      dailyAttendanceId: dayDetails.value.dailyAttendanceId,
      rawAttendanceId: selectedRecord.value.id,
      complaintType: payload.complaintType,
      reason: payload.reason
    });

    selectedRecord.value = null;
    successMessage.value = "Attendance complaint submitted successfully.";

    await loadDay(selectedDate.value);
  } catch (error: any) {
    complaintError.value =
      error?.data?.message ||
      "Unable to submit attendance complaint";
  } finally {
    submittingComplaint.value = false;
  }
};

setDefaultWeekIndex();
onMounted(loadWeek);
</script>

<template>
  <div class="attendance-page">
    <header class="page-header">
      <div>
        <h1>{{ isSuperAdmin ? "All User Attendance" : "My Attendance" }}</h1>
        <p>
          {{ selectedMonthLabel }} {{ selectedYear }}
          <template v-if="isSuperAdmin && !loadingWeek">
            - {{ allUsers.length }} employees
          </template>
        </p>
      </div>

      <label v-if="isSuperAdmin" class="user-search">
        <span class="sr-only">Search employees</span>
        <input
          v-model="userSearch"
          type="search"
          placeholder="Search employee, code or team"
        >
      </label>
    </header>

    <section class="attendance-controls" aria-label="Attendance period">
      <div class="period-filters">
        <label>
          <span>Month</span>
          <select v-model.number="selectedMonth" @change="changePeriod">
            <option
              v-for="month in monthOptions"
              :key="month.value"
              :value="month.value"
            >
              {{ month.label }}
            </option>
          </select>
        </label>

        <label>
          <span>Year</span>
          <select v-model.number="selectedYear" @change="changePeriod">
            <option
              v-for="year in yearOptions"
              :key="year"
              :value="year"
            >
              {{ year }}
            </option>
          </select>
        </label>
      </div>

      <div class="week-navigation">
        <button
          class="week-arrow"
          type="button"
          :disabled="!canGoToPreviousWeek || loadingWeek"
          aria-label="Previous week"
          title="Previous week"
          @click="navigateWeek(-1)"
        >
          <span aria-hidden="true">&lt;</span>
        </button>

        <div class="week-range">
          <span>Week</span>
          <strong>{{ weekLabel }}</strong>
        </div>

        <button
          class="week-arrow"
          type="button"
          :disabled="!canGoToNextWeek || loadingWeek"
          aria-label="Next week"
          title="Next week"
          @click="navigateWeek(1)"
        >
          <span aria-hidden="true">&gt;</span>
        </button>
      </div>

      <button
        class="refresh-button"
        type="button"
        :disabled="loadingWeek"
        @click="loadWeek"
      >
        {{ loadingWeek ? "Refreshing..." : "Refresh" }}
      </button>
    </section>

    <p v-if="pageError" class="notice notice--error" role="alert">
      {{ pageError }}
    </p>

    <p
      v-if="successMessage"
      class="notice notice--success"
      role="status"
    >
      {{ successMessage }}
    </p>

    <div v-if="loadingWeek" class="loading-state" aria-live="polite">
      Loading attendance week...
    </div>

    <AllUsersAttendanceWeek
      v-else-if="isSuperAdmin && !pageError"
      :users="filteredUsers"
    />

    <AttendanceWeekList
      v-else-if="!pageError"
      :days="days"
      :selected-date="selectedDate"
      @select="selectDay"
    />

    <p v-if="detailError" class="notice notice--error" role="alert">
      {{ detailError }}
    </p>

    <AttendanceDayDetails
      v-if="!isSuperAdmin && selectedDate && !detailError"
      :attendance-date="selectedDate"
      :records="dayDetails?.records || []"
      :loading="loadingDay"
      :can-complain="dayDetails?.canComplain || false"
      @complain="openComplaint"
    />

    <AttendanceComplaintModal
      v-if="!isSuperAdmin && selectedRecord && selectedDate"
      :key="`${selectedDate}-${selectedRecord.id}`"
      :attendance-date="selectedDate"
      :record="selectedRecord"
      :submitting="submittingComplaint"
      :error="complaintError"
      @close="closeComplaint"
      @submit="submitComplaint"
    />
  </div>
</template>

<style scoped>
.attendance-page {
  width: min(100%, 1240px);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 16px;
}

.page-header h1 {
  margin: 0 0 6px;
  color: #172033;
  font-size: 30px;
}

.page-header p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.user-search {
  width: min(100%, 320px);
}

.user-search input {
  width: 100%;
  min-height: 42px;
  padding: 0 14px;
  color: #1d2b3f;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  outline: none;
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.user-search input:focus {
  border-color: #16827f;
  box-shadow: 0 0 0 3px rgb(22 130 127 / 13%);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.attendance-controls {
  display: grid;
  grid-template-columns: auto minmax(300px, 1fr) auto;
  align-items: end;
  margin-bottom: 18px;
  padding: 14px 16px;
  gap: 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.period-filters {
  display: flex;
  align-items: end;
  gap: 10px;
}

.period-filters label {
  display: grid;
  gap: 6px;
}

.period-filters label > span,
.week-range > span {
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.period-filters select {
  width: 142px;
  height: 40px;
  padding: 0 34px 0 11px;
  color: #1e293b;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  outline: none;
}

.period-filters label:last-child select {
  width: 96px;
}

.period-filters select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgb(37 99 235 / 12%);
}

.week-navigation {
  display: grid;
  grid-template-columns: 36px minmax(210px, auto) 36px;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.week-arrow {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  color: #334155;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 18px;
  font-weight: 700;
}

.week-arrow:hover:not(:disabled) {
  color: #1d4ed8;
  background: #eff6ff;
  border-color: #93c5fd;
}

.week-arrow:disabled {
  color: #cbd5e1;
  background: #f8fafc;
  cursor: not-allowed;
}

.week-range {
  display: grid;
  min-width: 0;
  gap: 4px;
  text-align: center;
}

.week-range strong {
  overflow: hidden;
  color: #1e293b;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.refresh-button {
  min-height: 40px;
  padding: 8px 15px;
  color: #334155;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-weight: 700;
}

.refresh-button:hover:not(:disabled) {
  color: #1d4ed8;
  border-color: #93c5fd;
  background: #eff6ff;
}

.refresh-button:disabled {
  color: #94a3b8;
  background: #f8fafc;
  cursor: wait;
}

.notice,
.loading-state {
  margin: 0 0 16px;
  padding: 12px 14px;
  border: 1px solid;
  border-radius: 6px;
  font-size: 14px;
}

.notice--error {
  color: #991b1b;
  background: #fef2f2;
  border-color: #fecaca;
}

.notice--success {
  color: #166534;
  background: #f0fdf4;
  border-color: #86efac;
}

.loading-state {
  color: #475569;
  background: #ffffff;
  border-color: #e2e8f0;
}

@media (max-width: 600px) {
  .page-header {
    align-items: stretch;
    flex-direction: column;
  }

  .page-header h1 {
    font-size: 26px;
  }

  .user-search {
    width: 100%;
  }

  .refresh-button {
    width: 100%;
  }
}

@media (max-width: 1020px) {
  .attendance-controls {
    grid-template-columns: 1fr auto;
  }

  .week-navigation {
    grid-column: 1 / -1;
    grid-row: 2;
  }
}

@media (max-width: 600px) {
  .attendance-controls {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .period-filters {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 110px;
  }

  .period-filters select,
  .period-filters label:last-child select {
    width: 100%;
  }

  .week-navigation {
    grid-column: 1;
    grid-row: auto;
    grid-template-columns: 36px minmax(0, 1fr) 36px;
  }

  .week-range strong {
    white-space: normal;
  }
}
</style>
