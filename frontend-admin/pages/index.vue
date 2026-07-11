<script setup lang="ts">
onMounted(async () => {
  const token = localStorage.getItem("token");

  await navigateTo(token ? "/dashboard" : "/login", { replace: true });
});
</script>

<template>
  <main class="redirect-page">
    <p>Loading...</p>
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
