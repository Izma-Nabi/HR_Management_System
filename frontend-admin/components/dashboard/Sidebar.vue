<script setup>
const {
  authUser,
  roleKey,
  isSuperAdmin,
  isAdmin,
  isLeaveReviewer,
  hasAnyPermission
} = useAuthUser();
const route = useRoute();
const props = defineProps({
  open: {
    type: Boolean,
    default: false
  }
});
const emit = defineEmits(["close", "expanded-change"]);
const hovered = ref(false);
const focusWithin = ref(false);

const syncExpandedState = () => {
  emit("expanded-change", hovered.value || focusWithin.value);
};

const setHovered = (value) => {
  hovered.value = value;
  syncExpandedState();
};

const handleFocusIn = () => {
  focusWithin.value = true;
  syncExpandedState();
};

const handleFocusOut = (event) => {
  if (event.currentTarget?.contains(event.relatedTarget)) {
    return;
  }

  focusWithin.value = false;
  syncExpandedState();
};

const canManageUsers = computed(() =>
  roleKey.value !== "EMPLOYEE" && hasAnyPermission(
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

const canViewOwnLeaves = computed(() =>
  !isAdmin.value &&
  !isSuperAdmin.value &&
  hasAnyPermission(
    "CREATE_LEAVE",
    "VIEW_OWN_LEAVES"
  )
);

const canViewEmployeeLeaves = computed(() =>
  isLeaveReviewer.value &&
  hasAnyPermission(
    "VIEW_TEAM_LEAVES",
    "VIEW_ALL_LEAVES",
    "LIST_LEAVE_REQUESTS"
  )
);

const employeeLeavesActive = computed(() =>
  route.path.startsWith("/dashboard/leaves") &&
  (route.query.view === "employees" || (!canViewOwnLeaves.value && canViewEmployeeLeaves.value))
);

const ownLeavesActive = computed(() =>
  route.path.startsWith("/dashboard/leaves") &&
  canViewOwnLeaves.value &&
  route.query.view !== "employees"
);

const canViewAttendance = computed(() =>
  hasAnyPermission(
    "VIEW_OWN_ATTENDANCE",
    "VIEW_TEAM_ATTENDANCE",
    "VIEW_REPORTS",
    "VIEW_SYSTEM_SUMMARY"
  )
);

const hasAssignedDepartment = computed(() => {
  const departmentId = Number(
    authUser.value?.departmentId || authUser.value?.department?.id
  );

  return Number.isInteger(departmentId) && departmentId > 0;
});

const canViewAttendanceComplaints = computed(() => {
  if (isSuperAdmin.value) {
    return true;
  }

  return (
    roleKey.value === "ADMIN" &&
    hasAssignedDepartment.value &&
    hasAnyPermission(
      "VIEW_ATTENDANCE_COMPLAINTS",
      "MANAGE_ATTENDANCE"
    )
  );
});
</script>

<template>
  <aside
    class="sidebar"
    :class="{ 'sidebar--open': props.open }"
    @mouseenter="setHovered(true)"
    @mouseleave="setHovered(false)"
    @focusin="handleFocusIn"
    @focusout="handleFocusOut"
  >
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

      <button class="sidebar-close" type="button" aria-label="Close navigation" @click="emit('close')">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      </button>
    </div>

    <p class="nav-eyebrow">Menu</p>

    <nav @click="emit('close')">
      <NuxtLink
        to="/dashboard"
        class="nav-item"
        style="--i: 0"
        active-class=""
        exact-active-class="router-link-active"
      >
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
        v-if="canViewOwnLeaves"
        :to="{ path: '/dashboard/leaves', query: { view: 'own' } }"
        class="nav-item"
        :class="{ 'router-link-active': ownLeavesActive }"
        active-class=""
        exact-active-class=""
        style="--i: 5"
      >
        <span class="nav-icon">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="17" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
            <path d="m8.5 15 2 2 4-4" />
          </svg>
        </span>
        <span class="nav-label">My Leaves</span>
      </NuxtLink>

      <NuxtLink
        v-if="canViewEmployeeLeaves"
        :to="{ path: '/dashboard/leaves', query: { view: 'employees' } }"
        class="nav-item"
        :class="{ 'router-link-active': employeeLeavesActive }"
        active-class=""
        exact-active-class=""
        style="--i: 6"
      >
        <span class="nav-icon">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="m17 11 2 2 4-4" />
          </svg>
        </span>
        <span class="nav-label">Employee Leaves</span>
      </NuxtLink>

      <NuxtLink v-if="canViewAttendance" to="/dashboard/attendance" class="nav-item" style="--i: 7">
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
        <NuxtLink
          to="/dashboard/ai-assistant/ai-assistant"
          class="nav-item"
          style="--i: 8"
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
              <path d="M12 3a7 7 0 0 0-7 7v4a3 3 0 0 0 3 3h1" />
              <path d="M12 3a7 7 0 0 1 7 7v4a3 3 0 0 1-3 3h-1" />
              <path d="M8 17v1a4 4 0 0 0 8 0v-1" />
              <path d="M9 11h.01M15 11h.01" />
              <path d="M9 14c1.8 1.2 4.2 1.2 6 0" />
            </svg>
          </span>

          <span class="nav-label">AI Assistant</span>
        </NuxtLink>
    </nav>

    <div class="sidebar-foot">
      <span class="sidebar-foot-dot"></span>
      <span>System operational</span>
    </div>
  </aside>

  <button
    v-if="props.open"
    class="sidebar-backdrop"
    type="button"
    aria-label="Close navigation"
    @click="emit('close')"
  ></button>
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
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 55%, #1d4ed8 100%);
  border-radius: 11px;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.32);
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
  background: #2563eb;
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
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.router-link-active {
  color: #ffffff;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.28);
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

<style scoped>
.sidebar {
  width: var(--sidebar-collapsed-width);
  padding: 22px 14px;
  color: rgba(255, 255, 255, 0.78);
  background:
    radial-gradient(circle at 20% 0%, rgba(59, 130, 246, 0.2), transparent 18rem),
    linear-gradient(180deg, #0f2a4a 0%, #0b1f3a 100%);
  border-right: 0;
  box-shadow: 18px 0 50px rgba(16, 37, 43, 0.08);
  overflow-x: hidden;
  transition: width 240ms var(--ease-out), transform 260ms var(--ease-out);
}

.sidebar:hover,
.sidebar:focus-within {
  width: var(--sidebar-width);
}

.logo {
  min-height: 48px;
  margin-bottom: 30px;
  padding: 0 9px;
}

.logo-mark {
  width: 42px;
  height: 42px;
  color: #eff6ff;
  background: linear-gradient(145deg, #60a5fa, #2563eb);
  border-radius: 14px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
  animation: none;
}

.logo-text h2 {
  color: #fffefa;
  font-family: var(--font-display);
  font-size: 18px;
  letter-spacing: -0.02em;
}

.logo-text span {
  color: rgba(255, 255, 255, 0.52);
  font-size: 11px;
}

.logo-text,
.nav-label,
.sidebar-foot > span:last-child {
  opacity: 0;
  visibility: hidden;
  transform: translateX(-6px);
  white-space: nowrap;
  transition:
    opacity 150ms ease,
    transform 200ms var(--ease-out),
    visibility 0s linear 200ms;
}

.sidebar:hover .logo-text,
.sidebar:focus-within .logo-text,
.sidebar:hover .nav-label,
.sidebar:focus-within .nav-label,
.sidebar:hover .sidebar-foot > span:last-child,
.sidebar:focus-within .sidebar-foot > span:last-child {
  opacity: 1;
  visibility: visible;
  transform: translateX(0);
  transition-delay: 70ms, 70ms, 0s;
}

.nav-eyebrow {
  height: 0;
  margin: 0;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.38);
  opacity: 0;
  transition: height 200ms var(--ease-out), margin 200ms var(--ease-out), opacity 150ms ease;
}

.sidebar:hover .nav-eyebrow,
.sidebar:focus-within .nav-eyebrow {
  height: 14px;
  margin: 0 0 10px 12px;
  opacity: 1;
}

nav {
  gap: 5px;
}

.nav-item {
  width: 100%;
  min-height: 46px;
  padding: 11px 18px;
  color: rgba(255, 255, 255, 0.68);
  border: 1px solid transparent;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 650;
  box-sizing: border-box;
}

.nav-item::before,
.nav-item::after {
  display: none;
}

.nav-icon {
  width: 22px;
  color: rgba(255, 255, 255, 0.46);
}

.nav-item:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.08);
  transform: translateX(2px);
}

.nav-item:hover .nav-icon {
  color: #60a5fa;
  transform: none;
}

.router-link-active,
.router-link-active:hover {
  color: #14343a;
  background: #e5f3ef;
  border-color: rgba(255, 255, 255, 0.62);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.18);
  transform: none;
}

.router-link-active .nav-icon,
.router-link-active:hover .nav-icon {
  color: var(--brand);
  transform: none;
}

.sidebar-close {
  display: none;
  width: 38px;
  height: 38px;
  margin-left: auto;
  place-items: center;
  color: rgba(255, 255, 255, 0.75);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 11px;
}

.sidebar-foot {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 26px 8px 0;
  padding: 14px 12px;
  color: rgba(255, 255, 255, 0.5);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 11px;
}

.sidebar:not(:hover):not(:focus-within) .sidebar-foot {
  justify-content: center;
  margin-inline: 0;
  padding-inline: 0;
}

.sidebar-foot-dot {
  width: 7px;
  height: 7px;
  background: #60a5fa;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.12);
}

.sidebar-backdrop {
  position: fixed;
  z-index: 90;
  inset: 0;
  display: none;
  background: rgba(9, 30, 35, 0.48);
  border: 0;
  backdrop-filter: blur(3px);
}

@media (max-width: 980px) {
  .sidebar {
    z-index: 110;
    width: min(86vw, 300px);
    transform: translateX(-105%);
    transition: transform 260ms var(--ease-out);
  }

  .sidebar--open {
    transform: translateX(0);
  }

  .logo-text,
  .nav-label,
  .sidebar-foot > span:last-child {
    opacity: 1;
    visibility: visible;
    transform: none;
  }

  .nav-eyebrow {
    height: 14px;
    margin: 0 0 10px 12px;
    opacity: 1;
  }

  .sidebar-close {
    display: grid;
  }

  .sidebar-backdrop {
    display: block;
  }
}
</style>
