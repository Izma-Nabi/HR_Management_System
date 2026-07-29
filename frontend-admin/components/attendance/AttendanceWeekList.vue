<script setup lang="ts">
type AttendanceDay = {
  attendanceDate: string;
  dayName: string;
  firstCheckIn: string | null;
  finalCheckOut: string | null;
  workedMinutes: number | null;
  lateMinutes: number | null;
  earlyLeaveMinutes: number | null;
  overtimeMinutes: number | null;
  status: string;
};

const props = defineProps<{
  days: AttendanceDay[];
  selectedDate: string | null;
}>();

const emit = defineEmits<{
  (event: "select", attendanceDate: string): void;
}>();

const formatTime = (time: string | null) => {
  if (!time) {
    return "--";
  }

  const [hours, minutes] = time.split(":").map(Number);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return time;
  }

  return new Intl.DateTimeFormat("en-PK", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(new Date(2000, 0, 1, hours, minutes));
};

const formatDuration = (minutes: number | null) => {
  if (minutes === null) {
    return "--";
  }

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`;
};

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "short"
  }).format(new Date(`${date}T00:00:00`));
};

const statusClass = (status: string) => {
  return status.toLowerCase().replaceAll("_", "-");
};
</script>

<template>
  <section class="week-list" aria-label="Attendance week">
    <div class="week-list__header" aria-hidden="true">
      <span>Day</span>
      <span>Check in</span>
      <span>Check out</span>
      <span>Worked</span>
      <span>Late</span>
      <span>Early leave</span>
      <span>Overtime</span>
      <span>Status</span>
      <span />
    </div>

    <button
      v-for="day in props.days"
      :key="day.attendanceDate"
      class="day-row"
      :class="{ 'day-row--selected': props.selectedDate === day.attendanceDate }"
      type="button"
      :aria-expanded="props.selectedDate === day.attendanceDate"
      @click="emit('select', day.attendanceDate)"
    >
      <span class="day-cell">
        <strong>{{ day.dayName }}</strong>
        <small>{{ formatDate(day.attendanceDate) }}</small>
      </span>

      <span class="value-cell" data-label="Check in">
        {{ formatTime(day.firstCheckIn) }}
      </span>

      <span class="value-cell" data-label="Check out">
        {{ formatTime(day.finalCheckOut) }}
      </span>

      <span class="value-cell" data-label="Worked">
        {{ formatDuration(day.workedMinutes) }}
      </span>

      <span class="value-cell" data-label="Late">
        {{ formatDuration(day.lateMinutes) }}
      </span>

      <span class="value-cell" data-label="Early leave">
        {{ formatDuration(day.earlyLeaveMinutes) }}
      </span>

      <span class="value-cell" data-label="Overtime">
        {{ formatDuration(day.overtimeMinutes) }}
      </span>

      <span class="status-cell">
        <span class="status" :class="`status--${statusClass(day.status)}`">
          {{ day.status.replaceAll("_", " ") }}
        </span>
      </span>

      <span class="row-action" aria-hidden="true" />
    </button>

    <div v-if="props.days.length === 0" class="empty-state">
      No attendance records are available for this week.
    </div>
  </section>
</template>

<style scoped>
.week-list {
  overflow: hidden;
  width: 100%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.week-list__header,
.day-row {
  display: grid;
  grid-template-columns:
    minmax(120px, 1.2fr)
    minmax(84px, 0.8fr)
    minmax(84px, 0.8fr)
    minmax(72px, 0.7fr)
    minmax(64px, 0.6fr)
    minmax(82px, 0.75fr)
    minmax(76px, 0.7fr)
    minmax(108px, 0.95fr)
    20px;
  gap: 10px;
  align-items: center;
}

.week-list__header {
  min-height: 42px;
  padding: 0 18px;
  color: #64748b;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.day-row {
  width: 100%;
  min-height: 74px;
  padding: 12px 18px;
  color: #1e293b;
  background: #ffffff;
  border: 0;
  border-bottom: 1px solid #edf2f7;
  border-radius: 0;
  text-align: left;
  transition:
    background-color 150ms ease,
    box-shadow 150ms ease;
}

.day-row:last-of-type {
  border-bottom: 0;
}

.day-row:hover {
  background: #f8fafc;
}

.day-row:focus-visible {
  position: relative;
  outline: 2px solid #2563eb;
  outline-offset: -2px;
}

.day-row--selected {
  background: #f8fafc;
  box-shadow: inset 4px 0 0 #2563eb;
}

.day-cell {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 4px;
}

.day-cell strong {
  overflow: hidden;
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.day-cell small {
  color: #64748b;
  font-size: 13px;
}

.value-cell {
  color: #334155;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}

.status-cell {
  min-width: 0;
}

.status {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  max-width: 100%;
  padding: 4px 9px;
  overflow: hidden;
  color: #475569;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  text-transform: capitalize;
  white-space: nowrap;
}

.status--present {
  color: #166534;
  background: #f0fdf4;
  border-color: #86efac;
}

.status--late,
.status--half-day,
.status--incomplete {
  color: #92400e;
  background: #fffbeb;
  border-color: #fcd34d;
}

.status--absent {
  color: #991b1b;
  background: #fef2f2;
  border-color: #fecaca;
}

.status--leave,
.status--on-leave,
.status--holiday,
.status--weekend,
.status--week-off {
  color: #1e40af;
  background: #eff6ff;
  border-color: #bfdbfe;
}

.status--no-record,
.status--upcoming {
  color: #475569;
  background: #f8fafc;
  border-color: #cbd5e1;
}

.row-action {
  width: 9px;
  height: 9px;
  justify-self: end;
  border-top: 2px solid #64748b;
  border-right: 2px solid #64748b;
  transform: rotate(45deg);
}

.empty-state {
  padding: 28px 18px;
  color: #64748b;
  text-align: center;
}

@media (max-width: 920px) {
  .week-list__header {
    display: none;
  }

  .day-row {
    grid-template-columns: minmax(100px, 1fr) minmax(118px, auto) 18px;
    gap: 10px 14px;
    min-height: 210px;
  }

  .day-cell {
    grid-column: 1;
    grid-row: 1 / span 7;
  }

  .value-cell {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .value-cell::before {
    color: #64748b;
    content: attr(data-label);
    font-size: 12px;
  }

  .value-cell:nth-of-type(2) {
    grid-column: 2;
    grid-row: 1;
  }

  .value-cell:nth-of-type(3) {
    grid-column: 2;
    grid-row: 2;
  }

  .value-cell:nth-of-type(4) {
    grid-column: 2;
    grid-row: 3;
  }

  .value-cell:nth-of-type(5) {
    grid-column: 2;
    grid-row: 4;
  }

  .value-cell:nth-of-type(6) {
    grid-column: 2;
    grid-row: 5;
  }

  .value-cell:nth-of-type(7) {
    grid-column: 2;
    grid-row: 6;
  }

  .status-cell {
    grid-column: 2;
    grid-row: 7;
  }

  .row-action {
    grid-column: 3;
    grid-row: 1 / span 7;
    align-self: center;
  }
}

@media (max-width: 520px) {
  .day-row {
    grid-template-columns: 1fr 18px;
    min-height: 0;
  }

  .day-cell {
    grid-column: 1;
    grid-row: 1;
  }

  .value-cell:nth-of-type(2) {
    grid-column: 1;
    grid-row: 2;
  }

  .value-cell:nth-of-type(3) {
    grid-column: 1;
    grid-row: 3;
  }

  .value-cell:nth-of-type(4) {
    grid-column: 1;
    grid-row: 4;
  }

  .value-cell:nth-of-type(5) {
    grid-column: 1;
    grid-row: 5;
  }

  .value-cell:nth-of-type(6) {
    grid-column: 1;
    grid-row: 6;
  }

  .value-cell:nth-of-type(7) {
    grid-column: 1;
    grid-row: 7;
  }

  .status-cell {
    grid-column: 1;
    grid-row: 8;
  }

  .row-action {
    grid-column: 2;
    grid-row: 1 / span 8;
  }
}
</style>
