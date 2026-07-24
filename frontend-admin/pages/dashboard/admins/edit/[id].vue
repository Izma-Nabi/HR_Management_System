<script setup lang="ts">
definePageMeta({
  layout: "dashboard"
});

const route = useRoute();

await navigateTo(`/dashboard/users/edit/${route.params.id}`, {
  replace: true
});
</script>

<template>
  <p>Opening Edit User...</p>
</template>
