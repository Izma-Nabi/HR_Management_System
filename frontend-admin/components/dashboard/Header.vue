<template>
  <header class="header">
    <h2>{{ dashboardTitle }}</h2>

    <div class="right">
      <span class="bell">🔔</span>

      <div class="profile">
        <img
          :src="avatarUrl"
          :alt="displayName"
        />

        <div class="profile-details">
          <h4>{{ displayName }}</h4>
          <p>{{ roleLabel }}</p>
        </div>
      </div>

      <button class="logout-btn" @click="logout">
        Logout
      </button>
    </div>
  </header>
</template>

<script setup>
import authService from "~/services/auth.service";

const { authUser, role } = useAuthUser();

const displayName = computed(() => {
  return authUser.value?.fullName || authUser.value?.name || authUser.value?.email || "User";
});

const roleLabel = computed(() => {
  switch ((role.value || "").toUpperCase()) {
    case "SUPER_ADMIN":
      return "Super Admin";
    case "ADMIN":
      return "Admin";
    case "EMPLOYEE":
      return "Employee";
    default:
      return "User";
  }
});

const dashboardTitle = computed(() => {
  switch ((role.value || "").toUpperCase()) {
    case "SUPER_ADMIN":
      return "Super Admin Dashboard";
    case "ADMIN":
      return "Admin Dashboard";
    case "EMPLOYEE":
      return "Employee Dashboard";
    default:
      return "Dashboard";
  }
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
  height: 80px;
  background: white;
  z-index: 40;

  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  border-bottom: 1px solid #ececec;
}

.header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #333;
}

.right {
  display: flex;
  align-items: center;
  gap: 25px;
}

.profile {
  display: flex;
  align-items: center;
  gap: 10px;
}

.profile-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.profile h4 {
  margin: 0;
  font-size: 15px;
  color: #333;
}

.profile p {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}

img {
  width: 45px;
  height: 45px;
  border-radius: 50%;
}

.bell {
  font-size: 22px;
  cursor: pointer;
}

.logout-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: #dc3545;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.logout-btn:hover {
  background: #c82333;
}
</style>