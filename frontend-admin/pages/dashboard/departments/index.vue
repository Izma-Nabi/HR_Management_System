<script setup lang="ts">
import authService from "~/services/auth.service";
import departmentService from "~/services/department.service";

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
  userCount: number;
};

definePageMeta({
  layout: "dashboard",
});

const { hasPermission } = useAuthUser();

const departments = ref<Department[]>([]);
const loading = ref(true);
const errorMessage = ref("");

const search = ref("");
const userSearch = ref("");

const canViewDepartments = computed(() => hasPermission("VIEW_DEPARTMENTS"));
const canCreateDepartment = computed(() => hasPermission("CREATE_DEPARTMENT"));
const canUpdateDepartment = computed(() => hasPermission("UPDATE_DEPARTMENT"));
const canDeleteDepartment = computed(() => hasPermission("DELETE_DEPARTMENT"));

const loadDepartments = async () => {
  const headers = authService.getAuthHeaders();

  if (!headers) {
    await navigateTo("/login", { replace: true });
    return;
  }

  loading.value = true;
  errorMessage.value = "";

  try {
    departments.value = await departmentService.getDepartments();
  } catch (error: any) {
    errorMessage.value = error?.data?.message || "Unable to load departments";
  } finally {
    loading.value = false;
  }
};

const matchesUserSearch = (person: Person) => {
  const query = userSearch.value.trim().toLowerCase();

  if (!query) {
    return true;
  }

  const fullName = `${person.firstName || ""} ${person.lastName || ""}`
    .trim()
    .toLowerCase();

  return fullName.includes(query);
};

const getFilteredEmployees = (department: Department) => {
  return (department.employees || [])
    .filter(matchesUserSearch)
    .slice(0, 3);
};

const getFilteredAdmins = (department: Department) => {
  return (department.admins || [])
    .filter(matchesUserSearch)
    .slice(0, 3);
};

const viewDepartmentUsers = async (departmentId: number) => {
  await navigateTo(`/dashboard/departments/${departmentId}/users`);
};

const deleteDepartment = async (id: number) => {
  const confirmed = window.confirm("Delete this department?");

  if (!confirmed) {
    return;
  }

  const headers = authService.getAuthHeaders();

  if (!headers) {
    await navigateTo("/login", { replace: true });
    return;
  }

  try {
    await departmentService.deleteDepartment(id);
  } catch (error: any) {
    errorMessage.value = error?.data?.message || "Delete failed";
  }
};

const initials = (first: string, last: string | null) => {
  const a = first?.charAt(0) || "";
  const b = last?.charAt(0) || "";
  return (a + b).toUpperCase();
};

const filteredDepartments = computed(() => {
  const keyword = search.value.trim().toLowerCase();

  return departments.value.filter((department) =>
    department.departmentName.toLowerCase().includes(keyword)
  );
});

onMounted(async () => {
  if (!canViewDepartments.value) {
    await navigateTo("/dashboard", { replace: true });
    return;
  }

  await loadDepartments();
});
</script>

<template>
  <div class="page">
    <!-- ==================== -->
    <!-- Page Header -->
    <!-- ==================== -->
    <div class="page-header">
      <div>
        <p class="eyebrow">Organization</p>
        <h1>Departments</h1>
        <p class="subtitle">
          {{ departments.length }}
          department{{ departments.length === 1 ? "" : "s" }}
          in total
        </p>
      </div>

      <NuxtLink
        v-if="canCreateDepartment"
        to="/dashboard/departments/add"
        class="add-btn"
      >
        <svg
          viewBox="0 0 24 24"
          width="17"
          height="17"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Department
      </NuxtLink>
    </div>

    <!-- ==================== -->
    <!-- Search: Department + Users -->
    <!-- ==================== -->
    <div class="search-row">
      <div class="toolbar">
        <svg
          class="search-icon"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          v-model="search"
          type="text"
          placeholder="Search department..."
        />
      </div>

      <div class="toolbar">
        <svg
          class="search-icon"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          v-model="userSearch"
          type="text"
          placeholder="Search users by name..."
        />
      </div>
    </div>

    <!-- ==================== -->
    <!-- Error -->
    <!-- ==================== -->
    <transition name="fade">
      <p v-if="errorMessage" class="notice error">
        {{ errorMessage }}
      </p>
    </transition>

    <!-- ==================== -->
    <!-- Loading -->
    <!-- ==================== -->
    <div v-if="loading" class="loading">
      <span class="spinner"></span>
      Loading departments...
    </div>

    <!-- ==================== -->
    <!-- Departments -->
    <!-- ==================== -->
    <div v-else class="department-list">
      <article
        v-for="(department, index) in filteredDepartments"
        :key="department.id"
        class="card"
        :style="{ '--i': index }"
      >
        <!-- Department Header -->
        <div class="card-header">
          <div class="card-title">
            <span class="dept-icon">
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 21V7l9-4 9 4v14" />
                <path d="M9 21v-6h6v6" />
                <path d="M9 12h.01M15 12h.01M9 9h.01M15 9h.01" />
              </svg>
            </span>

            <div>
              <h2>{{ department.departmentName }}</h2>
              <p>{{ department.description || "No description" }}</p>
            </div>
          </div>

          <!-- Edit / Delete -->
          <div class="card-actions">
            <NuxtLink
              v-if="canUpdateDepartment"
              class="edit"
              :to="`/dashboard/departments/edit/${department.id}`"
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              Edit
            </NuxtLink>

            <button
              v-if="canDeleteDepartment"
              class="delete"
              type="button"
              :disabled="department.userCount > 0"
              :title="
                department.userCount > 0
                  ? `Cannot delete: ${department.userCount} user(s) assigned`
                  : 'Delete department'
              "
              @click="deleteDepartment(department.id)"
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path
                  d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                />
              </svg>
              Delete
            </button>
          </div>
        </div>

        <!-- Employees + Admins -->
        <div class="section-grid">
          <!-- Employees -->
          <section class="section">
            <div class="section-heading">
              <h3>
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
                Employees
                <span class="count-pill">{{ department.employees.length }}</span>
              </h3>
            </div>

            <div
              v-if="getFilteredEmployees(department).length"
              class="people"
            >
              <div
                v-for="employee in getFilteredEmployees(department)"
                :key="employee.id"
                class="person"
              >
                <span class="avatar">
                  {{ initials(employee.firstName, employee.lastName) }}
                </span>

                <div class="person-info">
                  <strong>{{ employee.firstName }} {{ employee.lastName }}</strong>
                  <span>{{ employee.user.email }}</span>
                </div>
              </div>
            </div>

            <p v-else class="empty-line">
              {{ userSearch ? "No employees found." : "No employees assigned." }}
            </p>
          </section>

          <!-- Administrators -->
          <section class="section">
            <div class="section-heading">
              <h3>
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3z" />
                </svg>
                Administrators
                <span class="count-pill">{{ department.admins.length }}</span>
              </h3>
            </div>

            <div
              v-if="getFilteredAdmins(department).length"
              class="people"
            >
              <div
                v-for="admin in getFilteredAdmins(department)"
                :key="admin.id"
                class="person"
              >
                <span class="avatar avatar--admin">
                  {{ initials(admin.firstName, admin.lastName) }}
                </span>

                <div class="person-info">
                  <strong>{{ admin.firstName }} {{ admin.lastName }}</strong>
                  <span>{{ admin.user.email }}</span>
                </div>
              </div>
            </div>

            <p v-else class="empty-line">
              {{ userSearch ? "No administrators found." : "No administrators assigned." }}
            </p>
          </section>
        </div>

        <!-- Card Footer -->
        <div
          v-if="department.userCount > 6"
          class="card-footer"
        >
          <button
            class="view-more-btn"
            type="button"
            @click="viewDepartmentUsers(department.id)"
          >
            View More
          </button>
        </div>
      </article>
    </div>

    <!-- No Departments -->
    <div
      v-if="!loading && filteredDepartments.length === 0"
      class="empty"
    >
      <svg
        viewBox="0 0 24 24"
        width="34"
        height="34"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M3 21V7l9-4 9 4v14" />
        <path d="M9 21v-6h6v6" />
      </svg>

      <p>No departments found.</p>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 1100px;
}

/* ==================== */
/* Header */
/* ==================== */
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
  padding: 11px 20px;
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

/* ==================== */
/* Search Row */
/* ==================== */
.search-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 22px;
}

.toolbar {
  position: relative;
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

@media (max-width: 700px) {
  .search-row {
    grid-template-columns: 1fr;
  }
}

/* ==================== */
/* Department List */
/* ==================== */
.department-list {
  display: grid;
  gap: 18px;
}

.card {
  padding: 22px;
  background: #ffffff;
  border: 1px solid #eaecf3;
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.03);
  opacity: 0;
  transform: translateY(10px);
  animation: cardIn 0.4s ease forwards;
  animation-delay: calc(var(--i) * 60ms);
  transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.card:hover {
  border-color: #dfe2f5;
  box-shadow: 0 12px 28px rgba(31, 41, 55, 0.08);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 18px;
  border-bottom: 1px solid #f0f1f6;
}

.card-title {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.dept-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  color: #4f46e5;
  background: #eef2ff;
  border-radius: 10px;
}

.card-header h2 {
  margin: 0 0 4px;
  color: #1f2333;
  font-size: 19px;
  font-weight: 800;
}

.card-header p {
  margin: 0;
  color: #8b93a7;
  font-size: 13.5px;
}

.card-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #f0f1f6;
}

.view-more-btn {
  border: 1px solid #2563eb;
  background: #eff6ff;
  color: #2563eb;
  padding: 7px 14px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-more-btn:hover {
  background: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
}

.view-more-btn:active {
  transform: scale(0.97);
}

.edit,
.delete {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 8px 13px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: transform 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
}

.edit {
  color: #4f46e5;
  text-decoration: none;
  background: #eef2ff;
  border: 1px solid #e0e4ff;
}

.edit:hover {
  background: #e2e7ff;
  transform: translateY(-1px);
}

.delete {
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fbdede;
}

.delete:hover {
  background: #fde3e3;
  transform: translateY(-1px);
}

.delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.delete:disabled:hover {
  background: #94a3b8;
}

/* ==================== */
/* Sections */
/* ==================== */
.section-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.section-heading {
  margin-bottom: 12px;
}

.section h3 {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0;
  color: #4b5265;
  font-size: 13.5px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.count-pill {
  padding: 1px 8px;
  color: #4f46e5;
  background: #eef2ff;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
}

.people {
  display: grid;
  gap: 4px;
}

.person {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 6px;
  border-radius: 8px;
  transition: background-color 0.15s ease;
}

.person:hover {
  background: #f8f9fd;
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

.avatar--admin {
  color: #b45309;
  background: #fef3e2;
}

.person-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.person-info strong {
  color: #1f2937;
  font-size: 13.5px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.person-info span {
  color: #8b93a7;
  font-size: 12.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-line {
  margin: 0;
  padding: 8px 6px;
  color: #a4abbd;
  font-size: 13px;
}

/* ==================== */
/* Loading / Empty / Notice */
/* ==================== */
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

/* ==================== */
/* Transitions / Animations */
/* ==================== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(10px);
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

/* ==================== */
/* Responsive */
/* ==================== */
@media (max-width: 760px) {
  .page-header {
    align-items: stretch;
    flex-direction: column;
  }

  .card-header {
    align-items: stretch;
    flex-direction: column;
  }

  .section-grid {
    grid-template-columns: 1fr;
  }

  .person {
    align-items: flex-start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .card {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
</style>