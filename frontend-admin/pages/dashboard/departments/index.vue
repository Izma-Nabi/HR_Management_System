<script setup lang="ts">
type Person = {
  id: number;
  firstName: string;
  lastName: string | null;
  user: {
    email: string;
  };
};

type Department = {
  id: number;
  departmentName: string;
  description: string | null;
  employees: Person[];
  admins: Person[];
};

definePageMeta({
  layout: "dashboard"
});

const config = useRuntimeConfig();

const departments = ref<Department[]>([]);
const loading = ref(true);
const search = ref("");
const errorMessage = ref("");

const authHeaders = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return null;
  }

  return {
    Authorization: `Bearer ${token}`
  };
};

const loadDepartments = async () => {
  const headers = authHeaders();

  if (!headers) {
    await navigateTo("/login", { replace: true });
    return;
  }

  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await $fetch<{ data: Department[] }>(`${config.public.apiBase}/departments`, {
      headers
    });

    departments.value = response.data;
  } catch (error: any) {
    errorMessage.value = error?.data?.message || "Unable to load departments";
  } finally {
    loading.value = false;
  }
};

onMounted(loadDepartments);

const filteredDepartments = computed(() => {
  const keyword = search.value.toLowerCase();

  return departments.value.filter((department) => {
    return department.departmentName.toLowerCase().includes(keyword);
  });
});

const deleteDepartment = async (id: number) => {
  const confirmed = window.confirm("Delete this department?");

  if (!confirmed) {
    return;
  }

  const headers = authHeaders();

  if (!headers) {
    await navigateTo("/login", { replace: true });
    return;
  }

  try {
    await $fetch(`${config.public.apiBase}/departments/${id}`, {
      method: "DELETE",
      headers
    });

    departments.value = departments.value.filter((department) => department.id !== id);
  } catch (error: any) {
    errorMessage.value = error?.data?.message || "Delete failed";
  }
};
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Departments</h1>
        <p>{{ departments.length }} Department(s)</p>
      </div>

      <NuxtLink to="/dashboard/departments/add" class="add-btn">
        + Add Department
      </NuxtLink>
    </div>

    <div class="toolbar">
      <input v-model="search" type="text" placeholder="Search department...">
    </div>

    <p v-if="errorMessage" class="notice error">{{ errorMessage }}</p>

    <div v-if="loading" class="loading">
      Loading departments...
    </div>

    <div v-else class="department-list">
      <article
        v-for="department in filteredDepartments"
        :key="department.id"
        class="card"
      >
        <div class="card-header">
          <div>
            <h2>{{ department.departmentName }}</h2>
            <p>{{ department.description || "No description" }}</p>
          </div>

          <div class="card-actions">
            <NuxtLink class="edit" :to="`/dashboard/departments/edit/${department.id}`">
              Edit
            </NuxtLink>
            <button class="delete" type="button" @click="deleteDepartment(department.id)">
              Delete
            </button>
          </div>
        </div>

        <section class="section">
          <h3>Employees ({{ department.employees.length }})</h3>

          <div v-if="department.employees.length">
            <div v-for="employee in department.employees" :key="employee.id" class="person">
              <strong>{{ employee.firstName }} {{ employee.lastName }}</strong>
              <span>{{ employee.user.email }}</span>
            </div>
          </div>

          <p v-else>No employees assigned.</p>
        </section>

        <section class="section">
          <h3>Administrators ({{ department.admins.length }})</h3>

          <div v-if="department.admins.length">
            <div v-for="admin in department.admins" :key="admin.id" class="person">
              <strong>{{ admin.firstName }} {{ admin.lastName }}</strong>
              <span>{{ admin.user.email }}</span>
            </div>
          </div>

          <p v-else>No administrators assigned.</p>
        </section>
      </article>
    </div>

    <div v-if="!loading && filteredDepartments.length === 0" class="empty">
      No departments found.
    </div>
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

.department-list {
  display: grid;
  gap: 18px;
}

.card {
  padding: 20px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.card-header h2 {
  margin: 0 0 5px;
  color: #1f2937;
  font-size: 20px;
}

.card-header p {
  margin: 0;
  color: #6b7280;
}

.card-actions {
  display: flex;
  gap: 10px;
}

.edit,
.delete {
  min-height: 36px;
  padding: 8px 12px;
  border-radius: 6px;
  font-weight: 800;
}

.edit {
  color: #ffffff;
  text-decoration: none;
  background: #4f46e5;
  border: 1px solid #4f46e5;
}

.delete {
  color: #ffffff;
  background: #dc2626;
  border: 1px solid #dc2626;
  cursor: pointer;
}

.section {
  margin-top: 18px;
}

.section h3 {
  margin: 0 0 10px;
  color: #374151;
  font-size: 15px;
}

.section p {
  margin: 0;
  color: #6b7280;
}

.person {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #eef2f7;
}

.person span {
  color: #6b7280;
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

@media (max-width: 760px) {
  .page-header,
  .card-header,
  .person {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
