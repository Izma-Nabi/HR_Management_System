<template>
  <div class="dashboard-layout">

    <Sidebar />

    <div class="content-area">

      <Header />

      <main class="page-content">
        <slot />
      </main>

    </div>

  </div>
</template>


<script setup>
import Sidebar from "~/components/dashboard/Sidebar.vue";
import Header from "~/components/dashboard/Header.vue";
</script>


<style scoped>

.dashboard-layout {
  min-height: 100vh;
  background: #f9fafb;
}


.content-area {
  margin-left: 250px;
  width: calc(100% - 250px);
}


.page-content {
  padding: 100px 30px 30px 30px;
}

</style>