<script setup lang="ts">
import designationService from "~/services/designation.service";

type Department = {
  id: number;
  departmentName: string;
};

type Designation = {
  id: number;
  designationName: string;
  departmentId: number;
  department?: Department;
  _count?: {
    users: number;
  };
};

definePageMeta({
  layout: "dashboard"
});

const config = useRuntimeConfig();
const { hasPermission, hasAnyPermission } = useAuthUser();

const canAccessDesignations = computed(() =>
  hasAnyPermission("VIEW_DESIGNATIONS", "CREATE_DESIGNATION", "DELETE_DESIGNATION")
);
const canCreateDesignation = computed(() => hasPermission("CREATE_DESIGNATION"));
const canDeleteDesignation = computed(() => hasPermission("DELETE_DESIGNATION"));

const departments = ref<Department[]>([]);
const designations = ref<Designation[]>([]);
const selectedDepartmentId = ref<number | null>(null);
const designationName = ref("");
const loading = ref(true);
const saving = ref(false);
const deletingId = ref<number | null>(null);
const errorMessage = ref("");
const successMessage = ref("");

const authHeaders = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return null;
  }

  return {
    Authorization: `Bearer ${token}`
  };
};

const selectedDepartment = computed(() =>
  departments.value.find((department) => department.id === selectedDepartmentId.value) || null
);

const selectedDesignations = computed(() =>
  designations.value.filter((designation) => designation.departmentId === selectedDepartmentId.value)
);

const loadDepartments = async (headers: Record<string, string>) => {
  const response = await $fetch<{ data: Department[] }>(
    `${config.public.apiBase}/departments`,
    { headers }
  );

  departments.value = response.data;

  if (!selectedDepartmentId.value && departments.value.length) {
    selectedDepartmentId.value = departments.value[0].id;
  }
};

const loadDesignations = async () => {
  designations.value = await designationService.getDesignations();
};

const loadPageData = async () => {
  const headers = authHeaders();

  if (!headers) {
    await navigateTo("/login", { replace: true });
    return;
  }

  loading.value = true;
  errorMessage.value = "";

  try {
    await Promise.all([
      loadDepartments(headers),
      loadDesignations()
    ]);
  } catch (error: any) {
    errorMessage.value = error?.data?.message || "Unable to load designations";
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  if (!canAccessDesignations.value) {
    await navigateTo("/dashboard", { replace: true });
    return;
  }

  await loadPageData();
});

const addDesignation = async () => {
  if (!selectedDepartmentId.value) {
    errorMessage.value = "Select a department";
    return;
  }

  saving.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    const designation = await designationService.createDesignation({
      departmentId: selectedDepartmentId.value,
      designationName: designationName.value
    });

    designations.value = [...designations.value, designation].sort((first, second) =>
      first.designationName.localeCompare(second.designationName)
    );
    designationName.value = "";
    successMessage.value = "Designation added successfully";
  } catch (error: any) {
    errorMessage.value = error?.data?.message || "Unable to add designation";
  } finally {
    saving.value = false;
  }
};

const removeDesignation = async (designation: Designation) => {
  const confirmed = window.confirm(`Remove ${designation.designationName}?`);

  if (!confirmed) {
    return;
  }

  deletingId.value = designation.id;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    await designationService.deleteDesignation(designation.id);
    designations.value = designations.value.filter((item) => item.id !== designation.id);
    successMessage.value = "Designation removed successfully";
  } catch (error: any) {
    errorMessage.value = error?.data?.message || "Unable to remove designation";
  } finally {
    deletingId.value = null;
  }
};
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Designations</h1>
        <p>{{ designations.length }} designation(s)</p>
      </div>
    </div>

    <p v-if="errorMessage" class="notice error">{{ errorMessage }}</p>
    <p v-if="successMessage" class="notice success">{{ successMessage }}</p>

    <div v-if="loading" class="loading">
      Loading designations...
    </div>

    <template v-else>
      <section class="panel">
        <label class="field">
          <span>Department</span>
          <select v-model.number="selectedDepartmentId">
            <option :value="null" disabled>Select Department</option>
            <option
              v-for="department in departments"
              :key="department.id"
              :value="department.id"
            >
              {{ department.departmentName }}
            </option>
          </select>
        </label>

        <form
          v-if="canCreateDesignation"
          class="add-form"
          @submit.prevent="addDesignation"
        >
          <label class="field">
            <span>Designation</span>
            <input
              v-model="designationName"
              type="text"
              placeholder="Enter designation name"
              required
            >
          </label>

          <button type="submit" :disabled="saving || !selectedDepartmentId">
            {{ saving ? "Adding..." : "Add" }}
          </button>
        </form>
      </section>

      <section class="list-panel">
        <div class="list-header">
          <div>
            <h2>{{ selectedDepartment?.departmentName || "No department selected" }}</h2>
            <p>{{ selectedDesignations.length }} designation(s)</p>
          </div>
        </div>

        <table v-if="selectedDesignations.length" class="table">
          <thead>
            <tr>
              <th>Designation</th>
              <th>Assigned Users</th>
              <th v-if="canDeleteDesignation">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="designation in selectedDesignations"
              :key="designation.id"
            >
              <td>{{ designation.designationName }}</td>
              <td>{{ designation._count?.users || 0 }}</td>
              <td v-if="canDeleteDesignation">
                <button
                  class="delete"
                  type="button"
                  :disabled="deletingId === designation.id || Boolean(designation._count?.users)"
                  @click="removeDesignation(designation)"
                >
                  {{ deletingId === designation.id ? "Removing..." : "Remove" }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-else class="empty">
          No designations found for this department.
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.page {
  max-width: 1100px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
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

.panel,
.list-panel {
  padding: 24px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.panel {
  display: grid;
  grid-template-columns: minmax(240px, 340px) 1fr;
  gap: 18px;
  margin-bottom: 20px;
}

.add-form {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: 12px;
}

.field {
  display: grid;
  gap: 8px;
}

.field span {
  color: #374151;
  font-weight: 700;
}

input,
select {
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  color: #111827;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  outline: none;
  box-sizing: border-box;
}

input:focus,
select:focus {
  border-color: #756db0;
  box-shadow: 0 0 0 3px rgba(117, 109, 176, 0.14);
}

button {
  min-height: 44px;
  padding: 10px 16px;
  border-radius: 8px;
  border: 0;
  cursor: pointer;
  font-weight: 800;
}

.add-form button {
  color: #ffffff;
  background: #756db0;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.list-header h2 {
  margin: 0 0 4px;
  color: #1f2937;
  font-size: 22px;
}

.list-header p {
  margin: 0;
  color: #6b7280;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eef2f7;
}

th {
  color: #4b5563;
  font-size: 13px;
  text-transform: uppercase;
}

.delete {
  min-height: 36px;
  padding: 8px 12px;
  color: #b91c1c;
  background: #fee2e2;
}

.loading,
.empty,
.notice {
  padding: 14px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-weight: 700;
}

.notice {
  margin-bottom: 14px;
}

.notice.error {
  color: #9f1d1d;
  background: #fff0f0;
  border-color: #f4c7c7;
}

.notice.success {
  color: #0f6b3d;
  background: #ecfdf3;
  border-color: #b7ebc9;
}

@media (max-width: 780px) {
  .panel,
  .add-form {
    grid-template-columns: 1fr;
  }
}
</style>
