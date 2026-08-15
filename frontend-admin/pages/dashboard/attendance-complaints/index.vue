<script setup lang="ts">
import attendanceService from "~/services/attendance.service";

definePageMeta({
  layout: "dashboard",
});

type Complaint = {
  id: number;
  attendanceDate: string;
  requestedAttendanceDate: string;
  requestedEventTime: string;
  requestAction: "INSERT" | "EDIT";
  complaintType: string;
  reason: string;
  status: string;
  reviewNote: string | null;
  createdAt: string;

  user: {
    firstName: string;
    lastName: string;
    userCode: string;
    department?: {
      departmentName: string;
    } | null;
    designation?: {
      designationName: string;
    } | null;
  };

  rawAttendance: {
    eventType: string;
    eventTime: string;
  } | null;

  dailyAttendance: {
    firstCheckIn: string | null;
    finalCheckOut: string | null;
    status: string;
  };
};

const complaints = ref<Complaint[]>([]);
const loading = ref(false);
const error = ref("");
const success = ref("");

const reviewModal = ref(false);
const selectedComplaint = ref<Complaint | null>(null);

const reviewStatus = ref<"APPROVED" | "REJECTED">("APPROVED");
const reviewNote = ref("");

const loadComplaints = async () => {
  loading.value = true;
  error.value = "";

  try {
    complaints.value =
      await attendanceService.getAttendanceComplaints();
  } catch (err: any) {
    error.value =
      err?.data?.message ||
      "Unable to load attendance complaints.";
  } finally {
    loading.value = false;
  }
};

const openReview = (
  complaint: Complaint,
  status: "APPROVED" | "REJECTED"
) => {
  selectedComplaint.value = complaint;
  reviewStatus.value = status;
  reviewNote.value = "";
  reviewModal.value = true;
};

const closeReview = () => {
  reviewModal.value = false;
  selectedComplaint.value = null;
};

const submitReview = async () => {
  if (!selectedComplaint.value) return;

  try {
    await attendanceService.reviewAttendanceComplaint(
      selectedComplaint.value.id,
      {
        status: reviewStatus.value,
        reviewNote: reviewNote.value,
      }
    );

    success.value = "Complaint reviewed successfully.";

    closeReview();

    await loadComplaints();
  } catch (err: any) {
    error.value =
      err?.data?.message ||
      "Unable to review complaint.";
  }
};

const badgeClass = (status: string) => {
  switch (status) {
    case "APPROVED":
      return "approved";

    case "REJECTED":
      return "rejected";

    default:
      return "pending";
  }
};

const router = useRouter();


const goToComplaint = async (id: number) => {
  console.log("Navigating to:", id);

  await router.push(`/dashboard/attendance/attendance-complaints/${id}`);

  console.log("Current route:", router.currentRoute.value.fullPath);
};


const goBack = () => {
  navigateTo("/dashboard/attendance");
};


onMounted(loadComplaints);
</script>

<template>
  <div class="page">

    <div class="page-header">

      <div>
        <h1>Attendance Change Requests</h1>
        <p>Review employee-requested attendance inserts and edits.</p>
      </div>

      <button
        class="back-btn"
        @click="goBack"
        >
        ← Back
        </button>

    </div>

    <div
      v-if="success"
      class="success-box"
    >
      {{ success }}
    </div>

    <div
      v-if="error"
      class="error-box"
    >
      {{ error }}
    </div>

    <div
      v-if="loading"
      class="loading"
    >
      Loading complaints...
    </div>

    <div
      v-else
      class="table-wrapper"
    >

      <table>

        <thead>

          <tr>

            <th>Employee</th>

            <th>User Code</th>

            <th>Department</th>

            <th>Designation</th>

            <th>Requested Date</th>

            <th>Change</th>

            <th>Reason</th>

            <th>Status</th>

            <th>Action</th>

          </tr>

        </thead>

        <tbody>

          <tr
            v-for="complaint in complaints"
            :key="complaint.id"
          >

            <td>
              {{ complaint.user.firstName }}
              {{ complaint.user.lastName }}
            </td>

            <td>
              {{ complaint.user.userCode }}
            </td>

            <td>
              {{
                complaint.user.department?.departmentName ??
                "-"
              }}
            </td>

            <td>
              {{
                complaint.user.designation?.designationName ??
                "-"
              }}
            </td>

            <td>
              {{ complaint.requestedAttendanceDate }}
              <div>{{ complaint.requestedEventTime }}</div>
            </td>

            <td>
              {{ complaint.requestAction }}<br>
              {{ complaint.complaintType.replaceAll("_", " ") }}
            </td>

            <td style="max-width:260px">
              {{ complaint.reason }}
            </td>

            <td>

              <span
                class="badge"
                :class="badgeClass(complaint.status)"
              >
                {{ complaint.status }}
              </span>

            </td>

            <td>

              <template
                v-if="complaint.status==='PENDING'"
              >
            <NuxtLink
                :to="`/dashboard/attendance-complaints/${complaint.id}`"
                class="view-btn"
                >
                View →
                </NuxtLink>

              </template>

              <template v-else>

                <span class="reviewed">
                  Reviewed
                </span>

              </template>

            </td>

          </tr>

          <tr
            v-if="!complaints.length"
          >
            <td
              colspan="9"
              class="empty"
            >
              No attendance change requests found.
            </td>
          </tr>

        </tbody>

      </table>

    </div>

    <!-- Review Modal -->

    <div
      v-if="reviewModal"
      class="modal-overlay"
    >

      <div class="modal">

        <h2>
          {{ reviewStatus }}
          Complaint
        </h2>

        <textarea
          v-model="reviewNote"
          placeholder="Review note..."
          rows="5"
        />

        <div class="modal-actions">

          <button
            class="cancel-btn"
            @click="closeReview"
          >
            Cancel
          </button>

          <button
            class="submit-btn"
            @click="submitReview"
          >
            Submit
          </button>

        </div>

      </div>

    </div>

  </div>
</template>

<style scoped>
.page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  color: #1e293b;
  font-size: 30px;
}

.page-header p {
  margin-top: 6px;
  color: #64748b;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 9px 20px;
  text-decoration: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 14.5px;
  border: none;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
  white-space: nowrap;
}

.add-btn {
  color: #ffffff;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  box-shadow: 0 8px 18px rgba(79, 70, 229, 0.28);
}

.add-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(79, 70, 229, 0.36);
}

.add-btn:active {
  transform: translateY(0);
}

.back-btn {
  color: #374151;
  background: #ffffff;
  border: 1px solid #e2e6ef;
}

.back-btn:hover {
  transform: translateY(-1px);
  background: #f9fafb;
  box-shadow: 0 4px 12px rgba(16, 24, 40, 0.06);
}


.loading,
.empty {
  text-align: center;
  padding: 40px;
  color: #64748b;
}

.table-wrapper {
  background: white;
  border-radius: 12px;
  overflow-x: auto;
  box-shadow: 0 10px 30px rgba(0,0,0,.05);
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f8fafc;
}

th {
  padding: 15px;
  text-align: left;
  color: #475569;
  font-size: 14px;
  border-bottom: 1px solid #e2e8f0;
}

td {
  padding: 15px;
  border-bottom: 1px solid #edf2f7;
  vertical-align: top;
  color: #334155;
}

tbody tr:hover {
  background: #f8fafc;
}

.badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 30px;
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

.approve-btn,
.reject-btn {
  border: none;
  color: white;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  margin-right: 6px;
}

.approve-btn {
  background: #16a34a;
}

.approve-btn:hover {
  background: #15803d;
}

.reject-btn {
  background: #dc2626;
}

.reject-btn:hover {
  background: #b91c1c;
}

.reviewed {
  color: #64748b;
  font-weight: 600;
}

.success-box,
.error-box {
  padding: 14px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.success-box {
  background: #dcfce7;
  color: #166534;
}

.error-box {
  background: #fee2e2;
  color: #991b1b;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, .45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.modal {
  width: 520px;
  max-width: 90%;
  background: white;
  border-radius: 12px;
  padding: 24px;
}

.modal h2 {
  margin-top: 0;
  margin-bottom: 18px;
}

.modal textarea {
  width: 100%;
  resize: vertical;
  min-height: 120px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.cancel-btn {
  border: none;
  background: #94a3b8;
  color: white;
  padding: 10px 18px;
  border-radius: 8px;
  cursor: pointer;
}

.submit-btn {
  border: none;
  background: #2563eb;
  color: white;
  padding: 10px 18px;
  border-radius: 8px;
  cursor: pointer;
}

.submit-btn:hover {
  background: #1d4ed8;
}

.cancel-btn:hover {
  background: #64748b;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  table {
    min-width: 1100px;
  }

  .modal {
    width: 95%;
  }
}
</style>
