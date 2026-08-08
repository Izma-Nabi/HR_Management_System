<script setup lang="ts">
import departmentService from "~/services/department.service";

definePageMeta({
  layout: "dashboard"
});

const route = useRoute();
const departmentId = computed(() => Number(route.params.id));

const loading = ref(true);
const errorMessage = ref("");
const search = ref("");

const department = ref<any>(null);
const users = ref<any[]>([]);

const loadUsers = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    console.log("Department ID:", departmentId.value);

    const response = await departmentService.getDepartmentUsers(
      departmentId.value
    );

    console.log("Department users response:", response);

    department.value = response;

    users.value = response.users || [];
  } catch (error: any) {
    console.error("LOAD USERS ERROR:", error);

    errorMessage.value =
      error?.data?.message ||
      "Unable to load department users";
  } finally {
    loading.value = false;
  }
};

const filteredUsers = computed(() => {
  const query = search.value.trim().toLowerCase();

  if (!query) {
    return users.value;
  }

  return users.value.filter((user) => {
    const fullName =
      `${user.firstName || ""} ${user.lastName || ""}`
        .trim()
        .toLowerCase();

    return fullName.includes(query);
  });
});

const employeeUsers = computed(() => {
  return users.value.filter((user) => {
    const role = user.role?.roleName?.toUpperCase();

    return role === "EMPLOYEE";
  });
});

const adminUsers = computed(() => {
  return users.value.filter((user) => {
    const role = String(
      user.role?.roleName || ""
    )
      .trim()
      .toUpperCase();

    return (
      role === "ADMIN" ||
      role === "SUPER ADMIN"
    );
  });
});

const initials = (
  firstName?: string,
  lastName?: string
) => {
  return (
    `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`
  ).toUpperCase();
};

const getRoleName = (user: any) => {
  return user.role?.roleName || "-";
};

const getRoleClass = (user: any) => {
  const role = String(
    user.role?.roleName || ""
  )
    .trim()
    .toUpperCase();

  if (
    role === "ADMIN" ||
    role === "SUPER ADMIN"
  ) {
    return "admin";
  }

  if (role === "EMPLOYEE") {
    return "employee";
  }

  return "";
};

const goBack = async () => {
  await navigateTo("/dashboard/departments");
};

watch(departmentId, loadUsers, { immediate: true });
</script>

<template>
  <div class="page">
    <div class="header">
      <div class="header-content">
        <button
          type="button"
          class="back-btn"
          @click="goBack"
        >
          ← Back
        </button>

        <h1>
          {{ department?.departmentName || "Department Users" }}
        </h1>

        <p>
          {{
            department?.description ||
            "View all users assigned to this department."
          }}
        </p>
      </div>
    </div>

    <div
      v-if="loading"
      class="loading"
    >
      <span class="spinner"></span>
      Loading users...
    </div>

    <div v-else>
      <p
        v-if="errorMessage"
        class="notice error"
      >
        {{ errorMessage }}
      </p>

      <div v-if="department">
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
            <circle
              cx="11"
              cy="11"
              r="7"
            ></circle>

            <line
              x1="21"
              y1="21"
              x2="16.65"
              y2="16.65"
            ></line>
          </svg>

          <input
            v-model="search"
            type="text"
            placeholder="Search user by name..."
          />
        </div>

        <div class="summary">
          <div class="summary-card">
            <span class="summary-label">
              Department
            </span>

            <strong>
              {{ department.departmentName }}
            </strong>
          </div>

          <div class="summary-card">
            <span class="summary-label">
              Total Users
            </span>

            <strong>
              {{ users.length }}
            </strong>
          </div>

          <div class="summary-card">
            <span class="summary-label">
              Employees
            </span>

            <strong>
              {{ employeeUsers.length }}
            </strong>
          </div>

          <div class="summary-card">
            <span class="summary-label">
              Administrators
            </span>

            <strong>
              {{ adminUsers.length }}
            </strong>
          </div>
        </div>

        <div
          v-if="filteredUsers.length > 0"
          class="user-list"
        >
          <article
            v-for="user in filteredUsers"
            :key="user.id"
            class="user-card"
          >
            <div
              class="avatar"
              :class="{
                'avatar--admin':
                  getRoleClass(user) === 'admin'
              }"
            >
              {{ initials(user.firstName, user.lastName) }}
            </div>

            <div class="user-info">
              <div class="user-main">
                <h2>
                  {{ user.firstName }} {{ user.lastName }}
                </h2>

                <span
                  class="role-badge"
                  :class="{
                    'role-admin':
                      getRoleClass(user) === 'admin',

                    'role-employee':
                      getRoleClass(user) === 'employee'
                  }"
                >
                  {{ getRoleName(user) }}
                </span>
              </div>

              <p>
                {{ user.email }}
              </p>
            </div>
          </article>
        </div>

        <div
          v-else
          class="empty"
        >
          <svg
            viewBox="0 0 24 24"
            width="40"
            height="40"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle
              cx="9"
              cy="7"
              r="4"
            ></circle>

            <path
              d="M3 21v-2a4 4 0 0 1 4-4h4"
            ></path>

            <path
              d="M16 11a4 4 0 1 0 0-8"
            ></path>

            <path
              d="M16 13a5 5 0 0 1 5 5v3"
            ></path>
          </svg>

          <p>
            {{
              search
                ? "No users found matching your search."
                : "No users assigned to this department."
            }}
          </p>
        </div>
      </div>

      <div
        v-else-if="!errorMessage"
        class="empty"
      >
        <p>
          Department not found.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.header h1 {
  margin: 14px 0 0;
  font-size: 30px;
  color: #1e293b;
}

.header p {
  margin: 6px 0 0;
  color: #64748b;
}

.back-btn {
  border: none;
  background: #475569;
  color: white;
  padding: 10px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.back-btn:hover {
  background: #334155;
}

.toolbar {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.toolbar input {
  width: 100%;
  height: 44px;
  padding: 0 16px 0 44px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  outline: none;
  font-size: 14px;
  background: white;
}

.toolbar input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.search-icon {
  position: absolute;
  left: 15px;
  color: #64748b;
  pointer-events: none;
}

.summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 18px;
}

.summary-label {
  display: block;
  margin-bottom: 8px;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
}

.summary-card strong {
  display: block;
  color: #1e293b;
  font-size: 24px;
}

.user-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.user-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.avatar {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 700;
}

.avatar--admin {
  background: #ede9fe;
  color: #6d28d9;
}

.user-info {
  min-width: 0;
  flex: 1;
}

.user-main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.user-info h2 {
  margin: 0;
  color: #1e293b;
  font-size: 16px;
  font-weight: 700;
}

.user-info p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 9px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  font-size: 11px;
  font-weight: 700;
}

.role-admin {
  background: #ede9fe;
  color: #6d28d9;
}

.role-employee {
  background: #dbeafe;
  color: #1d4ed8;
}

.loading,
.notice {
  padding: 16px;
  border-radius: 10px;
}

.loading {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f8fafc;
  color: #475569;
}

.notice.error {
  margin-bottom: 20px;
  background: #fee2e2;
  color: #991b1b;
}

.empty {
  padding: 60px 20px;
  text-align: center;
  color: #64748b;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
}

.empty svg {
  margin-bottom: 10px;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #cbd5e1;
  border-top-color: #475569;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .summary {
    grid-template-columns: repeat(2, 1fr);
  }

  .user-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .page {
    padding: 16px;
  }

  .header h1 {
    font-size: 24px;
  }

  .summary {
    grid-template-columns: 1fr;
  }

  .user-list {
    grid-template-columns: 1fr;
  }

  .user-card {
    padding: 14px;
  }
}
</style>