<script setup lang="ts">
import departmentService from "~/services/department.service";
import designationService from "~/services/designation.service";

type Department = {
  id: number;
  departmentName: string;
};

type DesignationUser = {
  id: number;
  userCode: string | null;
  firstName: string;
  lastName: string | null;
  email: string;
  employmentStatus: string;
};

type Designation = {
  id: number;
  designationName: string;
  departmentId: number;
  department?: Department;
  users?: DesignationUser[];
  _count?: {
    users: number;
  };
};

definePageMeta({ layout: "dashboard" });

const { hasPermission, hasAnyPermission } = useAuthUser();

const departments = ref<Department[]>([]);
const designations = ref<Designation[]>([]);
const departmentFilter = ref<number | "all">("all");
const newDepartmentId = ref<number | null>(null);
const newDesignationName = ref("");
const editingId = ref<number | null>(null);
const editingName = ref("");
const loading = ref(true);
const saving = ref(false);
const updatingId = ref<number | null>(null);
const deletingId = ref<number | null>(null);
const search = ref("");
const errorMessage = ref("");
const successMessage = ref("");

const canAccessDesignations = computed(() =>
  hasAnyPermission(
    "VIEW_DESIGNATIONS",
    "CREATE_DESIGNATION",
    "UPDATE_DESIGNATION",
    "DELETE_DESIGNATION"
  )
);
const canCreateDesignation = computed(() => hasPermission("CREATE_DESIGNATION"));
const canUpdateDesignation = computed(() => hasPermission("UPDATE_DESIGNATION"));
const canDeleteDesignation = computed(() => hasPermission("DELETE_DESIGNATION"));

const loadPageData = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const [departmentResponse, designationResponse] = await Promise.all([
      departmentService.getDepartments(),
      designationService.getDesignations()
    ]);

    departments.value = departmentResponse;
    designations.value = designationResponse;
    newDepartmentId.value = newDepartmentId.value || departments.value[0]?.id || null;
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

const userFullName = (user: DesignationUser) => {
  return `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
};

const assignedCount = (designation: Designation) => {
  return designation._count?.users || designation.users?.length || 0;
};

const filteredDesignations = computed(() => {
  const keyword = search.value.trim().toLowerCase();

  return designations.value.filter((designation) => {
    const departmentMatches =
      departmentFilter.value === "all" ||
      Number(designation.departmentId) === Number(departmentFilter.value);

    if (!departmentMatches) {
      return false;
    }

    if (!keyword) {
      return true;
    }

    const employeeText = (designation.users || [])
      .map((user) => `${userFullName(user)} ${user.userCode || ""} ${user.email}`)
      .join(" ")
      .toLowerCase();

    return designation.designationName.toLowerCase().includes(keyword)
      || (designation.department?.departmentName || "").toLowerCase().includes(keyword)
      || employeeText.includes(keyword);
  });
});

const sortDesignations = (items: Designation[]) => {
  return [...items].sort((first, second) => {
    const departmentSort = (first.department?.departmentName || "")
      .localeCompare(second.department?.departmentName || "");

    if (departmentSort !== 0) {
      return departmentSort;
    }

    return first.designationName.localeCompare(second.designationName);
  });
};

const addDesignation = async () => {
  if (!newDepartmentId.value) {
    errorMessage.value = "Select a department";
    return;
  }

  saving.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    const designation = await designationService.createDesignation({
      departmentId: newDepartmentId.value,
      designationName: newDesignationName.value
    });

    designations.value = sortDesignations([...designations.value, designation]);
    newDesignationName.value = "";
    successMessage.value = "Designation added successfully";
  } catch (error: any) {
    errorMessage.value = error?.data?.message || "Unable to add designation";
  } finally {
    saving.value = false;
  }
};

const startEdit = (designation: Designation) => {
  editingId.value = designation.id;
  editingName.value = designation.designationName;
  errorMessage.value = "";
  successMessage.value = "";
};

const cancelEdit = () => {
  editingId.value = null;
  editingName.value = "";
};

const saveDesignation = async (designation: Designation) => {
  updatingId.value = designation.id;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    const updatedDesignation = await designationService.updateDesignation(
      designation.id,
      {
        designationName: editingName.value
      }
    );

    designations.value = sortDesignations(
      designations.value.map((item) =>
        item.id === designation.id ? updatedDesignation : item
      )
    );
    cancelEdit();
    successMessage.value = "Designation updated successfully";
  } catch (error: any) {
    errorMessage.value = error?.data?.message || "Unable to update designation";
  } finally {
    updatingId.value = null;
  }
};

const deleteDesignation = async (designation: Designation) => {
  const confirmed = window.confirm(`Delete ${designation.designationName}?`);

  if (!confirmed) {
    return;
  }

  deletingId.value = designation.id;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    await designationService.deleteDesignation(designation.id);
    designations.value = designations.value.filter((item) => item.id !== designation.id);
    successMessage.value = "Designation deleted successfully";
  } catch (error: any) {
    errorMessage.value = error?.data?.message || "Unable to delete designation";
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

    <div class="toolbar">
      <input
        v-model="search"
        type="text"
        placeholder="Search by designation, department, employee, code, or email..."
      >

      <select v-model="departmentFilter">
        <option value="all">All Departments</option>
        <option
          v-for="department in departments"
          :key="department.id"
          :value="department.id"
        >
          {{ department.departmentName }}
        </option>
      </select>
    </div>

    <form
      v-if="canCreateDesignation"
      class="add-form"
      @submit.prevent="addDesignation"
    >
      <select v-model.number="newDepartmentId" required>
        <option :value="null" disabled>Select Department</option>
        <option
          v-for="department in departments"
          :key="department.id"
          :value="department.id"
        >
          {{ department.departmentName }}
        </option>
      </select>

      <input
        v-model="newDesignationName"
        type="text"
        placeholder="Enter designation name"
        required
      >

      <button type="submit" :disabled="saving || !newDepartmentId">
        {{ saving ? "Adding..." : "Add Designation" }}
      </button>
    </form>

    <p v-if="errorMessage" class="notice error">{{ errorMessage }}</p>
    <p v-if="successMessage" class="notice success">{{ successMessage }}</p>

    <div v-if="loading" class="loading">Loading designations...</div>

    <table v-else class="table">
      <thead>
        <tr>
          <th>Designation</th>
          <th>Department</th>
          <th>Employees</th>
          <th>Count</th>
          <th v-if="canUpdateDesignation || canDeleteDesignation">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="designation in filteredDesignations"
          :key="designation.id"
        >
          <td>
            <input
              v-if="editingId === designation.id"
              v-model="editingName"
              class="edit-input"
              type="text"
              required
            >
            <span v-else>{{ designation.designationName }}</span>
          </td>
          <td>{{ designation.department?.departmentName || "-" }}</td>
          <td>
            <div v-if="designation.users?.length" class="employee-list">
              <span
                v-for="employee in designation.users"
                :key="employee.id"
                class="employee-chip"
                :title="employee.email"
              >
                {{ userFullName(employee) }}
                <small v-if="employee.userCode">{{ employee.userCode }}</small>
              </span>
            </div>
            <span v-else>-</span>
          </td>
          <td>{{ assignedCount(designation) }}</td>
          <td
            v-if="canUpdateDesignation || canDeleteDesignation"
            class="actions"
          >
            <template v-if="editingId === designation.id">
              <button
                class="edit"
                type="button"
                :disabled="updatingId === designation.id"
                @click="saveDesignation(designation)"
              >
                {{ updatingId === designation.id ? "Saving..." : "Save" }}
              </button>
              <button class="cancel" type="button" @click="cancelEdit">
                Cancel
              </button>
            </template>

            <template v-else>
              <button
                v-if="canUpdateDesignation"
                class="edit"
                type="button"
                @click="startEdit(designation)"
              >
                Edit
              </button>
              <button
                v-if="canDeleteDesignation"
                class="delete"
                type="button"
                :disabled="deletingId === designation.id || assignedCount(designation) > 0"
                :title="assignedCount(designation) > 0 ? 'Cannot delete while employees are assigned' : 'Delete designation'"
                @click="deleteDesignation(designation)"
              >
                {{ deletingId === designation.id ? "Deleting..." : "Delete" }}
              </button>
            </template>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!loading && filteredDesignations.length === 0" class="empty">
      No designations found.
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 1400px; }
.page-header { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:24px; }
.page-header h1 { margin:0 0 6px; color:#1f2937; font-size:30px; }
.page-header p { margin:0; color:#6b7280; }
.toolbar { display:grid; grid-template-columns: minmax(260px, 1fr) minmax(220px, 280px); gap:12px; margin-bottom:16px; }
.toolbar input, .toolbar select, .add-form input, .add-form select, .edit-input { width:100%; min-height:44px; padding:10px 12px; color:#111827; background:#fff; border:1px solid #d1d5db; border-radius:8px; outline:none; box-sizing:border-box; }
.toolbar input:focus, .toolbar select:focus, .add-form input:focus, .add-form select:focus, .edit-input:focus { border-color:#4f46e5; box-shadow:0 0 0 3px rgba(79,70,229,0.12); }
.add-form { display:grid; grid-template-columns:minmax(220px, 280px) minmax(260px, 1fr) auto; gap:12px; align-items:center; margin-bottom:20px; padding:16px; background:#fff; border:1px solid #e5e7eb; border-radius:8px; }
.add-form button { min-height:44px; padding:10px 16px; color:#fff; background:#4f46e5; border:0; border-radius:8px; cursor:pointer; font-weight:800; white-space:nowrap; }
.table { width:100%; background:#fff; border:1px solid #e5e7eb; border-collapse:collapse; border-radius:8px; overflow:hidden; }
th, td { padding:12px; text-align:left; border-bottom:1px solid #eef2f7; vertical-align:top; }
th { color:#4b5563; font-size:13px; text-transform:uppercase; }
.employee-list { display:flex; flex-wrap:wrap; gap:6px; max-width:520px; }
.employee-chip { display:inline-flex; align-items:center; gap:6px; padding:4px 8px; color:#374151; background:#f3f4f6; border:1px solid #e5e7eb; border-radius:999px; font-size:12px; font-weight:700; }
.employee-chip small { color:#6b7280; font-size:11px; font-weight:800; }
.actions { display:flex; gap:8px; flex-wrap:wrap; }
.edit, .delete, .cancel { border:none; cursor:pointer; padding:6px 10px; border-radius:6px; text-decoration:none; font-size:13px; min-height:32px; }
.edit { background:#eef2ff; color:#4338ca; }
.delete { background:#fee2e2; color:#b91c1c; }
.cancel { background:#f3f4f6; color:#374151; }
button:disabled { cursor:not-allowed; opacity:0.62; }
.loading, .empty, .notice { padding:14px; background:#fff; border:1px solid #e5e7eb; border-radius:8px; font-weight:700; }
.notice { margin-bottom:14px; }
.notice.error { color:#9f1d1d; background:#fff0f0; border-color:#f4c7c7; }
.notice.success { color:#1d4ed8; background:#eff6ff; border-color:#bfdbfe; }

@media (max-width: 860px) {
  .toolbar, .add-form { grid-template-columns:1fr; }
}
</style>
