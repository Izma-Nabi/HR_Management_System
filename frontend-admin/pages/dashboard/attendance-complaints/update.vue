<script setup lang="ts">
definePageMeta({
  layout: "dashboard"
});

const route = useRoute();
const complaintId = Number(route.query.complaintId);

await navigateTo(
  Number.isInteger(complaintId) && complaintId > 0
    ? `/dashboard/attendance-complaints/${complaintId}`
    : "/dashboard/attendance-complaints",
  { replace: true }
);
</script>

<template>
  <p>Opening attendance request...</p>
</template>
