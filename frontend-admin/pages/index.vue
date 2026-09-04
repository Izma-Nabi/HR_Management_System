<script setup lang="ts">
definePageMeta({
  layout: "dashboard"
});

const router = useRouter();

const {
  dashboard,
  fetchDashboard
} = useDashboard();

onMounted(async () => {
  const token = localStorage.getItem("token");

  // Redirect unauthenticated users to login
  if (!token) {
    await navigateTo("/login", {
      replace: true
    });

    return;
  }

  // IMPORTANT:
  // Always call /api/dashboard first.
  // This includes Team Lead users.
  await fetchDashboard();

  // Get role from the dashboard API response
  const role = String(dashboard.value?.user?.role || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  // Normal EMPLOYEE users use the separate employee dashboard
  if (role === "EMPLOYEE") {
    await router.replace("/dashboard/employees");
    return;
  }

  // TEAM_LEAD stays on /dashboard.
  // The backend already returns:
  // sections.employeeAttendance
  //
  // Therefore the existing dashboard page will use:
  // mode = "own"
  //
  // No redirect is needed here.
});
</script>


<template>
  <main class="redirect-page">
    <p>
      Loading dashboard...
    </p>
  </main>
</template>

<style scoped>
.redirect-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  color: #56627a;
  background: #f6f8fb;
}
</style>
