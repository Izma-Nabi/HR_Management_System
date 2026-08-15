<script setup lang="ts">
import attendanceService from "~/services/attendance.service";

definePageMeta({
  layout: "dashboard"
});

const route = useRoute();
const complaintId = Number(route.params.id);
const reviewNote = ref("");
const correctedDate = ref("");
const correctedTime = ref("");
const loading = ref(true);
const submitting = ref(false);
const error = ref("");
const success = ref("");
const complaint = ref<any>(null);

const loadComplaint = async () => {
  loading.value = true;
  error.value = "";

  try {
    const complaints = await attendanceService.getAttendanceComplaints();

    complaint.value = complaints.find((item: any) => item.id === complaintId);

    if (!complaint.value) {
      throw new Error("Attendance change request not found");
    }

    correctedDate.value = complaint.value.requestedAttendanceDate;
    correctedTime.value = complaint.value.requestedEventTime;
    reviewNote.value = complaint.value.reviewNote || "";
  } catch (err: any) {
    error.value = err?.data?.message || err?.message || "Unable to load request";
  } finally {
    loading.value = false;
  }
};

const badgeClass = computed(() => {
  return complaint.value?.status?.toLowerCase() || "pending";
});

const formatLabel = (value: string | null | undefined) => {
  return value ? value.replaceAll("_", " ").toLowerCase() : "--";
};

const reviewComplaint = async (status: "APPROVED" | "REJECTED") => {
  if (!complaint.value || submitting.value) {
    return;
  }

  if (status === "APPROVED" && (!correctedDate.value || !correctedTime.value)) {
    error.value = "Attendance date and time are required before approval.";
    return;
  }

  submitting.value = true;
  error.value = "";
  success.value = "";

  try {
    const payload: Record<string, string> = {
      status,
      reviewNote: reviewNote.value
    };

    if (status === "APPROVED") {
      payload.attendanceDate = correctedDate.value;
      payload.correctedTime = correctedTime.value;
    }

    await attendanceService.reviewAttendanceComplaint(
      complaint.value.id,
      payload
    );

    success.value = `Attendance change request ${status.toLowerCase()} successfully.`;
    await loadComplaint();
  } catch (err: any) {
    error.value = err?.data?.message || "Unable to review attendance request";
  } finally {
    submitting.value = false;
  }
};

const goBack = () => {
  navigateTo("/dashboard/attendance-complaints");
};

onMounted(loadComplaint);
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Attendance Change Request</h1>
        <p>Review the employee-selected correction and approve or reject it.</p>
      </div>

      <button class="back-button" type="button" @click="goBack">
        ← Back
      </button>
    </header>

    <div v-if="loading" class="notice notice--neutral">
      Loading attendance request...
    </div>

    <div v-else-if="!complaint" class="notice notice--error">
      {{ error || "Attendance change request not found." }}
    </div>

    <template v-else>
      <div v-if="success" class="notice notice--success" role="status">
        {{ success }}
      </div>

      <div v-if="error" class="notice notice--error" role="alert">
        {{ error }}
      </div>

      <article class="card">
        <header class="card-header">
          <div>
            <span class="eyebrow">Request #{{ complaint.id }}</span>
            <h2>{{ complaint.user.firstName }} {{ complaint.user.lastName }}</h2>
          </div>

          <span class="badge" :class="`badge--${badgeClass}`">
            {{ complaint.status }}
          </span>
        </header>

        <section class="section">
          <h3>Employee information</h3>
          <div class="detail-grid">
            <div>
              <span class="detail-label">User code</span>
              <strong>{{ complaint.user.userCode || "--" }}</strong>
            </div>
            <div>
              <span class="detail-label">Department</span>
              <strong>{{ complaint.user.department?.departmentName || "--" }}</strong>
            </div>
            <div>
              <span class="detail-label">Designation</span>
              <strong>{{ complaint.user.designation?.designationName || "--" }}</strong>
            </div>
          </div>
        </section>

        <section class="section">
          <h3>Employee request</h3>
          <div class="request-summary">
            <div>
              <span class="detail-label">Selected day</span>
              <strong>{{ complaint.attendanceDate }}</strong>
            </div>
            <div>
              <span class="detail-label">Action</span>
              <strong class="capitalize">{{ formatLabel(complaint.requestAction) }}</strong>
            </div>
            <div>
              <span class="detail-label">Attendance type</span>
              <strong class="capitalize">{{ formatLabel(complaint.complaintType) }}</strong>
            </div>
            <div>
              <span class="detail-label">Requested date</span>
              <strong>{{ complaint.requestedAttendanceDate }}</strong>
            </div>
            <div>
              <span class="detail-label">Corrected time</span>
              <strong>{{ complaint.requestedEventTime }}</strong>
            </div>
          </div>

          <span class="detail-label reason-label">Employee reason</span>
          <div class="reason-box">{{ complaint.reason }}</div>
        </section>

        <section v-if="complaint.status === 'PENDING'" class="section review-section">
          <div class="section-heading">
            <div>
              <h3>Admin review</h3>
              <p>The employee values are pre-filled. Change only the date or time if needed.</p>
            </div>
          </div>

          <div class="form-grid">
            <label>
              <span>Attendance date</span>
              <input v-model="correctedDate" type="date" :disabled="submitting">
            </label>

            <label>
              <span>Attendance time</span>
              <input v-model="correctedTime" type="time" :disabled="submitting">
            </label>

            <label class="full-width">
              <span>Review note (optional)</span>
              <textarea
                v-model="reviewNote"
                rows="4"
                maxlength="2000"
                placeholder="Add a note for the employee"
                :disabled="submitting"
              />
            </label>
          </div>

          <div class="actions">
            <button
              class="reject-button"
              type="button"
              :disabled="submitting"
              @click="reviewComplaint('REJECTED')"
            >
              Reject
            </button>
            <button
              class="approve-button"
              type="button"
              :disabled="submitting || !correctedDate || !correctedTime"
              @click="reviewComplaint('APPROVED')"
            >
              {{ submitting ? "Processing..." : "Approve request" }}
            </button>
          </div>
        </section>

        <section v-else class="section completed-section">
          <h3>Review completed</h3>
          <p>
            This request was <strong>{{ complaint.status.toLowerCase() }}</strong>.
          </p>
          <div v-if="complaint.reviewNote" class="review-note">
            {{ complaint.reviewNote }}
          </div>
        </section>
      </article>
    </template>
  </div>
</template>

<style scoped>
.page {
  width: min(100%, 1040px);
  margin: 0 auto;
  padding: 24px;
}

.page-header,
.card-header,
.section-heading,
.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-header {
  margin-bottom: 22px;
}

.page-header h1,
.card-header h2,
.section h3 {
  margin: 0;
  color: #172033;
}

.page-header h1 {
  font-size: 30px;
}

.page-header p,
.section-heading p,
.completed-section p {
  margin: 6px 0 0;
  color: #64748b;
}

.back-button,
.approve-button,
.reject-button {
  min-height: 40px;
  padding: 8px 16px;
  border-radius: 7px;
  font-weight: 700;
  cursor: pointer;
}

.back-button {
  color: #334155;
  background: #ffffff;
  border: 1px solid #cbd5e1;
}

.notice {
  margin-bottom: 18px;
  padding: 12px 14px;
  border: 1px solid;
  border-radius: 7px;
}

.notice--neutral {
  color: #475569;
  background: #ffffff;
  border-color: #e2e8f0;
}

.notice--success {
  color: #166534;
  background: #f0fdf4;
  border-color: #86efac;
}

.notice--error {
  color: #991b1b;
  background: #fef2f2;
  border-color: #fecaca;
}

.card {
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 12px 30px rgb(15 23 42 / 6%);
}

.card-header {
  padding: 22px 24px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.card-header h2 {
  margin-top: 4px;
  font-size: 22px;
}

.eyebrow,
.detail-label,
.form-grid label > span {
  display: block;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.badge {
  padding: 7px 12px;
  border: 1px solid;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
}

.badge--pending {
  color: #92400e;
  background: #fffbeb;
  border-color: #fcd34d;
}

.badge--approved {
  color: #166534;
  background: #f0fdf4;
  border-color: #86efac;
}

.badge--rejected {
  color: #991b1b;
  background: #fef2f2;
  border-color: #fecaca;
}

.section {
  padding: 24px;
  border-bottom: 1px solid #e2e8f0;
}

.section:last-child {
  border-bottom: 0;
}

.section h3 {
  margin-bottom: 16px;
  font-size: 17px;
}

.detail-grid,
.request-summary,
.form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.detail-grid > div,
.request-summary > div {
  min-width: 0;
  padding: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
}

.detail-grid strong,
.request-summary strong {
  display: block;
  margin-top: 6px;
  overflow: hidden;
  color: #1e293b;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.capitalize {
  text-transform: capitalize;
}

.reason-label {
  margin-top: 20px;
}

.reason-box,
.review-note {
  margin-top: 7px;
  padding: 14px;
  color: #334155;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.review-section {
  background: #fcfdff;
}

.section-heading {
  align-items: flex-start;
  margin-bottom: 18px;
}

.section-heading h3 {
  margin-bottom: 0;
}

.section-heading p {
  font-size: 13px;
}

.form-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.form-grid label > span {
  margin-bottom: 7px;
}

.full-width {
  grid-column: 1 / -1;
}

input,
textarea {
  width: 100%;
  color: #172033;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  outline: none;
}

input {
  height: 42px;
  padding: 0 12px;
}

textarea {
  min-height: 104px;
  padding: 11px 12px;
  resize: vertical;
}

input:focus,
textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgb(37 99 235 / 12%);
}

.actions {
  justify-content: flex-end;
  margin-top: 20px;
}

.approve-button {
  color: #ffffff;
  background: #16a34a;
  border: 1px solid #15803d;
}

.reject-button {
  color: #b91c1c;
  background: #ffffff;
  border: 1px solid #fca5a5;
}

.approve-button:disabled,
.reject-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.completed-section {
  background: #f8fafc;
}

@media (max-width: 720px) {
  .page {
    padding: 16px;
  }

  .page-header,
  .card-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .page-header h1 {
    font-size: 26px;
  }

  .detail-grid,
  .request-summary,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .full-width {
    grid-column: auto;
  }

  .actions {
    align-items: stretch;
    flex-direction: column-reverse;
  }
}
</style>
