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

const {
  selectedRequest,
  decisionNote,
  formatDate,
  canApprove
} = defineProps<{
  selectedRequest: LeaveRequest | null;
  decisionNote: string;
  formatDate: (date: string) => string;
  canApprove: boolean;
}>();

const emit = defineEmits<{
  (e: "update:props.decisionNote", value: string): void;
  (e: "updateDecision", status: "APPROVED" | "REJECTED"): void;
}>();
</script>

<template>
  <aside class="review-panel">
    <template v-if="selectedRequest">

      <div class="panel-header">
        <div>
          <span class="eyebrow">
            {{ selectedRequest.requestCode }}
          </span>

          <h2>
            {{ selectedRequest.requesterName }}
          </h2>

          <p>
            {{ selectedRequest.requesterCode }}
            -
            {{ selectedRequest.department }}
          </p>
        </div>

        <span
          class="status-pill"
          :class="selectedRequest.status.toLowerCase()"
        >
          {{ selectedRequest.status }}
        </span>
      </div>

      <dl class="details-grid">
        <div>
          <dt>Leave Type</dt>
          <dd>{{ selectedRequest.type }}</dd>
        </div>

        <div>
          <dt>Total Days</dt>
          <dd>{{ selectedRequest.days }}</dd>
        </div>

        <div>
          <dt>Start Date</dt>
          <dd>{{ formatDate(selectedRequest.startDate) }}</dd>
        </div>

        <div>
          <dt>End Date</dt>
          <dd>{{ formatDate(selectedRequest.endDate) }}</dd>
        </div>
      </dl>

      <section class="note-section">
        <h3>Reason</h3>
        <p>{{ selectedRequest.reason }}</p>
      </section>

      <!-- Decision Summary (Visible to Everyone) -->
      <section class="decision-summary">
        <h3>Decision</h3>

        <p>
          {{ selectedRequest.decisionNote || "No note added." }}
        </p>

        <span>
          {{ selectedRequest.approverName || "-" }}
          -
          {{ selectedRequest.decidedAt || "-" }}
        </span>
      </section>

      <!-- Only HR / Team Lead / Super Admin can approve -->
      <section
        v-if="canApprove && selectedRequest.status === 'PENDING'"
        class="decision-box"
      >
        <label for="decision-note">
          Decision Note
        </label>

        <textarea
          id="decision-note"
          :value="decisionNote"
          rows="4"
          placeholder="Add an optional note..."
          @input="
            emit(
              'update:decisionNote',
              ($event.target as HTMLTextAreaElement).value
            )
          "
        />

        <div class="decision-actions">
          <button
            class="reject-btn"
            @click="emit('updateDecision', 'REJECTED')"
          >
            Reject
          </button>

          <button
            class="approve-btn"
            @click="emit('updateDecision', 'APPROVED')"
          >
            Approve
          </button>
        </div>
      </section>

    </template>

    <div
      v-else
      class="empty"
    >
      Select a leave request.
    </div>
  </aside>
</template>

<style scoped>
.review-panel {
  padding: 18px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eef2f7;
}

.eyebrow {
  display: block;
  margin-bottom: 6px;
  color: #4f46e5;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.panel-header h2 {
  margin: 0 0 5px;
  color: #111827;
  font-size: 22px;
}

.panel-header p {
  color: #6b7280;
  font-size: 13px;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 16px 0;
}

.details-grid div {
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #eef2f7;
  border-radius: 8px;
}

.details-grid dt {
  margin-bottom: 4px;
  color: #6b7280;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.details-grid dd {
  margin: 0;
  color: #111827;
  font-weight: 900;
}

.note-section,
.decision-box,
.decision-summary {
  padding-top: 16px;
  border-top: 1px solid #eef2f7;
}

.note-section h3,
.decision-box label,
.decision-summary h3 {
  display: block;
  margin-bottom: 8px;
  color: #374151;
  font-size: 14px;
  font-weight: 900;
}

.note-section p,
.decision-summary p {
  margin: 0;
  color: #4b5563;
  line-height: 1.55;
}

.decision-box {
  margin-top: 16px;
}

.decision-box textarea {
  width: 100%;
  min-height: 104px;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  resize: vertical;
}

.decision-box textarea:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79,70,229,.12);
  outline: none;
}

.decision-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 12px;
}

.approve-btn,
.reject-btn {
  min-height: 40px;
  padding: 9px 16px;
  border-radius: 8px;
  font-weight: 900;
  cursor: pointer;
}

.approve-btn {
  color: white;
  background: #15803d;
  border: 1px solid #15803d;
}

.reject-btn {
  color: #991b1b;
  background: white;
  border: 1px solid #fecaca;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
}

.status-pill.pending {
  color: #92400e;
  background: #fffbeb;
  border: 1px solid #fcd34d;
}

.status-pill.approved {
  color: #166534;
  background: #ecfdf3;
  border: 1px solid #86efac;
}

.status-pill.rejected {
  color: #991b1b;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.status-pill.cancelled {
  color: #374151;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
}

.empty {
  padding: 16px;
  color: #6b7280;
  font-weight: 800;
}

@media (max-width:760px){
  .details-grid{
    grid-template-columns:1fr;
  }

  .panel-header,
  .decision-actions{
    flex-direction:column;
    align-items:stretch;
  }

  .approve-btn,
  .reject-btn{
    width:100%;
  }
}
</style>