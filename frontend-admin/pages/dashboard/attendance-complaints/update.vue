<script setup lang="ts">
import attendanceService from "~/services/attendance.service";

definePageMeta({
  layout: "dashboard"
});

const route = useRoute();

const complaintId = route.query.complaintId;
const userId = route.query.userId;
const attendanceDate = route.query.attendanceDate;
const complaintType = route.query.complaintType;
const loading = ref(true);
const submitting = ref(false);
const error = ref("");
const success = ref("");
const complaint = ref<any>(null);

const mode = route.query.mode || "insert";

const isEdit = computed(() => mode === "edit");

const insertForm = ref({
  attendanceDate: (attendanceDate as string) || "",
  eventType: "CHECK_IN",
  eventTime: "",
  remarks: ""
});

const editForm = ref({
  checkIn: "",
  checkOut: "",
  status: "PRESENT",
  remarks: "",
  reviewNote: ""
});

const loadComplaint = async () => {
  loading.value = true;

  try {
    const complaints = await attendanceService.getAttendanceComplaints();

    complaint.value = complaints.find(
      (item: any) => item.id === Number(complaintId)
    );

    if (!complaint.value) {
      error.value = "Complaint not found";
    }

    if (isEdit.value && complaint.value) {
      const eventType = complaint.value.rawAttendance?.eventType;
      const eventTime = complaint.value.rawAttendance?.eventTime;

      editForm.value = {
        checkIn:
          eventType === "CHECK_IN" && eventTime
            ? eventTime.substring(11, 16)
            : "",

        checkOut:
          eventType === "CHECK_OUT" && eventTime
            ? eventTime.substring(11, 16)
            : "",

        status:
          complaint.value.dailyAttendance?.status ?? "PRESENT",

        remarks:
          complaint.value.rawAttendance?.remarks ?? "",

        reviewNote: ""
      };
    }
  } catch (err: any) {
    error.value = err?.data?.message || "Unable to load complaint";
  } finally {
    loading.value = false;
  }
};


const submitInsertAttendance = async () => {

  console.log("===== Create Attendance Clicked =====");

  if (!complaint.value) {
    console.log("Complaint is null");
    return;
  }

  console.log("Payload:", {
    userId: complaint.value.user.id,
    attendanceDate: insertForm.value.attendanceDate,
    eventType: insertForm.value.eventType,
    eventTime: insertForm.value.eventTime,
    remarks: insertForm.value.remarks
  });

  submitting.value = true;
  error.value = "";

  try {

    const response = await attendanceService.insertManualAttendance({
      complaintId: complaint.value.id,
      userId: complaint.value.user.id,
      attendanceDate: insertForm.value.attendanceDate,
      eventType: insertForm.value.eventType,
      eventTime: insertForm.value.eventTime,
      remarks: insertForm.value.remarks
    });

    console.log("API Response:", response);

    success.value = "Attendance inserted successfully.";

    setTimeout(() => {
      navigateTo(`/dashboard/attendance-complaints/${complaintId}`);
    }, 1000);

  } catch (err: any) {

    console.error("API Error:", err);

    error.value =
      err?.data?.message ||
      err?.message ||
      "Unable to create attendance entry";

  } finally {

    submitting.value = false;

  }

};

const submitEditAttendance = async () => {
  if (!complaint.value) return;

  submitting.value = true;
  error.value = "";

  try {
    await attendanceService.editAttendanceComplaint(complaint.value.id, {
      checkIn: editForm.value.checkIn,
      checkOut: editForm.value.checkOut,
      status: editForm.value.status,
      remarks: editForm.value.remarks,
      reviewNote: editForm.value.reviewNote,
    });

    success.value = "Attendance updated successfully";

    setTimeout(() => {
      navigateTo(`/dashboard/attendance-complaints/${complaintId}`);
    }, 1000);
  } catch (err: any) {
    error.value = err?.data?.message || "Unable to update attendance";
  } finally {
    submitting.value = false;
  }
};

const formatTime = (event: Event) => {
  const input = event.target as HTMLInputElement;

  // Keep only digits
  let value = input.value.replace(/\D/g, "");

  // Maximum 4 digits (HHMM)
  value = value.substring(0, 4);

  if (value.length === 1) {
    // 9 -> 09
    value = "0" + value;
  }

  if (value.length >= 3) {
    value = value.substring(0, 2) + ":" + value.substring(2);
  }

  insertForm.value.eventTime = value;
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

      <button class="back-btn" @click="goBack">
        ← Back
      </button>
    </div>

    <div v-if="loading" class="loading">
      Loading complaint...
    </div>

    <div v-else-if="error" class="error-box">
      {{ error }}
    </div>

    <div v-else>

      <div v-if="success" class="success-box">
        {{ success }}
      </div>

      <div class="card">

        <div class="card-header">
          <h2>
            Complaint #{{ complaint.id }}
          </h2>

          <span class="badge">
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


          <label class="reason-label">
            Employee Reason
          </label>

          <div class="reason-box">
            {{ complaint.reason }}
          </div>


          <div v-if="complaint.reviewNote" class="review-section">
            <label>Previous Review Note</label>

            <div class="review-box">
              {{ complaint.reviewNote }}
            </div>
          </div>

        </div>

      </div>


      <div class="card">
        <h2>{{ isEdit ? "Edit Attendance" : "Insert Attendance" }}</h2>

        <div v-if="!isEdit" class="form-grid">
          <div class="field">
            <label>Date</label>
            <input
              type="date"
              v-model="insertForm.attendanceDate"
            />
          </div>

          <div class="field">
            <label>Event Type</label>
            <select v-model="insertForm.eventType">
              <option value="CHECK_IN">Check In</option>
              <option value="CHECK_OUT">Check Out</option>
            </select>
          </div>

          <div class="field">
            <label>Time</label>
              <input
                type="text"
                v-model="insertForm.eventTime"
                maxlength="5"
                placeholder="HH:mm"
                @input="formatTime"
              />
          </div>

          <div class="field full">
            <label>Remarks</label>
            <textarea
              v-model="insertForm.remarks"
              rows="3"
            />
          </div>
        </div>

        <div v-else class="form-grid">
          <div class="field">
            <label>Check In</label>
            <input
              v-if="complaint.rawAttendance.eventType === 'CHECK_IN'"
              type="time"
              v-model="editForm.checkIn"
            />
          </div>

          <div class="field">
            <label>Check Out</label>
            <input
              v-if="complaint.rawAttendance.eventType === 'CHECK_OUT'"
              type="time"
              v-model="editForm.checkOut"
            />
          </div>

          <div class="field">
            <label>Status</label>
            <select v-model="editForm.status">
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="ABSENT">Absent</option>
              <option value="LEAVE">Leave</option>
            </select>
          </div>

          <div class="field full">
            <label>Remarks</label>
            <textarea
              v-model="editForm.remarks"
              rows="3"
            />
          </div>

          <div class="field full">
            <label>Review Note</label>
            <textarea
              v-model="editForm.reviewNote"
              rows="3"
              placeholder="Reason for change"
            />
          </div>
        </div>

        <div class="actions">
          <button
            class="reject-btn"
            @click="goBack"
          >
            Cancel
          </button>
          <button
            class="approve-btn"
            :disabled="
              submitting ||
              (!isEdit && (!insertForm.attendanceDate || !insertForm.eventTime))
            "
            @click="isEdit ? submitEditAttendance() : submitInsertAttendance()"
          >
            {{
              submitting
                ? (isEdit ? "Updating..." : "Saving...")
                : (isEdit ? "Update Attendance" : "Create Attendance")
            }}
          </button>
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
  transition: .2s;
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
  background: #dbeafe;
  color: #1d4ed8;
}

.card {
  background: white;
  border-radius: 14px;
  padding: 28px;
  box-shadow: 0 12px 30px rgba(0,0,0,.06);
  margin-bottom: 24px;
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

.card > h2 {
  margin: 0 0 24px 0;
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
  grid-template-columns: repeat(auto-fit, minmax(220px,1fr));
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
  min-height: 100px;
  font-size: 14px;
  font-family: inherit;
}

textarea:focus,
input:focus,
select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99,102,241,.15);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 14px;
  margin-top: 24px;
}

.approve-btn,
.reject-btn,
.cancel-btn {
  border: none;
  color: white;
  padding: 12px 22px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14.5px;
  transition: .18s;
}

.approve-btn {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  box-shadow: 0 6px 16px rgba(79,70,229,.28);
}

.approve-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(79,70,229,.36);
}

.reject-btn {
  background: #dc2626;
}

.reject-btn:hover:not(:disabled) {
  background: #b91c1c;
}

.cancel-btn {
  background: #94a3b8;
}

.cancel-btn:hover {
  background: #64748b;
}

.approve-btn:disabled,
.reject-btn:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 7px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  background: #fef3c7;
  color: #92400e;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 18px;
  margin-bottom: 18px;
}

.field label {
  margin-bottom: 6px;
}

.field.full {
  margin-bottom: 18px;
}

.field.full textarea {
  margin-top: 0;
  min-height: 80px;
}

input[type="time"],
input[type="date"],
select {
  width: 100%;
  padding: 11px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14.5px;
  background: white;
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
</style>