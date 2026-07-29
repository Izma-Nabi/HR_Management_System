<script setup lang="ts">
type ComplaintType = "CHECK_IN" | "CHECK_OUT" | "BOTH" | "STATUS" | "OTHER";

type RawAttendanceRecord = {
  id: number;
  eventType: string;
  eventTime: string;
  remarks: string | null;
};

const props = defineProps<{
  attendanceDate: string;
  record: RawAttendanceRecord;
  submitting: boolean;
  error: string;
}>();

const emit = defineEmits<{
  (
    event: "submit",
    payload: {
      complaintType: ComplaintType;
      reason: string;
    }
  ): void;
  (event: "close"): void;
}>();

const defaultComplaintType = (): ComplaintType => {
  if (props.record.eventType === "CHECK_IN") {
    return "CHECK_IN";
  }

  if (props.record.eventType === "CHECK_OUT") {
    return "CHECK_OUT";
  }

  return "OTHER";
};

const complaintType = ref<ComplaintType | "">(
  defaultComplaintType()
);
const reason = ref("");

const complaintTypes: Array<{
  value: ComplaintType;
  label: string;
}> = [
  { value: "CHECK_IN", label: "Check in" },
  { value: "CHECK_OUT", label: "Check out" },
  { value: "BOTH", label: "Check in and check out" },
  { value: "STATUS", label: "Attendance status" },
  { value: "OTHER", label: "Other" }
];

const formattedDate = computed(() => {
  return new Intl.DateTimeFormat("en-PK", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(`${props.attendanceDate}T00:00:00`));
});

const formatTime = (time: string | null) => {
  if (!time) {
    return "--";
  }

  const [hours, minutes] = time.split(":").map(Number);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return time;
  }

  return new Intl.DateTimeFormat("en-PK", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(new Date(2000, 0, 1, hours, minutes));
};

const canSubmit = computed(() => {
  return (
    complaintType.value !== "" &&
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
  if (!canSubmit.value || complaintType.value === "") {
    return;
  }

  emit("submit", {
    complaintType: complaintType.value,
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
          <p>Attendance correction</p>
          <h2 id="complaint-title">Submit complaint</h2>
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
        <dl>
          <div>
            <dt>Event</dt>
            <dd>{{ props.record.eventType.replaceAll("_", " ") }}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>{{ formatTime(props.record.eventTime) }}</dd>
          </div>
          <div>
            <dt>Remarks</dt>
            <dd :title="props.record.remarks || undefined">
              {{ props.record.remarks || "--" }}
            </dd>
          </div>
        </dl>
      </div>

      <form @submit.prevent="submit">
        <label for="complaint-type">Correction type</label>
        <select
          id="complaint-type"
          v-model="complaintType"
          :disabled="props.submitting"
          required
        >
          <option value="" disabled>Select correction type</option>
          <option
            v-for="option in complaintTypes"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>

        <label for="complaint-reason">
          Reason and requested correction
        </label>
        <textarea
          id="complaint-reason"
          v-model="reason"
          rows="5"
          minlength="10"
          maxlength="2000"
          placeholder="Describe the mistake and the correct attendance information"
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
            {{ props.submitting ? "Submitting..." : "Submit complaint" }}
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

dl {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0;
  gap: 12px;
}

dt {
  margin-bottom: 4px;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

dd {
  margin: 0;
  overflow: hidden;
  color: #172033;
  font-size: 14px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
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

select,
textarea {
  width: 100%;
  color: #172033;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  outline: none;
}

select {
  height: 42px;
  margin-bottom: 18px;
  padding: 0 12px;
}

textarea {
  min-height: 122px;
  padding: 11px 12px;
  line-height: 1.5;
  resize: vertical;
}

select:focus,
textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgb(37 99 235 / 12%);
}

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

  dl {
    grid-template-columns: 1fr;
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
