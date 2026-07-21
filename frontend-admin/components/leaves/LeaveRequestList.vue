<script setup lang="ts">
type LeaveStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

type LeaveType =
  | "ANNUAL"
  | "SICK"
  | "CASUAL"
  | "UNPAID"
  | "OTHER";

type LeaveRequest = {
  id: number;
  requestCode: string;
  requesterName: string;
  requesterCode: string;
  requesterRole: "ADMIN" | "EMPLOYEE";
  department: string;
  type: LeaveType;
  status: LeaveStatus;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  submittedAt: string;
  approverName: string | null;
  decisionNote: string | null;
  decidedAt: string | null;
};

const props = defineProps<{
  filteredRequests: LeaveRequest[];
  selectedRequestId: number | null;
  formatDate: (date: string) => string;
}>();

const emit = defineEmits<{
  (e: "select", id: number): void;
}>();
</script>

<template>
  <section class="request-list" aria-label="Leave request list">
    <div
      v-for="request in props.filteredRequests"
      :key="request.id"
      class="request-row"
      :class="{ active: props.selectedRequestId === request.id }"
      role="button"
      tabindex="0"
      @click="emit('select', request.id)"
      @keydown.enter="emit('select', request.id)"
    >
      <div class="request-main">
        <div>
          <strong>{{ request.requesterName }}</strong>
          <span>{{ request.requestCode }} - {{ request.requesterCode }}</span>
        </div>

        <span
          class="status-pill"
          :class="request.status.toLowerCase()"
        >
          {{ request.status }}
        </span>
      </div>

      <div class="request-meta">
        <span>{{ request.department }}</span>
        <span>{{ request.type }}</span>
        <span>
          {{ request.days }}
          day{{ request.days === 1 ? "" : "s" }}
        </span>
      </div>

      <div class="date-range">
        {{ props.formatDate(request.startDate) }}
        -
        {{ props.formatDate(request.endDate) }}
      </div>
    </div>

    <div
      v-if="props.filteredRequests.length === 0"
      class="empty"
    >
      No leave requests found.
    </div>
  </section>
</template>

<style scoped>
.request-list {
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.request-row {
  padding: 16px;
  border-bottom: 1px solid #eef2f7;
  cursor: pointer;
}

.request-row:hover,
.request-row.active {
  background: #f8fafc;
}

.request-row.active {
  box-shadow: inset 4px 0 0 #4f46e5;
}

.request-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}

.request-main strong {
  display: block;
  margin-bottom: 4px;
  color: #111827;
}

.request-main span,
.request-meta,
.date-range {
  color: #6b7280;
  font-size: 13px;
}

.request-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.request-meta span {
  padding-right: 8px;
  border-right: 1px solid #d1d5db;
}

.request-meta span:last-child {
  border-right: 0;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 4px 9px;
  border: 1px solid #d1d5db;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
}

.status-pill.pending {
  color: #92400e;
  background: #fffbeb;
  border-color: #fcd34d;
}

.status-pill.approved {
  color: #166534;
  background: #ecfdf3;
  border-color: #86efac;
}

.status-pill.rejected {
  color: #991b1b;
  background: #fef2f2;
  border-color: #fecaca;
}

.status-pill.cancelled {
  color: #374151;
  background: #f3f4f6;
  border-color: #d1d5db;
}

.empty {
  padding: 16px;
  color: #6b7280;
  font-weight: 800;
}

@media (max-width: 760px) {
  .request-main {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>