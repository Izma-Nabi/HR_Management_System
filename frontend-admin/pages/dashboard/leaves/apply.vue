<script setup lang="ts">
definePageMeta({
  layout: "dashboard"
});

const router = useRouter();

const form = reactive({
  type: "",
  startDate: "",
  endDate: "",
  reason: ""
});

const submitLeave = () => {
  console.log(form);

  // TODO
  // await leaveService.createLeave(form)

  router.push("/dashboard/leaves");
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
        @click="router.push('/dashboard/leaves')"
      >
        ← Back
      </button>
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
            type="date"
            v-model="form.startDate"
          >
        </div>

        <div class="form-group">
          <label>End Date</label>

          <input
            type="date"
            v-model="form.endDate"
          >
        </div>

      </div>

      <div class="form-group">
        <label>Reason</label>

        <textarea
          rows="5"
          v-model="form.reason"
          placeholder="Enter reason for leave..."
        />
      </div>

      <div class="actions">
        <button
          class="cancel-btn"
          @click="router.push('/dashboard/leaves')"
        >
          Cancel
        </button>

        <button
          class="submit-btn"
          @click="submitLeave"
        >
          Apply Leave
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
  grid-template-columns: repeat(2,1fr);
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