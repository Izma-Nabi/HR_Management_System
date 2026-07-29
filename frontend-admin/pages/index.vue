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

  if (!token) {
    await navigateTo("/login", {
      replace: true
    });

    return;
  }


  await fetchDashboard();


  const role =
    dashboard.value?.user?.role;


  if (role === "EMPLOYEE") {
    await router.replace(
      "/dashboard/employee"
    );

    return;
  }


  // Admin / Super Admin stay here
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
