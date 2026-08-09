<template>
  <div class="dashboard-layout">

    <Sidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <div class="content-area">

      <Header @toggle-menu="sidebarOpen = !sidebarOpen" />

      <main class="page-content">
        <slot />
      </main>

    </div>

  </div>
</template>


<script setup>
import Sidebar from "~/components/dashboard/Sidebar.vue";
import Header from "~/components/dashboard/Header.vue";

const route = useRoute();
const sidebarOpen = ref(false);

watch(
  () => route.fullPath,
  () => {
    sidebarOpen.value = false;
  }
);
</script>


<style scoped>

.dashboard-layout {
  min-height: 100vh;
  background: transparent;
}

.content-area {
  width: calc(100% - var(--sidebar-collapsed-width));
  min-height: 100vh;
  margin-left: var(--sidebar-collapsed-width);
  transition: margin-left 220ms var(--ease-out), width 220ms var(--ease-out);
}

.page-content {
  width: min(100%, 1600px);
  margin: 0 auto;
  padding: calc(var(--header-height) + 34px) clamp(20px, 3vw, 44px) 48px;
  animation: ui-rise 420ms var(--ease-out) both;
}

@media (max-width: 980px) {
  .content-area {
    width: 100%;
    margin-left: 0;
  }

  .page-content {
    padding-top: calc(var(--header-height) + 24px);
  }
}

</style>
