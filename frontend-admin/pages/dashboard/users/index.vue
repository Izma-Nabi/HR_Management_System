<script setup lang="ts">
definePageMeta({
  layout: "dashboard"
});
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>User Management</h1>
        <p>Manage all users in the system.</p>
      </div>

      <NuxtLink
        to="/dashboard/users/create"
        class="primary-button"
      >
        Create User
      </NuxtLink>
    </div>

    <div class="card">
      <p>
        User list will be displayed here.
      </p>
    </div>
  </div>
</template>

<style scoped>
.page {
  display: grid;
  gap: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h1 {
  margin: 0 0 8px;
  font-size: 30px;
  color: #1f2937;
}

.page-header p {
  margin: 0;
  color: #6b7280;
}

.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 18px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 700;
  background: #756db0;
  color: white;
}

.card {
  padding: 32px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: white;
}
</style>