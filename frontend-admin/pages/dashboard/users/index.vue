<script setup lang="ts">
type UserRow = {
  id: number;
  userId: number;
  type: "ADMIN" | "SUPER_ADMIN" | "EMPLOYEE";
  name: string;
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  department: {
    id: number;
    departmentName: string;
    description?: string | null;
  } | null;
  designation: string | null;
  role: string;
  roleName: string | null;
  status: string;
  departmentId: number | null;
};

definePageMeta({ layout: "dashboard" });

const config = useRuntimeConfig();
const { hasPermission } = useAuthUser();

const users = ref<UserRow[]>([]);
const loading = ref(true);
const search = ref("");
const errorMessage = ref("");
const canViewUsers = computed(() => hasPermission("VIEW_ADMINS"));
const canEditUser = computed(() => hasPermission("UPDATE_ADMIN") || hasPermission("UPDATE_EMPLOYEE"));
const canDeleteUser = computed(() => hasPermission("DELETE_ADMIN") || hasPermission("DELETE_EMPLOYEE"));

const authHeaders = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return null;
  }

  return { Authorization: `Bearer ${token}` };
};

const loadUsers = async () => {
  const headers = authHeaders();

  if (!headers) {
    await navigateTo("/login", { replace: true });
    return;
  }

  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await $fetch<{ data: UserRow[] }>(`${config.public.apiBase}/users/users`, { headers });
    users.value = response.data;
  } catch (error: any) {
    errorMessage.value = error?.data?.message || "Unable to load users";
  } finally {
    loading.value = false;
  }
};

const deleteUser = async (id: number) => {
  const confirmed = window.confirm("Delete this user?");

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
    users.value = users.value.filter((user) => user.id !== id);
  } catch (error: any) {
    errorMessage.value = error?.data?.message || "Delete failed";
  }
};

onMounted(async () => {
  if (!canViewUsers.value) {
    await navigateTo("/dashboard", { replace: true });
    return;
  }

  await loadUsers();
});

const filteredUsers = computed(() => {
  const keyword = search.value.toLowerCase();

  return users.value.filter((user) => {
    return user.name.toLowerCase().includes(keyword)
      || user.email.toLowerCase().includes(keyword)
      || (user.department?.departmentName || "").toLowerCase().includes(keyword)
      || (user.designation || "").toLowerCase().includes(keyword)
      || (user.phone || "").toLowerCase().includes(keyword)
      || user.roleName?.toLowerCase().includes(keyword);
  });
});
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Users</h1>
        <p>{{ users.length }} user(s)</p>
      </div>
    </div>

    <div class="toolbar">
      <input v-model="search" type="text" placeholder="Search by name, email, department, role, or status..." />
    </div>

    <p v-if="errorMessage" class="notice error">{{ errorMessage }}</p>

    <div v-if="loading" class="loading">Loading users...</div>

    <table v-else class="table">
      <thead>
        <tr>
          <th>Employee</th>
          <th>Email</th>
          <th>Role</th>
          <th>Department</th>
          <th>Designation</th>
          <th>Phone</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in filteredUsers" :key="user.id">
          <td>{{ user.name }}</td>
          <td>{{ user.email }}</td>
          <td>{{ user.roleName || user.role }}</td>
          <td>{{ user.department?.departmentName || "-" }}</td>
          <td>{{ user.designation || "-" }}</td>
          <td>{{ user.phone || "-" }}</td>
          <td>
            <span class="status" :class="user.status.toLowerCase()">
              {{ user.status }}
            </span>
          </td>
          <td class="actions">
            <NuxtLink v-if="canEditUser" class="edit" :to="user.type === 'EMPLOYEE' ? `/dashboard/employees/edit/${user.id}` : `/dashboard/admins/edit/${user.id}`">
              Edit
            </NuxtLink>
            <button v-if="canDeleteUser" class="delete" type="button" @click="deleteUser(user.id)">
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!loading && filteredUsers.length === 0" class="empty">No users found.</div>
  </div>
</template>

<style scoped>
.page { max-width: 1400px; }
.page-header { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:24px; }
.page-header h1 { margin:0 0 6px; color:#1f2937; font-size:30px; }
.page-header p { margin:0; color:#6b7280; }
.toolbar { margin-bottom:20px; }
.toolbar input { width:100%; min-height:44px; padding:10px 12px; border:1px solid #d1d5db; border-radius:8px; outline:none; }
.table { width:100%; background:#fff; border:1px solid #e5e7eb; border-collapse:collapse; border-radius:8px; overflow:hidden; }
th, td { padding:12px; text-align:left; border-bottom:1px solid #eef2f7; vertical-align:middle; }
th { color:#4b5563; font-size:13px; text-transform:uppercase; }
.status { display:inline-flex; padding:4px 8px; color:#0f6b3d; background:#ecfdf3; border:1px solid #b7ebc9; border-radius:999px; font-size:12px; font-weight:800; }
.status.inactive, .status.suspended { color:#9f1d1d; background:#fff0f0; border-color:#f4c7c7; }
.actions { display:flex; gap:8px; }
.edit, .delete { border:none; cursor:pointer; padding:6px 10px; border-radius:6px; text-decoration:none; font-size:13px; }
.edit { background:#eef2ff; color:#4338ca; }
.delete { background:#fee2e2; color:#b91c1c; }
.loading, .empty, .notice { padding:14px; background:#fff; border:1px solid #e5e7eb; border-radius:8px; font-weight:700; }
.notice.error { color:#9f1d1d; background:#fff0f0; border-color:#f4c7c7; }
</style>