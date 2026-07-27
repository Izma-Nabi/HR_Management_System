<script setup lang="ts">
definePageMeta({
  layout: "dashboard"
});

import roleService from "~/services/role.service";

const route = useRoute();
const router = useRouter();
const { hasPermission } = useAuthUser();
const canViewRole = computed(() => hasPermission("VIEW_ROLES"));

const loading = ref(true);
const errorMessage = ref("");
const search = ref("");

const role = ref<any>(null);

const goBack = () => {
  router.push("/dashboard/roles");
};

const loadRole = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    role.value = await roleService.getRoleDetails(
      route.params.id
    );
  } catch (error: any) {
    errorMessage.value =
      error?.data?.message ||
      "Unable to load role.";
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  if (!canViewRole.value) {
    await navigateTo("/dashboard", { replace: true });
    return;
  }

  await loadRole();
});

const filteredUsers = computed(() => {
  if (!role.value?.users) {
    return [];
  }

  const keyword = search.value.toLowerCase();

  return role.value.users.filter((user: any) => {
    const fullName =
      `${user.firstName} ${user.lastName || ""}`
        .trim()
        .toLowerCase();

    return (
      fullName.includes(keyword) ||
      user.email.toLowerCase().includes(keyword) ||
      (user.department?.departmentName || "")
        .toLowerCase()
        .includes(keyword) ||
      (user.designation || "")
        .toLowerCase()
        .includes(keyword)
    );
  });
});
</script>

<template>
  <div class="page">

    <div class="page-header">

      <div>
        <h1>View Role</h1>
        <p>Role information and assigned employees</p>
      </div>

      <button
        class="back-btn"
        @click="goBack"
      >
        ← Back
      </button>

    </div>

    <p
      v-if="errorMessage"
      class="notice error"
    >
      {{ errorMessage }}
    </p>

    <div
      v-if="loading"
      class="loading"
    >
      Loading...
    </div>

    <template v-else>

      <!-- Role Information -->

      <div class="card">

        <h2>Role Information</h2>

        <div class="info-grid">

          <div>
            <span class="label">
              Role Name
            </span>

            <div class="value">
              {{ role.roleName }}
            </div>
          </div>

          <div>
            <span class="label">
              Total Permissions
            </span>

            <div class="value">
              {{ role.rolePermissions.length }}
            </div>
          </div>

          <div>
            <span class="label">
              Assigned Employees
            </span>

            <div class="value">
              {{ role.users.length }}
            </div>
          </div>

        </div>

      </div>

      <!-- Permissions -->

      <div class="card">

        <h2>
          Permissions
        </h2>

        <div class="permission-grid">

          <div
            v-for="permission in role.rolePermissions"
            :key="permission.permissionId"
            class="permission-item"
          >
            ✓ {{ permission.permission.permissionName }}
          </div>

        </div>

      </div>

      <!-- Employees -->

      <div class="card">

        <div class="employees-header">

          <h2>
            Assigned Employees
          </h2>

          <input
            v-model="search"
            placeholder="Search employee..."
          >

        </div>

        <table class="table">

          <thead>

            <tr>

              <th>Name</th>

              <th>Email</th>

              <th>Department</th>

              <th>Designation</th>

            </tr>

          </thead>

          <tbody>

            <tr
              v-for="user in filteredUsers"
              :key="user.id"
            >

              <td>
                {{ user.firstName }}
                {{ user.lastName }}
              </td>

              <td>
                {{ user.email }}
              </td>

              <td>
                {{ user.department?.departmentName || "-" }}
              </td>

              <td>
                {{ user.designation || "-" }}
              </td>

            </tr>

          </tbody>

        </table>

        <div
          v-if="filteredUsers.length===0"
          class="empty"
        >
          No employees found.
        </div>

      </div>

    </template>

  </div>
</template>

<style scoped>
.page{
    max-width:1400px;
}

.page-header{
    display:flex;
    justify-content:space-between;
    align-items:center;
    margin-bottom:24px;
}

.page-header h1{
    margin:0 0 6px;
    color:#1f2937;
    font-size:30px;
}

.page-header p{
    margin:0;
    color:#6b7280;
}

.back-btn{
    padding:10px 18px;
    background:#4f46e5;
    color:white;
    border:none;
    border-radius:8px;
    font-weight:700;
    cursor:pointer;
}

.back-btn:hover{
    background:#4338ca;
}

.card{
    background:white;
    border-radius:12px;
    padding:24px;
    margin-bottom:24px;
    border:1px solid #e5e7eb;
}

.info-grid{
    display:grid;
    grid-template-columns:repeat(3,1fr);
    gap:25px;
    margin-top:20px;
}

.label{
    display:block;
    color:#6b7280;
    margin-bottom:8px;
    font-size:14px;
}

.value{
    font-size:20px;
    font-weight:700;
    color:#111827;
}

.permission-grid{
    display:grid;
    grid-template-columns:repeat(auto-fill,minmax(250px,1fr));
    gap:12px;
    margin-top:20px;
}

.permission-item{
    padding:12px;
    background:#eef2ff;
    border-radius:8px;
    color:#4338ca;
    font-weight:600;
}

.employees-header{
    display:flex;
    justify-content:space-between;
    align-items:center;
    margin-bottom:20px;
}

.employees-header input{
    width:320px;
    padding:10px;
    border:1px solid #d1d5db;
    border-radius:8px;
}

.table{
    width:100%;
    border-collapse:collapse;
}

th,td{
    padding:14px;
    text-align:left;
    border-bottom:1px solid #eee;
}

th{
    color:#4b5563;
    text-transform:uppercase;
    font-size:13px;
}

.loading,
.empty{
    text-align:center;
    padding:30px;
}

.notice.error{
    background:#fee2e2;
    color:#991b1b;
    padding:14px;
    border-radius:8px;
    margin-bottom:20px;
}
</style>
