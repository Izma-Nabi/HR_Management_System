<script setup lang="ts">
type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
type LeaveType = "ANNUAL" | "SICK" | "CASUAL" | "UNPAID" | "OTHER";

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

definePageMeta({
  layout: "dashboard"
});

const search = ref("");
const statusFilter = ref<LeaveStatus | "ALL">("PENDING");
const typeFilter = ref<LeaveType | "ALL">("ALL");
const selectedRequestId = ref<number | null>(1);
const decisionNote = ref("");

const leaveRequests = ref<LeaveRequest[]>([
  {
    id: 1,
    requestCode: "LV-1008",
    requesterName: "Ayesha Khan",
    requesterCode: "ADM004",
    requesterRole: "ADMIN",
    department: "Operations",
    type: "SICK",
    status: "PENDING",
    startDate: "2026-07-16",
    endDate: "2026-07-17",
    days: 2,
    reason: "Medical appointment and recovery.",
    submittedAt: "2026-07-15 09:20",
    approverName: null,
    decisionNote: null,
    decidedAt: null
  },
  {
    id: 2,
    requestCode: "LV-1007",
    requesterName: "Bilal Ahmed",
    requesterCode: "ADM002",
    requesterRole: "ADMIN",
    department: "Human Resources",
    type: "ANNUAL",
    status: "PENDING",
    startDate: "2026-07-21",
    endDate: "2026-07-23",
    days: 3,
    reason: "Family travel.",
    submittedAt: "2026-07-14 17:45",
    approverName: null,
    decisionNote: null,
    decidedAt: null
  },
  {
    id: 3,
    requestCode: "LV-1006",
    requesterName: "Hira Malik",
    requesterCode: "ADM003",
    requesterRole: "ADMIN",
    department: "Finance",
    type: "CASUAL",
    status: "APPROVED",
    startDate: "2026-07-15",
    endDate: "2026-07-15",
    days: 1,
    reason: "Personal work.",
    submittedAt: "2026-07-12 11:10",
    approverName: "Super Admin",
    decisionNote: "Coverage confirmed with Finance team.",
    decidedAt: "2026-07-13 10:05"
  },
  {
    id: 4,
    requestCode: "LV-1005",
    requesterName: "Usman Raza",
    requesterCode: "ADM001",
    requesterRole: "ADMIN",
    department: "Technology",
    type: "UNPAID",
    status: "REJECTED",
    startDate: "2026-07-18",
    endDate: "2026-07-20",
    days: 3,
    reason: "Out of city commitment.",
    submittedAt: "2026-07-10 15:30",
    approverName: "Super Admin",
    decisionNote: "Release window requires admin coverage.",
    decidedAt: "2026-07-11 09:00"
  }
]);

const statusOptions: Array<LeaveStatus | "ALL"> = ["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"];
const typeOptions: Array<LeaveType | "ALL"> = ["ALL", "ANNUAL", "SICK", "CASUAL", "UNPAID", "OTHER"];

const selectedRequest = computed(() => {
  return leaveRequests.value.find((request) => request.id === selectedRequestId.value) || null;
});

const filteredRequests = computed(() => {
  const keyword = search.value.trim().toLowerCase();

  return leaveRequests.value.filter((request) => {
    const matchesStatus = statusFilter.value === "ALL" || request.status === statusFilter.value;
    const matchesType = typeFilter.value === "ALL" || request.type === typeFilter.value;
    const matchesSearch = !keyword
      || request.requestCode.toLowerCase().includes(keyword)
      || request.requesterName.toLowerCase().includes(keyword)
      || request.requesterCode.toLowerCase().includes(keyword)
      || request.department.toLowerCase().includes(keyword);

    return matchesStatus && matchesType && matchesSearch;
  });
});

const summary = computed(() => {
  return {
    pending: leaveRequests.value.filter((request) => request.status === "PENDING").length,
    approved: leaveRequests.value.filter((request) => request.status === "APPROVED").length,
    rejected: leaveRequests.value.filter((request) => request.status === "REJECTED").length,
    totalDays: leaveRequests.value
      .filter((request) => request.status === "APPROVED")
      .reduce((total, request) => total + request.days, 0)
  };
});

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(new Date(`${date}T00:00:00`));
};

const updateDecision = (status: "APPROVED" | "REJECTED") => {
  if (!selectedRequest.value || selectedRequest.value.status !== "PENDING") {
    return;
  }

  const now = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date());

  leaveRequests.value = leaveRequests.value.map((request) => {
    if (request.id !== selectedRequest.value?.id) {
      return request;
    }

    return {
      ...request,
      status,
      approverName: "Super Admin",
      decisionNote: decisionNote.value.trim() || null,
      decidedAt: now
    };
  });

  decisionNote.value = "";
};
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Leave Requests</h1>
        <p>Review administrator leave requests</p>
      </div>
    </div>

    <div class="summary-grid">
      <section class="summary-card pending">
        <span>Pending</span>
        <strong>{{ summary.pending }}</strong>
      </section>
      <section class="summary-card approved">
        <span>Approved</span>
        <strong>{{ summary.approved }}</strong>
      </section>
      <section class="summary-card rejected">
        <span>Rejected</span>
        <strong>{{ summary.rejected }}</strong>
      </section>
      <section class="summary-card days">
        <span>Approved Days</span>
        <strong>{{ summary.totalDays }}</strong>
      </section>
    </div>

    <div class="toolbar">
      <input
        v-model="search"
        type="text"
        placeholder="Search by request, name, code, or department..."
      >

      <select v-model="statusFilter">
        <option v-for="status in statusOptions" :key="status" :value="status">
          {{ status === "ALL" ? "All statuses" : status }}
        </option>
      </select>

      <select v-model="typeFilter">
        <option v-for="type in typeOptions" :key="type" :value="type">
          {{ type === "ALL" ? "All leave types" : type }}
        </option>
      </select>
    </div>

    <div class="work-area">
      <section class="request-list" aria-label="Leave request list">
        <div
          v-for="request in filteredRequests"
          :key="request.id"
          class="request-row"
          :class="{ active: selectedRequestId === request.id }"
          role="button"
          tabindex="0"
          @click="selectedRequestId = request.id"
          @keydown.enter="selectedRequestId = request.id"
        >
          <div class="request-main">
            <div>
              <strong>{{ request.requesterName }}</strong>
              <span>{{ request.requestCode }} - {{ request.requesterCode }}</span>
            </div>
            <span class="status-pill" :class="request.status.toLowerCase()">
              {{ request.status }}
            </span>
          </div>

          <div class="request-meta">
            <span>{{ request.department }}</span>
            <span>{{ request.type }}</span>
            <span>{{ request.days }} day{{ request.days === 1 ? "" : "s" }}</span>
          </div>

          <div class="date-range">
            {{ formatDate(request.startDate) }} - {{ formatDate(request.endDate) }}
          </div>
        </div>

        <div v-if="filteredRequests.length === 0" class="empty">
          No leave requests found.
        </div>
      </section>

      <aside class="review-panel">
        <template v-if="selectedRequest">
          <div class="panel-header">
            <div>
              <span class="eyebrow">{{ selectedRequest.requestCode }}</span>
              <h2>{{ selectedRequest.requesterName }}</h2>
              <p>{{ selectedRequest.requesterCode }} - {{ selectedRequest.department }}</p>
            </div>
            <span class="status-pill" :class="selectedRequest.status.toLowerCase()">
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

          <section v-if="selectedRequest.status === 'PENDING'" class="decision-box">
            <label for="decision-note">Decision note</label>
            <textarea
              id="decision-note"
              v-model="decisionNote"
              rows="4"
              placeholder="Add an optional note for this decision..."
            />

            <div class="decision-actions">
              <button class="reject-btn" type="button" @click="updateDecision('REJECTED')">
                Reject
              </button>
              <button class="approve-btn" type="button" @click="updateDecision('APPROVED')">
                Approve
              </button>
            </div>
          </section>

          <section v-else class="decision-summary">
            <h3>Decision</h3>
            <p>{{ selectedRequest.decisionNote || "No note added." }}</p>
            <span>
              {{ selectedRequest.approverName }} - {{ selectedRequest.decidedAt }}
            </span>
          </section>
        </template>

        <div v-else class="empty">
          Select a leave request.
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 1240px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.page-header h1 {
  margin: 0 0 6px;
  color: #1f2937;
  font-size: 30px;
}

.page-header p {
  margin: 0;
  color: #6b7280;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.summary-card {
  min-height: 92px;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-left: 4px solid #6b7280;
  border-radius: 8px;
}

.summary-card span {
  display: block;
  margin-bottom: 8px;
  color: #6b7280;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
}

.summary-card strong {
  color: #111827;
  font-size: 30px;
}

.summary-card.pending {
  border-left-color: #d97706;
}

.summary-card.approved {
  border-left-color: #15803d;
}

.summary-card.rejected {
  border-left-color: #dc2626;
}

.summary-card.days {
  border-left-color: #2563eb;
}

.toolbar {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) 180px 180px;
  gap: 12px;
  margin-bottom: 18px;
}

.toolbar input,
.toolbar select,
.decision-box textarea {
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  color: #111827;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  outline: none;
}

.toolbar input:focus,
.toolbar select:focus,
.decision-box textarea:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
}

.work-area {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 390px;
  gap: 18px;
  align-items: start;
}

.request-list,
.review-panel {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.request-list {
  overflow: hidden;
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
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.request-main strong,
.panel-header h2 {
  color: #111827;
}

.request-main strong {
  display: block;
  margin-bottom: 4px;
}

.request-main span,
.request-meta,
.date-range,
.panel-header p,
.decision-summary span {
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

.review-panel {
  padding: 18px;
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
  font-size: 22px;
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
  margin: 0 0 8px;
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
  min-height: 104px;
  resize: vertical;
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
  color: #ffffff;
  background: #15803d;
  border: 1px solid #15803d;
}

.reject-btn {
  color: #991b1b;
  background: #ffffff;
  border: 1px solid #fecaca;
}

.empty {
  padding: 16px;
  color: #6b7280;
  font-weight: 800;
}

@media (max-width: 1050px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .work-area {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .page-header {
    align-items: stretch;
    flex-direction: column;
  }

  .summary-grid,
  .toolbar,
  .details-grid {
    grid-template-columns: 1fr;
  }

  .panel-header,
  .request-main,
  .decision-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .approve-btn,
  .reject-btn {
    width: 100%;
  }
}
</style>
