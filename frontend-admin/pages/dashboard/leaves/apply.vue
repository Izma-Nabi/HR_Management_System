<script setup lang="ts">
import leaveService from "~/services/leave.service";

definePageMeta({
  layout: "dashboard",
});

const router = useRouter();

const { roleKey } = useAuthUser();

const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const form = ref({
  type: "",
  startDate: "",
  endDate: "",
  reason: "",
});

const canApplyLeave = computed(() => {
  return (
    ["ADMIN", "EMPLOYEE"].includes(roleKey.value) &&
    form.value.type !== "" &&
    form.value.startDate !== "" &&
    form.value.endDate !== ""
  );
});

onMounted(() => {
  if (!["ADMIN", "EMPLOYEE"].includes(roleKey.value)) {
    router.replace("/dashboard/leaves");
  }
});

const totalDays = computed(() => {
  if (!form.value.startDate || !form.value.endDate) {
    return 0;
  }

  const start = new Date(`${form.value.startDate}T00:00:00`);
  const end = new Date(`${form.value.endDate}T00:00:00`);

  const difference = end.getTime() - start.getTime();
  const days = Math.floor(difference / (1000 * 60 * 60 * 24)) + 1;

  return days > 0 ? days : 0;
});

const submitLeave = async () => {
  errorMessage.value = "";
  successMessage.value = "";

  if (!canApplyLeave.value) {
    errorMessage.value = "Please fill in all required fields.";
    return;
  }

  if (totalDays.value <= 0) {
    errorMessage.value = "End date must be on or after the start date.";
    return;
  }

  loading.value = true;

  try {
    const response = await leaveService.createLeaveRequest({
      type: form.value.type,
      startDate: form.value.startDate,
      endDate: form.value.endDate,
      totalDays: totalDays.value,
      reason: form.value.reason.trim() || null,
    });

    console.log("Leave created:", response);

    successMessage.value = "Leave request submitted successfully.";

    setTimeout(() => {
      router.push("/dashboard/leaves");
    }, 800);
  } catch (error: any) {
    console.error("Failed to submit leave:", error);

    errorMessage.value =
      error?.data?.message ||
      error?.response?.data?.message ||
      "Unable to submit leave request.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="page">

    <div class="page-header">
      <div>
        <h1>Apply Leave</h1>
        <p>Submit a new leave request.</p>
      </div>

      <button
        class="back-btn"
        type="button"
        @click="router.push('/dashboard/leaves')"
      >
        Back
      </button>
    </div>

    <div
      v-if="errorMessage"
      class="notice error"
    >
      {{ errorMessage }}
    </div>

    <div
      v-if="successMessage"
      class="notice success"
    >
      {{ successMessage }}
    </div>

    <div class="form-card">

      <div class="form-group">
        <label>Leave Type</label>

        <select v-model="form.type">
          <option value="">Select Leave Type</option>
          <option value="ANNUAL">Annual</option>
          <option value="CASUAL">Casual</option>
          <option value="SICK">Sick</option>
          <option value="UNPAID">Unpaid</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <div class="row">

        <div class="form-group">
          <label>Start Date</label>

          <input
            v-model="form.startDate"
            type="date"
          >
        </div>

        <div class="form-group">
          <label>End Date</label>

          <input
            v-model="form.endDate"
            type="date"
          >
        </div>

      </div>

      <div
        v-if="totalDays > 0"
        class="days-preview"
      >
        Total Days: <strong>{{ totalDays }}</strong>
      </div>

      <div class="form-group">
        <label>Reason</label>

        <textarea
          v-model="form.reason"
          rows="5"
          placeholder="Enter reason for leave..."
        />
      </div>

      <div class="actions">

        <button
          class="cancel-btn"
          type="button"
          :disabled="loading"
          @click="router.push('/dashboard/leaves')"
        >
          Cancel
        </button>

        <button
          class="submit-btn"
          type="button"
          :disabled="!canApplyLeave || loading"
          @click="submitLeave"
        >
          {{ loading ? "Submitting..." : "Apply Leave" }}
        </button>

      </div>

    </div>

  </div>
</template>

<style scoped>
.page {
  max-width: 900px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 25px;
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

.back-btn {
  padding: 10px 18px;
  color: #fff;
  background: #4f46e5;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}

.back-btn:hover {
  background: #4338ca;
}

.form-card {
  padding: 28px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 22px;
}

.form-group label {
  margin-bottom: 8px;
  color: #374151;
  font-weight: 700;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 11px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  outline: none;
  font-size: 15px;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #4f46e5;
}

textarea {
  resize: vertical;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 15px;
}

.cancel-btn {
  padding: 10px 18px;
  color: #374151;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}

.submit-btn {
  padding: 10px 20px;
  color: #fff;
  background: #4f46e5;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}

.submit-btn:hover {
  background: #4338ca;
}

.submit-btn:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

@media (max-width: 768px) {

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .row {
    grid-template-columns: 1fr;
  }

  .actions {
    flex-direction: column;
  }

  .cancel-btn,
  .submit-btn,
  .back-btn {
    width: 100%;
  }
}
</style>
