<script setup lang="ts">
type AdminProfile = {
  id: number;
  adminCode: string;
  firstName: string;
  lastName: string | null;
  user: {
    email: string;
    status: string;
  };
  department: {
    departmentName: string;
  } | null;
};

definePageMeta({
  layout: "dashboard"
});

const config = useRuntimeConfig();
const { hasPermission } = useAuthUser();

const loading = ref(true);
const search = ref("");
const admins = ref<AdminProfile[]>([]);
const errorMessage = ref("");
const canViewAdmins = computed(() => hasPermission("VIEW_ADMINS"));
const canCreateAdmin = computed(() => hasPermission("CREATE_ADMIN"));
const canUpdateUser = computed(() => hasPermission("UPDATE_USER"));
const canDeleteAdmin = computed(() => hasPermission("DELETE_ADMIN"));

const authHeaders = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return null;
  }

  return {
    Authorization: `Bearer ${token}`
  };
};

const loadAdmins = async () => {
  const headers = authHeaders();

  if (!headers) {
    await navigateTo("/login", { replace: true });
    return;
  }

  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await $fetch<{ data: AdminProfile[] }>(`${config.public.apiBase}/users/admins`, {
      headers
    });

    admins.value = response.data;
  } catch (error: any) {
    errorMessage.value = error?.data?.message || "Unable to load administrators";
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  if (!canViewAdmins.value) {
    await navigateTo("/dashboard", { replace: true });
    return;
  }

  await loadAdmins();
});

const filteredAdmins = computed(() => {
  const keyword = search.value.toLowerCase();

  return admins.value.filter((admin) => {
    return admin.firstName.toLowerCase().includes(keyword)
      || admin.adminCode.toLowerCase().includes(keyword)
      || (admin.lastName || "").toLowerCase().includes(keyword)
      || admin.user.email.toLowerCase().includes(keyword)
      || (admin.department?.departmentName || "").toLowerCase().includes(keyword);
  });
});

const deleteAdmin = async (id: number) => {
  const confirmed = window.confirm("Delete this administrator?");

  if (!confirmed) {
    return;
  }

  const headers = authHeaders();

  if (!headers) {
    await navigateTo("/login", { replace: true });
    return;
  }

  try {
    await $fetch(`${config.public.apiBase}/users/admin/${id}`, {
      method: "DELETE",
      headers
    });

    admins.value = admins.value.filter((admin) => admin.id !== id);
  } catch (error: any) {
    errorMessage.value = error?.data?.message || "Delete failed";
  }
};
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Administrators</h1>
        <p>{{ admins.length }} Administrator(s)</p>
      </div>

      <NuxtLink v-if="canCreateAdmin" to="/dashboard/users/add" class="add-btn">
        + Add Administrator
      </NuxtLink>
    </div>

    <div class="toolbar">
      <input
        v-model="search"
        type="text"
        placeholder="Search by code, name, email, or department..."
      >
    </div>

    <p v-if="errorMessage" class="notice error">{{ errorMessage }}</p>

    <div v-if="loading" class="loading">
      Loading administrators...
    </div>

    <table v-else class="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Code</th>
          <th>Email</th>
          <th>Department</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="admin in filteredAdmins" :key="admin.id">
          <td>{{ admin.firstName }} {{ admin.lastName }}</td>
          <td>{{ admin.adminCode }}</td>
          <td>{{ admin.user.email }}</td>
          <td>{{ admin.department?.departmentName || "-" }}</td>
          <td>
            <span class="status" :class="admin.user.status.toLowerCase()">
              {{ admin.user.status }}
            </span>
          </td>
          <td class="actions">
            <NuxtLink v-if="canUpdateUser" class="edit" :to="`/dashboard/users/edit/${admin.id}`">
              Edit User
            </NuxtLink>
            <button v-if="canDeleteAdmin" class="delete" type="button" @click="deleteAdmin(admin.id)">
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!loading && filteredAdmins.length === 0" class="empty">
      No administrators found.
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
}

th {
  color: #4b5563;
  font-size: 13px;
  text-transform: uppercase;
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

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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

@media (max-width: 800px) {
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
