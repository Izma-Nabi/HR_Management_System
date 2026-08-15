<script setup lang="ts">
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

const props = defineProps<{
  attendanceDate: string;
  records: RawAttendanceRecord[];
  loading: boolean;
}>();

const heading = computed(() => {
  return new Intl.DateTimeFormat("en-PK", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(`${props.attendanceDate}T00:00:00`));
});

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

const statusClass = (status: string) => {
  return status.toLowerCase().replaceAll("_", "-");
};

const logNumber = (index: number) => {
  return String(index + 1).padStart(2, "0");
};
</script>

<template>
  <section class="day-details" aria-labelledby="attendance-detail-heading">
    <header class="details-header">
      <div>
        <p>Complete event log</p>
        <h2 id="attendance-detail-heading">{{ heading }}</h2>
      </div>
      <span class="record-count">
        {{ props.records.length }}
        record{{ props.records.length === 1 ? "" : "s" }}
      </span>
    </header>

    <div v-if="props.loading" class="state-message" aria-live="polite">
      Loading attendance details...
    </div>

    <div v-else-if="props.records.length === 0" class="state-message">
      No attendance events found for this day.
    </div>

    <div v-else class="table-scroll">
      <table>
        <thead>
          <tr>
            <th scope="col" class="sequence-column">#</th>
            <th scope="col">Event</th>
            <th scope="col">Time</th>
            <th scope="col">Remarks</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(record, index) in props.records"
            :key="record.id"
          >
            <td class="sequence-column">
              {{ logNumber(index) }}
            </td>
            <td>
              <span
                class="event-type"
                :class="`event-type--${statusClass(record.eventType)}`"
              >
                {{ record.eventType.replaceAll("_", " ") }}
              </span>
            </td>
            <td class="time">{{ formatTime(record.eventTime) }}</td>
            <td class="remarks">{{ record.remarks || "--" }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.day-details {
  margin-top: 20px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.details-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 76px;
  padding: 14px 18px;
  gap: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.details-header p {
  margin: 0 0 4px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.details-header h2 {
  margin: 0;
  color: #172033;
  font-size: 18px;
}

.record-count {
  flex: 0 0 auto;
  color: #475569;
  font-size: 13px;
  font-weight: 700;
}

.state-message {
  padding: 32px 18px;
  color: #64748b;
  text-align: center;
}

.table-scroll {
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 680px;
  border-collapse: collapse;
  table-layout: fixed;
}

th,
td {
  padding: 14px 18px;
  border-bottom: 1px solid #edf2f7;
  text-align: left;
  vertical-align: middle;
}

th {
  color: #64748b;
  background: #f8fafc;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

tbody tr:last-child td {
  border-bottom: 0;
}

tbody tr:hover {
  background: #fbfdff;
}

.sequence-column {
  width: 56px;
  color: #64748b;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}

.time {
  color: #1e293b;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}

.remarks {
  overflow-wrap: anywhere;
  color: #475569;
  font-size: 13px;
}

.event-type,
.complaint-status {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 4px 9px;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  text-transform: capitalize;
  white-space: nowrap;
}

.event-type {
  color: #475569;
  background: #f1f5f9;
}

.event-type--check-in,
.event-type--break-end {
  color: #1d4ed8;
  background: #eff6ff;
  border-color: #93c5fd;
}

.event-type--break-start {
  color: #92400e;
  background: #fffbeb;
  border-color: #fcd34d;
}

.event-type--check-out {
  color: #991b1b;
  background: #fef2f2;
  border-color: #fecaca;
}

.request-column {
  width: 165px;
  text-align: right;
}

.request-action {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.complaint-status {
  color: #475569;
  background: #f8fafc;
}

.complaint-status--pending {
  color: #92400e;
  background: #fffbeb;
  border-color: #fcd34d;
}

.complaint-status--approved {
  color: #1d4ed8;
  background: #eff6ff;
  border-color: #93c5fd;
}

.complaint-status--rejected {
  color: #991b1b;
  background: #fef2f2;
  border-color: #fecaca;
}

.correction-button {
  display: inline-grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  padding: 0;
  color: #ffffff;
  background: #2563eb;
  border: 1px solid #1d4ed8;
  border-radius: 6px;
  font-size: 17px;
  font-weight: 800;
}

.correction-button:hover:not(:disabled) {
  background: #1d4ed8;
}

.correction-button:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.correction-button:disabled {
  color: #94a3b8;
  background: #f1f5f9;
  border-color: #cbd5e1;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .details-header {
    align-items: flex-start;
  }

  .details-header h2 {
    font-size: 16px;
  }

  th,
  td {
    padding: 12px 14px;
  }
}
</style>
