<script setup lang="ts">
type LeaveStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

type LeaveType =
  | "ANNUAL"
  | "SICK"
  | "CASUAL"
  | "UNPAID"
  | "OTHER";

const props = defineProps<{
  search: string;
  statusFilter: LeaveStatus | "ALL";
  typeFilter: LeaveType | "ALL";
  statusOptions: Array<LeaveStatus | "ALL">;
  typeOptions: Array<LeaveType | "ALL">;
}>();

const emit = defineEmits([
  "update:search",
  "update:statusFilter",
  "update:typeFilter"
]);
</script>

<template>
  <div class="toolbar">
    <input
      :value="props.search"
      type="text"
      placeholder="Search by request, name, code, or department..."
      @input="emit('update:search', ($event.target as HTMLInputElement).value)"
    >

    <select
      :value="props.statusFilter"
      @change="emit('update:statusFilter', ($event.target as HTMLSelectElement).value)"
    >
      <option
        v-for="status in props.statusOptions"
        :key="status"
        :value="status"
      >
        {{ status === "ALL" ? "All statuses" : status }}
      </option>
    </select>

    <select
      :value="props.typeFilter"
      @change="emit('update:typeFilter', ($event.target as HTMLSelectElement).value)"
    >
      <option
        v-for="type in props.typeOptions"
        :key="type"
        :value="type"
      >
        {{ type === "ALL" ? "All leave types" : type }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.toolbar {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) 180px 180px;
  gap: 12px;
  margin-bottom: 18px;
}

.toolbar input,
.toolbar select {
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
.toolbar select:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
}

@media (max-width: 760px) {
  .toolbar {
    grid-template-columns: 1fr;
  }
}
</style>