<script setup lang="ts">
import roleService from "~/services/role.service";
import userService from "~/services/user.service";

type UserRow = {
  id: number;
  userId: number;
  type: string | null;
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
  roleId: number | null;
  role: string;
  roleName: string | null;
  status: string;
  departmentId: number | null;
};

definePageMeta({ layout: "dashboard" });

const { hasPermission } = useAuthUser();

const users = ref<UserRow[]>([]);
const loading = ref(true);
const search = ref("");
const errorMessage = ref("");
const canViewUsers = computed(() => hasPermission("VIEW_USERS"));
const canEditUser = computed(() => hasPermission("UPDATE_USER"));
const canDeleteUser = computed(() => hasPermission("DELETE_ADMIN") || hasPermission("DELETE_EMPLOYEE"));
const canCreateUser = computed(() => hasPermission("CREATE_ADMIN") || hasPermission("CREATE_EMPLOYEE"));

const loadUsers = async () => {

  loading.value = true;
  errorMessage.value = "";

  try {
    users.value = await userService.getUsers();
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

  try {
   await userService.deleteUser(id);

    users.value = users.value.filter(
      (user) => user.id !== id
    );
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

const initials = (name: string) => {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <p class="eyebrow">Organization</p>
        <h1>Users</h1>
        <p class="subtitle">{{ users.length }} user{{ users.length === 1 ? "" : "s" }} in total</p>
      </div>

      <NuxtLink v-if="canCreateUser" to="/dashboard/users/create" class="add-btn">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Create User
      </NuxtLink>
    </div>

    <div class="toolbar">
      <svg class="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input v-model="search" type="text" placeholder="Search by name, email, department, role, or status...">
    </div>

    <transition name="fade">
      <p v-if="errorMessage" class="notice error">{{ errorMessage }}</p>
    </transition>

    <div v-if="loading" class="loading">
      <span class="spinner"></span>
      Loading users...
    </div>

    <div v-else class="table-wrap">
      <table class="table">
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
          <tr v-for="(user, index) in filteredUsers" :key="user.id" :style="{ '--i': index }">
            <td>
              <div class="employee-cell">
                <span class="avatar">{{ initials(user.name) }}</span>
                <strong>{{ user.name }}</strong>
              </div>
            </td>
            <td class="muted">{{ user.email }}</td>
            <td>
              <span class="role-pill">{{ user.roleName || user.role }}</span>
            </td>
            <td class="muted">{{ user.department?.departmentName || "—" }}</td>
            <td class="muted">{{ user.designation || "—" }}</td>
            <td class="muted">{{ user.phone || "—" }}</td>
            <td>
              <span class="status" :class="user.status.toLowerCase()">
                <span class="status-dot"></span>
                {{ user.status }}
              </span>
            </td>
            <td class="actions">
              <NuxtLink v-if="canEditUser" class="edit" :to="`/dashboard/users/edit/${user.id}`">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
                Edit
              </NuxtLink>
              <button v-if="canDeleteUser" class="delete" type="button" @click="deleteUser(user.id)">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!loading && filteredUsers.length === 0" class="empty">
      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
      <p>No users found.</p>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 1400px;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 26px;
}

.eyebrow {
  margin: 0 0 4px;
  color: #4f46e5;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
}

.page-header h1 {
  margin: 0 0 6px;
  color: #16192b;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.3px;
}

.subtitle {
  margin: 0;
  color: #7c8497;
  font-size: 14.5px;
}

.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 9px 20px;
  color: #ffffff;
  text-decoration: none;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  border-radius: 10px;
  font-weight: 700;
  font-size: 14.5px;
  box-shadow: 0 8px 18px rgba(79, 70, 229, 0.28);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  white-space: nowrap;
}

.add-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(79, 70, 229, 0.36);
}

.add-btn:active {
  transform: translateY(0);
}

.toolbar {
  position: relative;
  margin-bottom: 22px;
  max-width: 460px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #9aa1b3;
  pointer-events: none;
}

.toolbar input {
  width: 100%;
  min-height: 44px;
  padding: 10px 14px 10px 40px;
  color: #1f2937;
  background: #ffffff;
  border: 1px solid #e2e6ef;
  border-radius: 10px;
  outline: none;
  font-size: 14.5px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.toolbar input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
}

.table-wrap {
  background: #ffffff;
  border: 1px solid #eaecf3;
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.03);
  overflow: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f1f6;
  vertical-align: middle;
  white-space: nowrap;
}

th {
  color: #8b93a7;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  background: #fafafd;
}

tbody tr {
  opacity: 0;
  transform: translateY(6px);
  animation: rowIn 0.35s ease forwards;
  animation-delay: calc(var(--i) * 35ms);
  transition: background-color 0.15s ease;
}

tbody tr:hover {
  background: #f8f9fd;
}

tbody tr:last-child td {
  border-bottom: none;
}

.employee-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.employee-cell strong {
  color: #1f2333;
  font-size: 14px;
  font-weight: 700;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  color: #4f46e5;
  background: #eef2ff;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 800;
}

.muted {
  color: #6b7280;
  font-size: 13.5px;
}

.role-pill {
  display: inline-flex;
  padding: 4px 10px;
  color: #4338ca;
  background: #eef2ff;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  color: #1d4ed8;
  background: #eff6ff;
  border: 1px solid #b7ebc9;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  text-transform: capitalize;
}

.status-dot {
  width: 6px;
  height: 6px;
  background: #17a45c;
  border-radius: 50%;
}

.status.inactive,
.status.suspended {
  color: #9f1d1d;
  background: #fff0f0;
  border-color: #f4c7c7;
}

.status.inactive .status-dot,
.status.suspended .status-dot {
  background: #dc2626;
}

.actions {
  display: flex;
  gap: 8px;
}

.edit,
.delete {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: none;
  cursor: pointer;
  padding: 7px 12px;
  border-radius: 8px;
  text-decoration: none;
  font-size: 12.5px;
  font-weight: 700;
  transition: transform 0.15s ease, background-color 0.15s ease;
}

.edit {
  background: #eef2ff;
  color: #4338ca;
}

.edit:hover {
  background: #e2e7ff;
  transform: translateY(-1px);
}

.delete {
  background: #fee2e2;
  color: #b91c1c;
}

.delete:hover {
  background: #fdd0d0;
  transform: translateY(-1px);
}

.loading,
.empty,
.notice {
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-weight: 700;
}

.loading {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #6b7280;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e0e4ff;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 48px 20px;
  color: #a4abbd;
  text-align: center;
}

.empty p {
  margin: 0;
  font-size: 14px;
}

.notice.error {
  color: #9f1d1d;
  background: #fff0f0;
  border-color: #f4c7c7;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes rowIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 760px) {
  .page-header {
    align-items: stretch;
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  tbody tr {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
</style>