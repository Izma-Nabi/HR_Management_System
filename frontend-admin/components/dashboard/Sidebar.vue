<script setup>
const { hasAnyPermission } = useAuthUser();

const canManageUsers = computed(() =>
  hasAnyPermission(
    "VIEW_ADMINS",
    "VIEW_EMPLOYEES",
    "CREATE_ADMIN",
    "CREATE_EMPLOYEE",
    "UPDATE_ADMIN",
    "UPDATE_EMPLOYEE",
    "UPDATE_USER",
    "DELETE_ADMIN",
    "DELETE_EMPLOYEE"
  )
);

const canManageRoles = computed(() =>
  hasAnyPermission(
    "VIEW_ROLES",
    "CREATE_ROLE",
    "UPDATE_ROLE",
    "DELETE_ROLE"
  )
);

const canManageDepartments = computed(() =>
  hasAnyPermission(
    "VIEW_DEPARTMENTS",
    "CREATE_DEPARTMENT",
    "UPDATE_DEPARTMENT",
    "DELETE_DEPARTMENT"
  )
);

const canManageDesignations = computed(() =>
  hasAnyPermission(
    "VIEW_DESIGNATIONS",
    "CREATE_DESIGNATION",
    "UPDATE_DESIGNATION",
    "DELETE_DESIGNATION"
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

const canViewAttendanceComplaints = computed(() =>
  hasAnyPermission(
    "VIEW_ATTENDANCE_COMPLAINTS"
  )
);
</script>

<template>
  <aside class="sidebar">
    <div class="logo">
      <span class="logo-mark">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
        </svg>
      </span>
      <div class="logo-text">
        <h2>AMS</h2>
        <span>Attendance System</span>
      </div>
    </div>

    <p class="nav-eyebrow">Menu</p>

    <nav>
      <NuxtLink to="/dashboard" class="nav-item" style="--i: 0">
        <span class="nav-icon">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="9" rx="1.5" />
            <rect x="14" y="3" width="7" height="5" rx="1.5" />
            <rect x="14" y="12" width="7" height="9" rx="1.5" />
            <rect x="3" y="16" width="7" height="5" rx="1.5" />
          </svg>
        </span>
        <span class="nav-label">Dashboard</span>
      </NuxtLink>

      <NuxtLink
        v-if="canManageUsers"
        to="/dashboard/users"
        class="nav-item"
        style="--i: 1"
      >
        <span class="nav-icon">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </span>
        <span class="nav-label">Users</span>
      </NuxtLink>

      <NuxtLink
        v-if="canManageRoles"
        to="/dashboard/roles"
        class="nav-item"
        style="--i: 2"
      >
        <span class="nav-icon">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3z" />
            <path d="m9.5 12 2 2 4-4" />
          </svg>
        </span>
        <span class="nav-label">Roles &amp; Permissions</span>
      </NuxtLink>

      <NuxtLink
        v-if="canManageDepartments"
        to="/dashboard/departments"
        class="nav-item"
        style="--i: 3"
      >
        <span class="nav-icon">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 21V7l9-4 9 4v14" />
            <path d="M9 21v-6h6v6" />
            <path d="M9 12h.01M15 12h.01M9 9h.01M15 9h.01" />
          </svg>
        </span>
        <span class="nav-label">Departments</span>
      </NuxtLink>

      <NuxtLink
        v-if="canManageDesignations"
        to="/dashboard/designations"
        class="nav-item"
        style="--i: 4"
      >
        <span class="nav-icon">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2 8 4.5v5c0 4.2 2.8 7.4 4 8.5 1.2-1.1 4-4.3 4-8.5v-5L12 2z" />
            <circle cx="12" cy="8.5" r="1.8" />
          </svg>
        </span>
        <span class="nav-label">Designations</span>
      </NuxtLink>

      <NuxtLink
        v-if="canViewLeaves"
        to="/dashboard/leaves"
        class="nav-item"
        style="--i: 5"
      >
        <span class="nav-icon">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="17" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
            <path d="m8.5 15 2 2 4-4" />
          </svg>
        </span>
        <span class="nav-label">Leave Requests</span>
      </NuxtLink>

      <NuxtLink to="/dashboard/attendance" class="nav-item" style="--i: 6">
        <span class="nav-icon">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3.5 2" />
          </svg>
        </span>
        <span class="nav-label">Attendance</span>
      </NuxtLink>

      <NuxtLink
        v-if="canViewAttendanceComplaints"
        to="/dashboard/attendance-complaints"
        class="nav-item"
        style="--i: 7"
      >
        <span class="nav-icon">
          <svg
            viewBox="0 0 24 24"
            width="19"
            height="19"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <path d="M8 9h8"/>
            <path d="M8 13h5"/>
          </svg>
        </span>

        <span class="nav-label">
          Attendance Complaints
        </span>
      </NuxtLink>


      <NuxtLink to="/dashboard/reports" class="nav-item" style="--i: 7">
        <span class="nav-icon">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 3v18h18" />
            <rect x="7" y="12" width="3" height="6" rx="0.5" />
            <rect x="12.5" y="8" width="3" height="10" rx="0.5" />
            <rect x="18" y="5" width="3" height="13" rx="0.5" />
          </svg>
        </span>
        <span class="nav-label">Reports</span>
      </NuxtLink>

      <NuxtLink to="/dashboard/settings" class="nav-item" style="--i: 8">
        <span class="nav-icon">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </span>
        <span class="nav-label">Settings</span>
      </NuxtLink>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 260px;
  background: #ffffff;
  border-right: 1px solid #ececec;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  padding: 25px;
  box-sizing: border-box;
  z-index: 100;
  overflow-y: auto;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
}

.logo-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  color: #ffffff;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 55%, #4338ca 100%);
  border-radius: 11px;
  box-shadow: 0 6px 16px rgba(79, 70, 229, 0.32);
  animation: markPulse 3.2s ease-in-out infinite;
}

.logo-text h2 {
  margin: 0;
  color: #1f2233;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.2px;
}

.logo-text span {
  color: #8992a6;
  font-size: 12.5px;
  font-weight: 500;
}

.nav-eyebrow {
  margin: 0 0 10px 14px;
  color: #a4abbd;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.4px;
  text-transform: uppercase;
}

nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  color: #5b6172;
  font-size: 15.5px;
  font-weight: 600;
  text-decoration: none;
  overflow: hidden;
  opacity: 0;
  transform: translateX(-8px);
  animation: navIn 0.45s ease forwards;
  animation-delay: calc(var(--i) * 45ms);
  transition: color 0.2s ease, transform 0.2s ease;
}

.nav-item::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: #eef2ff;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
  z-index: -1;
}

.nav-item::after {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  width: 3px;
  height: 0;
  transform: translateY(-50%);
  background: #4f46e5;
  border-radius: 0 3px 3px 0;
  transition: height 0.25s ease;
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #9098ab;
  transition: color 0.2s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.nav-label {
  white-space: nowrap;
}

.nav-item:hover {
  color: #4f46e5;
  transform: translateX(3px);
}

.nav-item:hover::before {
  transform: scaleX(1);
}

.nav-item:hover .nav-icon {
  color: #4f46e5;
  transform: scale(1.12) rotate(-4deg);
}

.nav-item:focus-visible {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
}

.router-link-active {
  color: #ffffff;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  box-shadow: 0 8px 18px rgba(79, 70, 229, 0.28);
}

.router-link-active::before {
  transform: scaleX(0);
}

.router-link-active::after {
  height: 62%;
  background: #ffffff;
}

.router-link-active .nav-icon {
  color: #ffffff;
}

.router-link-active:hover {
  transform: translateX(0);
}

.router-link-active:hover .nav-icon {
  transform: scale(1.08);
}

@keyframes navIn {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes markPulse {
  0%, 100% {
    box-shadow: 0 6px 16px rgba(79, 70, 229, 0.32);
  }
  50% {
    box-shadow: 0 6px 22px rgba(79, 70, 229, 0.5);
  }
}

@media (prefers-reduced-motion: reduce) {
  .nav-item,
  .logo-mark {
    animation: none;
    opacity: 1;
    transform: none;
  }
  .nav-item:hover {
    transform: none;
  }
}
</style>