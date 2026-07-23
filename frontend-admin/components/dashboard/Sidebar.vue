<script setup>
const { hasPermission, hasAnyPermission } = useAuthUser();

const canAddUser = computed(() =>
  hasAnyPermission("CREATE_ADMIN", "CREATE_EMPLOYEE")
);
const canManageAdmins = computed(() =>
  hasAnyPermission("VIEW_ADMINS", "CREATE_ADMIN", "UPDATE_ADMIN", "DELETE_ADMIN")
);
const canManageEmployees = computed(() =>
  hasAnyPermission("VIEW_EMPLOYEES", "CREATE_EMPLOYEE", "UPDATE_EMPLOYEE", "DELETE_EMPLOYEE")
);
const canManageDepartments = computed(() =>
  hasAnyPermission(
    "VIEW_DEPARTMENTS",
    "CREATE_DEPARTMENT",
    "UPDATE_DEPARTMENT",
    "DELETE_DEPARTMENT"
  )
);
const canViewLeaves = computed(() =>
  hasAnyPermission(
    "CREATE_LEAVE",
    "VIEW_OWN_LEAVES",
    "VIEW_TEAM_LEAVES",
    "VIEW_ALL_LEAVES"
  )
);
</script>

<template>
  <aside class="sidebar">
    <div class="logo">
      <h2>AMS</h2>
      <span>Attendance System</span>
    </div>

    <nav>
      <NuxtLink to="/dashboard" class="nav-item">
        Dashboard
      </NuxtLink>

      <NuxtLink
        v-if="canAddUser"
        to="/dashboard/users/add"
        class="nav-item"
      >
        Add User
      </NuxtLink>

      <NuxtLink
        v-if="canManageAdmins"
        to="/dashboard/admins"
        class="nav-item"
      >
        Administrators
      </NuxtLink>

      <NuxtLink
        v-if="canManageEmployees"
        to="/dashboard/employees"
        class="nav-item"
      >
        Employees
      </NuxtLink>

      <NuxtLink
        v-if="canManageDepartments"
        to="/dashboard/departments"
        class="nav-item"
      >
        Departments
      </NuxtLink>

      <NuxtLink
        v-if="canViewLeaves"
        to="/dashboard/leaves"
        class="nav-item"
      >
        Leave Requests
      </NuxtLink>

      <NuxtLink to="/dashboard/attendance" class="nav-item">
        Attendance
      </NuxtLink>

      <NuxtLink to="/dashboard/reports" class="nav-item">
        Reports
      </NuxtLink>

      <NuxtLink to="/dashboard/settings" class="nav-item">
        Settings
      </NuxtLink>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar{
  width:250px;
  background:#fff;
  border-right:1px solid #ececec;
  height:100vh;
  position:fixed;
  left:0;
  top:0;
  padding:25px;
  box-sizing:border-box;
  z-index:100;
}

.logo{
  margin-bottom:40px;
}

.logo h2{
  color:#4F46E5;
}

.logo span{
  color:#777;
  font-size:14px;
}

nav{
  display:flex;
  flex-direction:column;
  gap:8px;
}

.nav-item{
  padding:14px;
  border-radius:10px;
  color:#555;
  text-decoration:none;
  transition:.2s;
}

.nav-item:hover{
  background:#EEF2FF;
  color:#4F46E5;
}

.router-link-active{
  background:#4F46E5;
  color:#fff;
}
</style>
