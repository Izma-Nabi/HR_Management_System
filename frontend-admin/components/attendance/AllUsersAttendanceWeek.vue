<script setup lang="ts">
type AttendanceDay = {
  attendanceDate: string;
  dayName: string;
  firstCheckIn: string | null;
  finalCheckOut: string | null;
  workedMinutes: number | null;
  status: string;
};

type AttendanceUser = {
  id: number;
  userCode: string | null;
  fullName: string;
  department: string | null;
  designation: string | null;
  days: AttendanceDay[];
};

const props = defineProps<{
  users: AttendanceUser[];
}>();

const headerDays = computed(() => props.users[0]?.days || []);

const initials = (name: string) => {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const shortDate = (date: string) => {
  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "short"
  }).format(new Date(`${date}T00:00:00`));
};

const formatTime = (time: string | null) => {
  return time ? time.slice(0, 5) : "--:--";
};

const workedTime = (minutes: number | null) => {
  if (minutes === null) {
    return "No hours";
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return `${hours}h ${remainder}m`;
};

const statusLabel = (status: string) => {
  const labels: Record<string, string> = {
    NO_RECORD: "No record",
    HALF_DAY: "Half day",
    EARLY_LEAVE: "Early leave",
    ON_LEAVE: "On leave"
  };

  return labels[status] || status.toLowerCase().replace(/_/g, " ");
};

const statusClass = (status: string) => {
  return `status--${status.toLowerCase().replace(/_/g, "-")}`;
};
</script>

<template>
  <section class="all-attendance-card">
    <div v-if="users.length" class="table-scroll">
      <table>
        <thead>
          <tr>
            <th class="employee-heading">Employee</th>
            <th v-for="day in headerDays" :key="day.attendanceDate">
              <span>{{ day.dayName.slice(0, 3) }}</span>
              <strong>{{ shortDate(day.attendanceDate) }}</strong>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td class="employee-cell">
              <span class="avatar" aria-hidden="true">
                {{ initials(user.fullName) }}
              </span>
              <span class="employee-copy">
                <strong>{{ user.fullName }}</strong>
                <span>
                  {{ user.userCode || "No code" }}
                  <template v-if="user.department"> / {{ user.department }}</template>
                </span>
                <small v-if="user.designation">{{ user.designation }}</small>
              </span>
            </td>

            <td
              v-for="day in user.days"
              :key="`${user.id}-${day.attendanceDate}`"
              class="attendance-cell"
            >
              <span class="status" :class="statusClass(day.status)">
                {{ statusLabel(day.status) }}
              </span>
              <strong class="time-range">
                {{ formatTime(day.firstCheckIn) }} - {{ formatTime(day.finalCheckOut) }}
              </strong>
              <small>{{ workedTime(day.workedMinutes) }}</small>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="empty-state">
      <span class="empty-mark" aria-hidden="true">0</span>
      <strong>No employees found</strong>
      <p>Try a different search or attendance period.</p>
    </div>
  </section>
</template>

<style scoped>
.all-attendance-card {
  overflow: hidden;
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #dfe6ee);
  border-radius: var(--radius-lg, 16px);
  box-shadow: var(--shadow-sm, 0 10px 30px rgb(18 38 63 / 6%));
}

.table-scroll {
  overflow-x: auto;
  scrollbar-color: #b7c5d5 transparent;
}

table {
  width: 100%;
  min-width: 1240px;
  border-collapse: separate;
  border-spacing: 0;
}

th,
td {
  padding: 14px;
  border-bottom: 1px solid #e8edf3;
  text-align: left;
  vertical-align: middle;
}

thead th {
  color: #64748b;
  background: #f6f8fb;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

thead th:not(.employee-heading) {
  min-width: 132px;
}

thead th span,
thead th strong {
  display: block;
}

thead th strong {
  margin-top: 3px;
  color: #1d2b3f;
  font-size: 12px;
  letter-spacing: 0;
}

.employee-heading,
.employee-cell {
  position: sticky;
  left: 0;
  z-index: 2;
  width: 280px;
  min-width: 280px;
}

.employee-heading {
  z-index: 3;
}

.employee-cell {
  display: flex;
  align-items: center;
  gap: 11px;
  background: #ffffff;
  box-shadow: 8px 0 18px rgb(26 46 70 / 4%);
}

tbody tr:last-child td {
  border-bottom: 0;
}

tbody tr:hover td {
  background-color: #fbfcfe;
}

tbody tr:hover .employee-cell {
  background-color: #fbfcfe;
}

.avatar {
  display: grid;
  flex: 0 0 38px;
  place-items: center;
  width: 38px;
  height: 38px;
  color: #0f5b5d;
  background: #dff4ef;
  border: 1px solid #c4e8df;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 800;
}

.employee-copy {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.employee-copy strong {
  overflow: hidden;
  color: #172033;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.employee-copy span,
.employee-copy small,
.attendance-cell small {
  color: #718096;
  font-size: 11px;
}

.attendance-cell {
  min-width: 132px;
}

.status {
  display: inline-flex;
  width: fit-content;
  margin-bottom: 8px;
  padding: 4px 7px;
  color: #475569;
  background: #eef2f6;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.04em;
  line-height: 1;
  text-transform: uppercase;
}

.status--present {
  color: #106148;
  background: #ddf5ea;
}

.status--late,
.status--early-leave,
.status--half-day {
  color: #8a4b08;
  background: #fff1d6;
}

.status--absent {
  color: #a22929;
  background: #fde7e7;
}

.status--on-leave {
  color: #28578c;
  background: #e5f0fb;
}

.status--weekend,
.status--upcoming,
.status--no-record {
  color: #667085;
  background: #edf1f5;
}

.time-range {
  display: block;
  margin-bottom: 3px;
  color: #27364a;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.empty-state {
  display: grid;
  place-items: center;
  min-height: 280px;
  padding: 40px 20px;
  color: #64748b;
  text-align: center;
}

.empty-mark {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-bottom: 12px;
  color: #0f5b5d;
  background: #e5f3f0;
  border-radius: 14px;
  font-weight: 800;
}

.empty-state strong {
  color: #243247;
}

.empty-state p {
  margin: 5px 0 0;
  font-size: 13px;
}

@media (max-width: 720px) {
  .employee-heading,
  .employee-cell {
    width: 230px;
    min-width: 230px;
  }
}
</style>
