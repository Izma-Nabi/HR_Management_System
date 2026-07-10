<template>
  <div>
    <Sidebar />

    <div class="main">
      <Header />

      <div class="content">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import Sidebar from "~/components/dashboard/Sidebar.vue"
import Header from "~/components/dashboard/Header.vue"
</script>

<style scoped>
.main {
  margin-left: 260px;
  min-height: 100vh;
  background: #f5f7fb;
}

.content {
  padding: 30px;
}
</style>