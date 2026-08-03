<script setup lang="ts">
import roleService from "~/services/role.service";

definePageMeta({
  layout: "dashboard"
});

const router = useRouter();
const { hasPermission, hasAnyPermission } = useAuthUser();

const canAccessRoles = computed(() =>
  hasAnyPermission("VIEW_ROLES", "CREATE_ROLE", "UPDATE_ROLE", "DELETE_ROLE")
);
const canViewRoles = computed(() => hasPermission("VIEW_ROLES"));
const canCreateRole = computed(() => hasPermission("CREATE_ROLE"));
const canUpdateRole = computed(() => hasPermission("UPDATE_ROLE"));
const canDeleteRole = computed(() => hasPermission("DELETE_ROLE"));

const goBack = () => {
  router.push("/dashboard");
};

const roles = ref<any[]>([]);
const loading = ref(true);
const errorMessage = ref("");
const deletingId = ref<number | null>(null);

const deleteRole = async (id: number) => {
  const confirmed = window.confirm("Delete this role?");
  if (!confirmed) return;

  deletingId.value = id;
  try {
    await roleService.deleteRole(id); // fixed: was calling getRoles() before
    roles.value = roles.value.filter((r) => r.id !== id);
  } catch (error: any) {
    errorMessage.value = error?.data?.message || "Delete failed";
  } finally {
    deletingId.value = null;
  }
};

const loadRoles = async () => {
  loading.value = true;
  try {
    roles.value = await roleService.getRoles();
  } catch (error: any) {
    errorMessage.value = error?.data?.message || "Unable to load roles";
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  if (!canAccessRoles.value) {
    await navigateTo("/dashboard", { replace: true });
    return;
  }
  await loadRoles();
});
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <p class="eyebrow">Organization</p>
        <h1>Roles &amp; Permissions</h1>
        <p class="subtitle">{{ roles.length }} role{{ roles.length === 1 ? "" : "s" }} configured</p>
      </div>

      <div class="header-actions">
        <button class="back-btn" type="button" @click="goBack">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>

        <NuxtLink v-if="canCreateRole" to="/dashboard/roles/create" class="add-btn">
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Role
        </NuxtLink>
      </div>
    </div>

    <transition name="fade">
      <p v-if="errorMessage" class="notice error">{{ errorMessage }}</p>
    </transition>

    <div v-if="loading" class="loading">
      <span class="spinner"></span>
      Loading roles...
    </div>

    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Role</th>
            <th>Users</th>
            <th>Permissions</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(role, index) in roles" :key="role.id" :style="{ '--i': index }">
            <td>
              <div class="role-cell">
                <span class="role-icon">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2l9 4.5v5c0 5.25-3.75 9.5-9 11-5.25-1.5-9-5.75-9-11v-5L12 2z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </span>
                <strong>{{ role.roleName }}</strong>
              </div>
            </td>

            <td>
              <span class="count-chip">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                {{ role._count?.users || 0 }}
              </span>
            </td>

            <td>
              <span class="count-chip perms">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2l7 3.2v5.3c0 4.7-3 8.9-7 10-4-1.1-7-5.3-7-10V5.2L12 2z" />
                  <path d="M9.3 12l1.9 1.9 3.5-3.9" />
                </svg>
                {{ role.rolePermissions?.length || 0 }}
              </span>
            </td>

            <td class="actions">
              <NuxtLink v-if="canViewRoles" class="view" :to="`/dashboard/roles/view/${role.id}`">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                View
              </NuxtLink>

              <NuxtLink v-if="canUpdateRole" class="edit" :to="`/dashboard/roles/${role.id}`">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
                Edit
              </NuxtLink>

              <button
                v-if="canDeleteRole"
                class="delete"
                type="button"
                :disabled="deletingId === role.id"
                @click="deleteRole(role.id)"
              >
                <span v-if="deletingId === role.id" class="spinner small"></span>
                <svg v-else viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                {{ deletingId === role.id ? "Deleting..." : "Delete" }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!loading && roles.length === 0" class="empty">
      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2l9 4.5v5c0 5.25-3.75 9.5-9 11-5.25-1.5-9-5.75-9-11v-5L12 2z" />
      </svg>
      <p>No roles found.</p>
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
  flex-wrap: wrap;
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

.header-actions {
  display: flex;
  gap: 10px;
}

.add-btn,
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 9px 20px;
  text-decoration: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 14.5px;
  border: none;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
  white-space: nowrap;
}

.add-btn {
  color: #ffffff;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  box-shadow: 0 8px 18px rgba(79, 70, 229, 0.28);
}

.add-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(79, 70, 229, 0.36);
}

.add-btn:active {
  transform: translateY(0);
}

.back-btn {
  color: #374151;
  background: #ffffff;
  border: 1px solid #e2e6ef;
}

.back-btn:hover {
  transform: translateY(-1px);
  background: #f9fafb;
  box-shadow: 0 4px 12px rgba(16, 24, 40, 0.06);
}

.notice.error {
  padding: 13px 16px;
  margin-bottom: 18px;
  color: #9f1d1d;
  background: #fff0f0;
  border: 1px solid #f4c7c7;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
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

.role-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.role-cell strong {
  color: #1f2333;
  font-size: 14px;
  font-weight: 700;
}

.role-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  color: #4f46e5;
  background: #eef2ff;
  border-radius: 8px;
}

.count-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #374151;
  font-size: 12.5px;
  font-weight: 700;
}

.count-chip.perms {
  background: #ecfdf5;
  color: #047857;
}

.actions {
  display: flex;
  gap: 8px;
}

.view,
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

.view {
  background: #ecfeff;
  color: #0369a1;
}

.view:hover {
  background: #d3f6fb;
  transform: translateY(-1px);
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

.delete:disabled {
  cursor: not-allowed;
  opacity: 0.7;
  transform: none;
}

.loading,
.empty {
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

.spinner.small {
  width: 12px;
  height: 12px;
  border: 2px solid #f6c9c9;
  border-top-color: #b91c1c;
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