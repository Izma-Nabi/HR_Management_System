<script setup lang="ts">
import attendanceService from "~/services/attendance.service";

definePageMeta({
  layout: "dashboard",
});

const route = useRoute();
const complaintId = Number(route.params.id);
const reviewNote = ref("");
const loading = ref(true);
const submitting = ref(false);
const error = ref("");
const success = ref("");
const showEditOptions = ref(false);
const complaint = ref<any>(null);
const showEdit = ref(false);

const loadComplaint = async () => {
  loading.value = true;

  try {
    const complaints = await attendanceService.getAttendanceComplaints();

    complaint.value = complaints.find((item: any) => item.id === complaintId);

    if (!complaint.value) {
      error.value = "Complaint not found";
    }
  } catch (err: any) {
    error.value = err?.data?.message || "Unable to load complaint";
  } finally {
    loading.value = false;
  }
};

const badgeClass = computed(() => {
  if (!complaint.value) {
    return "";
  }

  switch (complaint.value.status) {
    case "APPROVED":
      return "approved";

    case "REJECTED":
      return "rejected";

    default:
      return "pending";
  }
});

const reviewComplaint = async (status: "APPROVED" | "REJECTED") => {
  if (!complaint.value) return;

  submitting.value = true;
  error.value = "";

  try {
    await attendanceService.reviewAttendanceComplaint(complaint.value.id, {
      status,
      reviewNote: reviewNote.value,
    });

    success.value = `Complaint ${status.toLowerCase()} successfully.`;

    await loadComplaint();
  } catch (err: any) {
    error.value = err?.data?.message || "Unable to review complaint";
  } finally {
    submitting.value = false;
  }
};

const rejectComplaint = async () => {
  await attendanceService.reviewAttendanceComplaint(complaint.value.id, {
    status: "REJECTED",
    reviewNote: "Rejected by admin",
  });

  success.value = "Complaint rejected";
  await loadComplaint();
};

const openEditExisting = () => {
  if (!complaint.value) return;
  showEditOptions.value = false;

  navigateTo({
    path: "/dashboard/attendance-complaints/update",
    query: {
      mode: "edit",
      complaintId: complaint.value.id,
      userId: complaint.value.user.id,
      attendanceDate: complaint.value.attendanceDate,
      complaintType: complaint.value.complaintType,
    },
  });
};

const openInsertAttendance = () => {
  if (!complaint.value) return;
  showEditOptions.value = false;

  navigateTo({
    path: "/dashboard/attendance-complaints/update",
    query: {
      mode: "insert",
      complaintId: complaint.value.id,
      userId: complaint.value.user.id,
      attendanceDate: complaint.value.attendanceDate,
      complaintType: complaint.value.complaintType,
    },
  });
};

const goBack = () => {
  navigateTo("/dashboard/attendance-complaints");
};

onMounted(loadComplaint);
</script>

<template>
  <div class="page">
    <div class="header">
      <div>
        <h1>Attendance Complaint</h1>
        <p>Review employee attendance complaint</p>
      </div>

      <button class="back-btn" @click="goBack">← Back</button>
    </div>

    <div v-if="loading" class="loading">Loading complaint...</div>

    <div v-else-if="error" class="error-box">
      {{ error }}
    </div>

    <div v-else>
      <div v-if="success" class="success-box">
        {{ success }}
      </div>

      <div class="card">
        <div class="card-header">
          <h2>Complaint #{{ complaint.id }}</h2>

          <span class="badge" :class="badgeClass">
            {{ complaint.status }}
          </span>
        </div>

        <div class="section">
          <h3>Employee Information</h3>

          <div class="grid">
            <div>
              <label>Name</label>
              <p>
                {{ complaint.user.firstName }}
                {{ complaint.user.lastName }}
              </p>
            </div>

            <div>
              <label>User Code</label>
              <p>{{ complaint.user.userCode }}</p>
            </div>

            <div>
              <label>Department</label>
              <p>
                {{
                  complaint.user.department?.name ??
                  complaint.user.department ??
                  "-"
                }}
              </p>
            </div>

            <div>
              <label>Designation</label>
              <p>
                {{
                  complaint.user.designation?.name ??
                  complaint.user.designation ??
                  "-"
                }}
              </p>
            </div>
          </div>
        </div>

        <div class="section">
          <h3>Attendance Details</h3>

          <div class="grid">
            <div>
              <label>Date</label>
              <p>{{ complaint.attendanceDate }}</p>
            </div>

            <div>
              <label>Event</label>
              <p>{{ complaint.rawAttendance.eventType }}</p>
            </div>

            <div>
              <label>Event Time</label>
              <p>{{ complaint.rawAttendance.eventTime }}</p>
            </div>

            <div>
              <label>Daily Status</label>
              <p>{{ complaint.dailyAttendance.status }}</p>
            </div>
          </div>
        </div>

        <div class="section">
          <h3>Complaint Details</h3>

          <div class="grid">
            <div>
              <label>Complaint Type</label>
              <p>{{ complaint.complaintType }}</p>
            </div>

            <div>
              <label>Submitted On</label>
              <p>{{ complaint.createdAt }}</p>
            </div>
          </div>

          <label class="reason-label"> Employee Reason </label>

          <div class="reason-box">
            {{ complaint.reason }}
          </div>

          <div v-if="complaint.reviewNote" class="review-section">
            <label>Previous Review Note</label>

            <div class="review-box">
              {{ complaint.reviewNote }}
            </div>
          </div>

          <div v-if="complaint.status === 'PENDING'" class="review-section">
            <label>Add Review Note</label>

            <textarea
              v-model="reviewNote"
              rows="5"
              placeholder="Write a review note (optional)..."
            />

            <div class="actions">
              <button class="approve-btn" @click="showEditOptions = true">
                Edit Attendance
              </button>

              <button
                class="reject-btn"
                :disabled="submitting"
                @click="reviewComplaint('REJECTED')"
              >
                {{ submitting ? "Processing..." : "Reject" }}
              </button>
            </div>

            <!-- Attendance Correction Choice Modal -->

            <div v-if="showEditOptions" class="edit-overlay">
              <div class="edit-card">
                <div class="edit-header">
                  <h2>Attendance Correction</h2>

                  <button class="close-btn" @click="showEditOptions = false">
                    ×
                  </button>
                </div>

                <p class="edit-description">
                  Select the action you want to perform.
                </p>

                <div class="edit-options">
                  <button class="option-card" @click="openEditExisting">
                    <h3>Edit Existing Attendance</h3>

                    <p>
                      Modify current check-in, check-out, status or remarks.
                    </p>
                  </button>

                  <button class="option-card" @click="openInsertAttendance">
                    <h3>Insert New Attendance</h3>

                    <p>Create a new attendance entry for this employee.</p>
                  </button>
                </div>

                <button class="cancel-btn" @click="showEditOptions = false">
                  Cancel
                </button>
              </div>
            </div>
          </div>

          <div v-else class="completed-box">
            <h3>Complaint Reviewed</h3>

            <p>
              This complaint has already been
              <strong>
                {{ complaint.status.toLowerCase() }} </strong
              >.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header h1 {
  margin: 0;
  font-size: 30px;
  color: #1e293b;
}

.header p {
  margin-top: 6px;
  color: #64748b;
}

.back-btn {
  border: none;
  background: #475569;
  color: white;
  padding: 10px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: 0.2s;
}

.back-btn:hover {
  background: #334155;
}

.loading,
.error-box,
.success-box {
  padding: 16px;
  border-radius: 10px;
  margin-bottom: 20px;
}

.loading {
  background: #f8fafc;
  color: #475569;
}

.error-box {
  background: #fee2e2;
  color: #991b1b;
}

.success-box {
  background: #dcfce7;
  color: #166534;
}

.card {
  background: white;
  border-radius: 14px;
  padding: 28px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.card-header h2 {
  margin: 0;
  color: #1e293b;
}

.section {
  margin-bottom: 30px;
}

.section h3 {
  margin-bottom: 18px;
  color: #334155;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 10px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}

label {
  display: block;
  font-size: 12px;
  text-transform: uppercase;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 6px;
}

p {
  margin: 0;
  color: #1e293b;
  font-size: 15px;
}

.reason-label {
  margin-top: 24px;
}

.reason-box,
.review-box {
  margin-top: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
  white-space: pre-wrap;
  line-height: 1.7;
}

.review-section {
  margin-top: 28px;
}

textarea {
  width: 100%;
  margin-top: 10px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 14px;
  resize: vertical;
  min-height: 140px;
  font-size: 14px;
}

textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 14px;
  margin-top: 24px;
}

.approve-btn,
.reject-btn {
  border: none;
  color: white;
  padding: 12px 22px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: 0.2s;
}

.approve-btn {
  background: #16a34a;
}

.approve-btn:hover:not(:disabled) {
  background: #15803d;
}

.reject-btn {
  background: #dc2626;
}

.reject-btn:hover:not(:disabled) {
  background: #b91c1c;
}

.approve-btn:disabled,
.reject-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.completed-box {
  margin-top: 30px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  padding: 18px;
}

.completed-box h3 {
  margin-top: 0;
  color: #1d4ed8;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 7px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.pending {
  background: #fef3c7;
  color: #92400e;
}

.approved {
  background: #dcfce7;
  color: #166534;
}

.rejected {
  background: #fee2e2;
  color: #991b1b;
}

@media (max-width: 768px) {
  .page {
    padding: 16px;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .actions {
    flex-direction: column;
  }

  .approve-btn,
  .reject-btn {
    width: 100%;
  }
}

.edit-card {
  margin-top: 20px;
  padding: 20px;
  background: white;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.edit-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 20px;
}

.edit-overlay .edit-card {
  margin-top: 0;
  width: 100%;
  max-width: 480px;
  padding: 28px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
}

.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.edit-header h2 {
  margin: 0;
  font-size: 20px;
  color: #1e293b;
}

.close-btn {
  border: none;
  background: transparent;
  font-size: 22px;
  line-height: 1;
  color: #64748b;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}

.close-btn:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.edit-description {
  color: #64748b;
  font-size: 14px;
  margin: 0 0 20px 0;
}

.edit-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.option-card {
  text-align: left;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 10px;
  padding: 16px;
  cursor: pointer;
  transition: 0.18s;
}

.option-card:hover {
  border-color: #6366f1;
  background: #eef2ff;
  transform: translateY(-1px);
}

.option-card h3 {
  margin: 0 0 4px 0;
  color: #1e293b;
  font-size: 15px;
}

.option-card p {
  margin: 0;
  color: #64748b;
  font-size: 13px;
}

.cancel-btn {
  width: 100%;
  border: none;
  background: #94a3b8;
  color: white;
  padding: 12px 22px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: 0.2s;
}

.cancel-btn:hover {
  background: #64748b;
}

.edit-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.edit-card input,
.edit-card select,
.edit-card textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
}

.edit-card label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
}
</style>