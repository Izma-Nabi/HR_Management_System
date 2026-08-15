<script setup lang="ts">
type RequestAction = "INSERT" | "EDIT";
type AttendanceEventType = "CHECK_IN" | "CHECK_OUT";

const props = defineProps<{
  attendanceDate: string;
  submitting: boolean;
  error: string;
}>();

const emit = defineEmits<{
  (
    event: "submit",
    payload: {
      attendanceDate: string;
      requestAction: RequestAction;
      eventType: AttendanceEventType;
      correctedTime: string;
      reason: string;
    }
  ): void;
  (event: "close"): void;
}>();

const requestAction = ref<RequestAction | "">("");
const eventType = ref<AttendanceEventType | "">("");
const correctedTime = ref("");
const reason = ref("");

const formattedDate = computed(() => {
  return new Intl.DateTimeFormat("en-PK", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(`${props.attendanceDate}T00:00:00`));
});

const canSubmit = computed(() => {
  return (
    requestAction.value !== "" &&
    eventType.value !== "" &&
    correctedTime.value !== "" &&
    reason.value.trim().length >= 10 &&
    !props.submitting
  );
});

const close = () => {
  if (!props.submitting) {
    emit("close");
  }
};

const submit = () => {
  if (
    !canSubmit.value ||
    requestAction.value === "" ||
    eventType.value === ""
  ) {
    return;
  }

  emit("submit", {
    attendanceDate: props.attendanceDate,
    requestAction: requestAction.value,
    eventType: eventType.value,
    correctedTime: correctedTime.value,
    reason: reason.value.trim()
  });
};

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    close();
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleEscape);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleEscape);
});
</script>

<template>
  <div class="modal-backdrop" role="presentation" @mousedown.self="close">
    <section
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="complaint-title"
    >
      <header class="modal-header">
        <div>
          <p>Attendance change request</p>
          <h2 id="complaint-title">What needs to change?</h2>
        </div>
        <button
          class="close-button"
          type="button"
          aria-label="Close complaint form"
          :disabled="props.submitting"
          @click="close"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </header>

      <div class="selected-record">
        <strong>{{ formattedDate }}</strong>
        <span>Select the request action, attendance type, and corrected time.</span>
      </div>

      <form @submit.prevent="submit">
        <div class="form-grid">
          <div class="field field--full">
            <label for="attendance-date">Attendance date</label>
            <input
              id="attendance-date"
              :value="props.attendanceDate"
              type="date"
              readonly
            >
          </div>

          <div class="field">
            <label for="request-action">Request action</label>
            <select
              id="request-action"
              v-model="requestAction"
              :disabled="props.submitting"
              required
            >
              <option value="" disabled>Select an action</option>
              <option value="EDIT">Edit attendance</option>
              <option value="INSERT">Insert attendance</option>
            </select>
          </div>

          <div class="field">
            <label for="event-type">Attendance type</label>
            <select
              id="event-type"
              v-model="eventType"
              :disabled="props.submitting"
              required
            >
              <option value="" disabled>Select attendance type</option>
              <option value="CHECK_IN">Check in</option>
              <option value="CHECK_OUT">Check out</option>
            </select>
          </div>

          <div class="field field--full">
            <label for="corrected-time">Corrected attendance time</label>
            <input
              id="corrected-time"
              v-model="correctedTime"
              type="time"
              :disabled="props.submitting"
              required
            >
          </div>
        </div>

        <label for="complaint-reason">
          Reason for the change
        </label>
        <textarea
          id="complaint-reason"
          v-model="reason"
          rows="5"
          minlength="10"
          maxlength="2000"
          placeholder="Explain why this attendance change is needed"
          :disabled="props.submitting"
          required
        />

        <div class="reason-meta">
          <span>Minimum 10 characters</span>
          <span>{{ reason.length }}/2000</span>
        </div>

        <p v-if="props.error" class="form-error" role="alert">
          {{ props.error }}
        </p>

        <footer class="modal-actions">
          <button
            class="secondary-button"
            type="button"
            :disabled="props.submitting"
            @click="close"
          >
            Cancel
          </button>
          <button
            class="primary-button"
            type="submit"
            :disabled="!canSubmit"
          >
            {{ props.submitting ? "Submitting..." : "Send request" }}
          </button>
        </footer>
      </form>
    </section>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgb(15 23 42 / 55%);
}

.modal {
  width: min(100%, 560px);
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  background: #ffffff;
  border: 1px solid #dbe3ed;
  border-radius: 8px;
  box-shadow: 0 20px 50px rgb(15 23 42 / 20%);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 22px 16px;
  gap: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header p {
  margin: 0 0 4px;
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.modal-header h2 {
  margin: 0;
  color: #172033;
  font-size: 22px;
}

.close-button {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  padding: 0;
  color: #475569;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 25px;
  line-height: 1;
}

.close-button:hover:not(:disabled) {
  color: #172033;
  background: #f1f5f9;
}

.selected-record {
  margin: 18px 22px 0;
  padding: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.selected-record strong {
  display: block;
  margin-bottom: 12px;
  color: #1e293b;
  font-size: 14px;
}

.selected-record span {
  color: #64748b;
  font-size: 13px;
}

form {
  padding: 20px 22px 22px;
}

label {
  display: block;
  margin: 0 0 7px;
  color: #334155;
  font-size: 13px;
  font-weight: 700;
}

input,
select,
textarea {
  width: 100%;
  color: #172033;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  outline: none;
}

input,
select {
  height: 42px;
  padding: 0 12px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-bottom: 18px;
  gap: 16px;
}

.field--full {
  grid-column: 1 / -1;
}

.field label {
  margin-bottom: 7px;
}

textarea {
  min-height: 122px;
  padding: 11px 12px;
  line-height: 1.5;
  resize: vertical;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgb(37 99 235 / 12%);
}

input:disabled,
input:read-only,
select:disabled,
textarea:disabled {
  color: #64748b;
  background: #f8fafc;
}

.reason-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  color: #64748b;
  font-size: 11px;
}

.form-error {
  margin: 14px 0 0;
  padding: 10px 12px;
  color: #991b1b;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  font-size: 13px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 22px;
  gap: 10px;
}

.secondary-button,
.primary-button {
  min-height: 40px;
  padding: 8px 15px;
  border-radius: 6px;
  font-weight: 700;
}

.secondary-button {
  color: #334155;
  background: #ffffff;
  border: 1px solid #cbd5e1;
}

.primary-button {
  color: #ffffff;
  background: #2563eb;
  border: 1px solid #1d4ed8;
}

.primary-button:hover:not(:disabled) {
  background: #1d4ed8;
}

.secondary-button:disabled,
.primary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 520px) {
  .modal-backdrop {
    padding: 10px;
  }

  .modal {
    max-height: calc(100vh - 20px);
  }

  .modal-header,
  form {
    padding-right: 16px;
    padding-left: 16px;
  }

  .selected-record {
    margin-right: 16px;
    margin-left: 16px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .field--full {
    grid-column: auto;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .secondary-button,
  .primary-button {
    width: 100%;
  }
}
</style>
