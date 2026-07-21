<script setup lang="ts">

onMounted(() => {
  console.log("User:", user);
  console.log("Role ID:", roleId.value);
});


defineEmits(["click"]);
</script>

<template>
  <div class="actions">
    <button
      class="apply-btn"
      @click="$emit('click')"
    >
      + Apply Leave
    </button>
  </div>
</template>

<style scoped>
.actions{
  display:flex;
  justify-content:flex-end;
  margin-bottom:18px;
}

.apply-btn{
  background:#2563eb;
  color:#fff;
  border:none;
  padding:10px 18px;
  border-radius:8px;
  cursor:pointer;
  font-weight:700;
}

.apply-btn:hover{
  background:#1d4ed8;
}
</style>