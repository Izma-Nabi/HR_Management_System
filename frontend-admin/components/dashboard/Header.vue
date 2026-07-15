<template>
  <header class="header">
    <h2>Admin Dashboard</h2>

    <div class="right">
      <span class="bell">🔔</span>

      <div class="profile">
        <img
          src="https://ui-avatars.com/api/?name=Admin"
          alt="Admin"
        />

        <div>
          <h4>Administrator</h4>
        </div>
      </div>

      <!-- Logout Button -->
      <button class="logout-btn" @click="logout">
        Logout
      </button>
    </div>
  </header>
</template>

<script setup>
const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user"); // Remove if you store user data

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


.profile h4 {
  margin: 0;
  font-size: 15px;
  color: #333;
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