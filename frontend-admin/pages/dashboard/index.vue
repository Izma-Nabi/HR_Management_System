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

  await fetchDashboard();


  const role = dashboard.value?.user?.role;


  if (role === "EMPLOYEE") {

    await router.replace(
      "/dashboard/employees"
    );

    return;
  }


});

</script>


<template>

  <div class="flex justify-center items-center h-screen">

    Loading dashboard...

  </div>

</template>