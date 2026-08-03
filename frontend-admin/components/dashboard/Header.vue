<template>
  <header class="header">
    <h2>{{ dashboardTitle }}</h2>

    <div class="right">
      <button class="icon-btn bell" type="button" aria-label="Notifications">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5Z" />
          <path d="M9.5 17a2.5 2.5 0 0 0 5 0" />
        </svg>
        <span class="dot"></span>
      </button>

      <div class="divider"></div>

      <div class="profile">
        <div class="avatar-wrap">
          <img :src="avatarUrl" :alt="displayName" />
          <span class="status-ring"></span>
        </div>

        <div class="profile-details">
          <h4>{{ displayName }}</h4>
          <p>{{ roleLabel }}</p>
        </div>
      </div>

      <button class="logout-btn" type="button" @click="logout">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        <span>Logout</span>
      </button>
    </div>
  </header>
</template>

<script setup>
import authService from "~/services/auth.service";

const { authUser, role } = useAuthUser();

const humanizeRole = (value) => {
  return String(value || "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const displayName = computed(() => {
  return authUser.value?.fullName || authUser.value?.name || authUser.value?.email || "User";
});

const roleLabel = computed(() => {
  return authUser.value?.roleName || humanizeRole(role.value) || "User";
});

const dashboardTitle = computed(() => {
  return roleLabel.value === "User"
    ? "Dashboard"
    : `${roleLabel.value} Dashboard`;
});

const avatarUrl = computed(() => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName.value)}&background=4F46E5&color=fff`;
});

const logout = () => {
  authService.clearSession();
  const authState = useState("auth.user", () => null);
  authState.value = null;

  navigateTo("/login");
};
</script>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 250px;
  right: 0;
  height: 100px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  z-index: 40;

  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  border-bottom: 1px solid #ececec;
  animation: header-in 0.4s ease both;
}

@keyframes header-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #16192b;
  letter-spacing: -0.02em;
}

.right {
  display: flex;
  align-items: center;
  gap: 18px;
}

.icon-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 12px;
  background: #f5f6fa;
  color: #4b5563;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.icon-btn svg {
  width: 20px;
  height: 20px;
}

.icon-btn:hover {
  background: #eef2ff;
  color: #4f46e5;
  transform: translateY(-1px);
}

.bell:hover svg {
  animation: ring 0.5s ease;
}

@keyframes ring {
  0%, 100% { transform: rotate(0); }
  20% { transform: rotate(14deg); }
  40% { transform: rotate(-12deg); }
  60% { transform: rotate(8deg); }
  80% { transform: rotate(-4deg); }
}

.dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border: 2px solid #ffffff;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0);
  }
}

.divider {
  width: 1px;
  height: 32px;
  background: #ececec;
}

.profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 8px 4px 4px;
  border-radius: 12px;
  transition: background-color 0.2s ease;
}

.profile:hover {
  background: #f5f6fa;
}

.avatar-wrap {
  position: relative;
  width: 45px;
  height: 45px;
  flex-shrink: 0;
}

.avatar-wrap img {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  display: block;
  border: 2px solid #eef2ff;
  transition: transform 0.2s ease;
}

.profile:hover .avatar-wrap img {
  transform: scale(1.05);
}

.status-ring {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 11px;
  height: 11px;
  background: #22c55e;
  border: 2px solid #ffffff;
  border-radius: 50%;
}

.profile-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.profile h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #1f2333;
}

.profile p {
  margin: 0;
  font-size: 12px;
  color: #8b93a7;
}

.logout-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 14px rgba(220, 38, 38, 0.25);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.logout-btn svg {
  width: 16px;
  height: 16px;
}

.logout-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(220, 38, 38, 0.34);
}

.logout-btn:active {
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .header,
  .dot,
  .bell:hover svg {
    animation: none;
  }
}
</style>