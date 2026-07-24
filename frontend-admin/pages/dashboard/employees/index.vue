<script setup lang="ts">
type EmployeeAccount = {
  user: {
    id: number;
    fullName: string;
    email: string;
    status: string;
  };
  employee: {
    id: number;
    employeeCode: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    photo: string | null;
    department: {
      id: number;
      departmentName: string;
    } | null;
    designation: string | null;
    joiningDate: string | null;
  };
};

definePageMeta({
  layout: "dashboard"
});

const config = useRuntimeConfig();
const { hasPermission } = useAuthUser();

const employees = ref<EmployeeAccount[]>([]);
const loading = ref(true);
const search = ref("");
const errorMessage = ref("");
const canViewEmployees = computed(() => hasPermission("VIEW_EMPLOYEES"));
const canCreateEmployee = computed(() => hasPermission("CREATE_EMPLOYEE"));
const canUpdateUser = computed(() => hasPermission("UPDATE_USER"));

const authHeaders = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return null;
  }

  return {
    Authorization: `Bearer ${token}`
  };
};

const apiOrigin = computed(() => {
  return String(config.public.apiBase).replace(/\/api\/?$/, "");
});

const photoUrl = (photo: string | null) => {
  if (!photo) {
    return "";
  }

  if (photo.startsWith("http://") || photo.startsWith("https://")) {
    return photo;
  }

  return `${apiOrigin.value}${photo}`;
};

const employeeName = (employee: EmployeeAccount) => {
  return `${employee.employee.firstName} ${employee.employee.lastName}`.trim();
};

const loadEmployees = async () => {
  const headers = authHeaders();

  if (!headers) {
    await navigateTo("/login", { replace: true });
    return;
  }

  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await $fetch<{ data: EmployeeAccount[] }>(`${config.public.apiBase}/admin/employees`, {
      headers
    });

    employees.value = response.data;
  } catch (error: any) {
    errorMessage.value = error?.data?.message || "Unable to load employees";
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  if (!canViewEmployees.value) {
    await navigateTo("/dashboard", { replace: true });
    return;
  }

  await loadEmployees();
});

const filteredEmployees = computed(() => {
  const keyword = search.value.toLowerCase();

  return employees.value.filter((employee) => {
    return employee.employee.employeeCode.toLowerCase().includes(keyword)
      || employeeName(employee).toLowerCase().includes(keyword)
      || employee.user.email.toLowerCase().includes(keyword)
      || (employee.employee.department?.departmentName || "").toLowerCase().includes(keyword)
      || (employee.employee.designation || "").toLowerCase().includes(keyword)
      || (employee.employee.phone || "").toLowerCase().includes(keyword);
  });
});
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Employees</h1>
        <p>{{ employees.length }} Employee(s)</p>
      </div>

      <NuxtLink v-if="canCreateEmployee" to="/dashboard/users/add" class="add-btn">
        + Add Employee
      </NuxtLink>
    </div>

    <div class="toolbar">
      <input
        v-model="search"
        type="text"
        placeholder="Search by code, name, email, department, designation, or phone..."
      >
    </div>

    <p v-if="errorMessage" class="notice error">{{ errorMessage }}</p>

    <div v-if="loading" class="loading">
      Loading employees...
    </div>

    <table v-else class="table">
      <thead>
        <tr>
          <th>Employee</th>
          <th>Code</th>
          <th>Email</th>
          <th>Department</th>
          <th>Designation</th>
          <th>Phone</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="employee in filteredEmployees" :key="employee.employee.id">
          <td>
            <div class="employee-cell">
              <img
                v-if="employee.employee.photo"
                :src="photoUrl(employee.employee.photo)"
                :alt="employeeName(employee)"
              >
              <span v-else class="avatar-placeholder">
                {{ employee.employee.firstName.charAt(0) }}{{ employee.employee.lastName.charAt(0) }}
              </span>

              <span>{{ employeeName(employee) }}</span>
            </div>
          </td>
          <td>{{ employee.employee.employeeCode }}</td>
          <td>{{ employee.user.email }}</td>
          <td>{{ employee.employee.department?.departmentName || "-" }}</td>
          <td>{{ employee.employee.designation || "-" }}</td>
          <td>{{ employee.employee.phone || "-" }}</td>
          <td>
            <span class="status" :class="employee.user.status.toLowerCase()">
              {{ employee.user.status }}
            </span>
          </td>
          <td>
            <NuxtLink
              v-if="canUpdateUser"
              class="edit"
              :to="`/dashboard/users/edit/${employee.user.id}`"
            >
              Edit User
            </NuxtLink>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!loading && filteredEmployees.length === 0" class="empty">
      No employees found.
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 1200px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.add-btn {
  padding: 10px 18px;
  color: #ffffff;
  text-decoration: none;
  background: #4f46e5;
  border-radius: 8px;
  font-weight: 700;
}

.toolbar {
  margin-bottom: 20px;
}

.toolbar input {
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  outline: none;
}

.table {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  border-collapse: collapse;
  overflow: hidden;
}

th,
td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eef2f7;
  vertical-align: middle;
}

th {
  color: #4b5563;
  font-size: 13px;
  text-transform: uppercase;
}

.employee-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 180px;
  font-weight: 800;
}

.employee-cell img,
.avatar-placeholder {
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  border-radius: 50%;
}

.employee-cell img {
  object-fit: cover;
  border: 1px solid #e5e7eb;
}

.avatar-placeholder {
  display: inline-grid;
  place-items: center;
  color: #ffffff;
  background: #4f46e5;
  font-size: 13px;
  font-weight: 900;
}

.status {
  display: inline-flex;
  padding: 4px 8px;
  color: #0f6b3d;
  background: #ecfdf3;
  border: 1px solid #b7ebc9;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
}

.status.inactive,
.status.suspended {
  color: #9f1d1d;
  background: #fff0f0;
  border-color: #f4c7c7;
}

.edit {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  padding: 8px 12px;
  color: #ffffff;
  background: #4f46e5;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 800;
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

.notice.error {
  color: #9f1d1d;
  background: #fff0f0;
  border-color: #f4c7c7;
}

@media (max-width: 900px) {
  .page-header {
    align-items: stretch;
    flex-direction: column;
  }

  .table,
  thead,
  tbody,
  tr,
  th,
  td {
    display: block;
  }

  thead {
    display: none;
  }

  tr {
    padding: 10px 0;
    border-bottom: 1px solid #eef2f7;
  }

  td {
    border-bottom: 0;
  }
}
</style>
