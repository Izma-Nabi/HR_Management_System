<script setup lang="ts">
definePageMeta({
  layout: "dashboard"
});

await navigateTo("/dashboard/users/add", {
  replace: true
});
</script>

<template>
  <p>Opening Create User...</p>
</template>
