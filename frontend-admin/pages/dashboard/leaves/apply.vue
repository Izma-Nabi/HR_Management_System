<script setup lang="ts">
import leaveService from "~/services/leave.service";

definePageMeta({
  layout: "dashboard",
});

const router = useRouter();

const { roleKey } = useAuthUser();

const loadingOptions = ref(false);
const submitting = ref(false);

const errorMessage = ref("");
const successMessage = ref("");

const form = reactive({
  type: "",
  startDate: "",
  endDate: "",
  reason: "",
  reportingToId: "",
  backupEmployeeId: "",
});

type Approver = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  designation?: {
    id: number;
    designationName: string;
  };
};

type BackupEmployee = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  designation?: {
    id: number;
    designationName: string;
  };
};

const approvers = ref<Approver[]>([]);
const backupEmployees = ref<BackupEmployee[]>([]);

const loadLeaveOptions = async () => {
  loadingOptions.value = true;
  errorMessage.value = "";

  try {
    const [approverResponse, backupResponse] = await Promise.all([
      leaveService.getLeaveApprovers(),
      leaveService.getBackupEmployees(),
    ]);

    const approverData = approverResponse as {
      success?: boolean;
      data?: Approver[];
    };

    const backupData = backupResponse as {
      success?: boolean;
      data?: BackupEmployee[];
    };

    approvers.value = approverData?.data ?? [];
    backupEmployees.value = backupData?.data ?? [];
  } catch (error: unknown) {
    console.error("Failed to load leave options:", error);

    const err = error as {
      data?: {
        message?: string;
      };
      response?: {
        data?: {
          message?: string;
        };
      };
      message?: string;
    };

    errorMessage.value =
      err?.data?.message ||
      err?.response?.data?.message ||
      err?.message ||
      "Unable to load managers and employees.";

    approvers.value = [];
    backupEmployees.value = [];
  } finally {
    loadingOptions.value = false;
  }
};

onMounted(async () => {
  const currentRole = String(roleKey.value || "").toUpperCase();

  if (!["ADMIN", "EMPLOYEE"].includes(currentRole)) {
    await router.replace("/dashboard/leaves");
    return;
  }

  await loadLeaveOptions();
});

const canApplyLeave = computed(() => {
  const currentRole = String(roleKey.value || "").toUpperCase();

  return (
    ["ADMIN", "EMPLOYEE"].includes(currentRole) &&
    form.type !== "" &&
    form.startDate !== "" &&
    form.endDate !== "" &&
    form.reportingToId !== "" &&
    totalDays.value > 0 &&
    !submitting.value
  );
});

const totalDays = computed(() => {
  if (!form.startDate || !form.endDate) {
    return 0;
  }

  const start = new Date(`${form.startDate}T00:00:00`);
  const end = new Date(`${form.endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const difference = end.getTime() - start.getTime();

  const days =
    Math.floor(
      difference / (1000 * 60 * 60 * 24)
    ) + 1;

  return days > 0 ? days : 0;
});

const submitLeave = async () => {
  errorMessage.value = "";
  successMessage.value = "";

  if (!form.type) {
    errorMessage.value = "Please select leave type.";
    return;
  }

  if (!form.startDate) {
    errorMessage.value = "Please select start date.";
    return;
  }

  if (!form.endDate) {
    errorMessage.value = "Please select end date.";
    return;
  }

  if (form.endDate < form.startDate) {
    errorMessage.value =
      "End date cannot be before start date.";
    return;
  }

  if (!form.reportingToId) {
    errorMessage.value =
      "Please select who you report to.";
    return;
  }

  if (totalDays.value <= 0) {
    errorMessage.value =
      "Please select valid leave dates.";
    return;
  }

  submitting.value = true;

  try {
    const payload = {
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      totalDays: totalDays.value,
      reason: form.reason.trim() || null,

      // Required reporting manager / team lead
      reportingToId: Number(form.reportingToId),

      // Optional backup employee
      backupEmployeeId: form.backupEmployeeId
        ? Number(form.backupEmployeeId)
        : null,
    };

    console.log("Submitting leave request:", payload);

    await leaveService.createLeaveRequest(payload);

    successMessage.value =
      "Leave request submitted successfully.";

    await router.push("/dashboard/leaves");
  } catch (error: any) {
    console.error("Failed to submit leave:", error);

    errorMessage.value =
      error?.data?.message ||
      error?.response?.data?.message ||
      error?.message ||
      "Unable to submit leave request.";
  } finally {
    submitting.value = false;
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
  <label>Reporting To</label>

  <select v-model="form.reportingToId">
    <option value="">
      Select Manager / Team Lead
    </option>

    <option
      v-for="person in approvers"
      :key="person.id"
      :value="person.id"
    >
      {{ person.firstName }}
      {{ person.lastName }}
    </option>
  </select>
</div>


  <div class="form-group">
    <label>
      Backup Employee
      <span class="optional">(Optional)</span>
    </label>

    <select v-model="form.backupEmployeeId">
      <option value="">
        No backup employee
      </option>

      <option
        v-for="employee in backupEmployees"
        :key="employee.id"
        :value="employee.id"
      >
        {{ employee.firstName }}
        {{ employee.lastName }}
      </option>
    </select>
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
          :disabled="submitting"
          @click="router.push('/dashboard/leaves')"
        >
          Cancel
        </button>

        <button
          class="submit-btn"
          type="button"
          :disabled="!canApplyLeave || submitting"
          @click="submitLeave"
        >
          {{ submitting ? "Submitting..." : "Apply Leave" }}
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
