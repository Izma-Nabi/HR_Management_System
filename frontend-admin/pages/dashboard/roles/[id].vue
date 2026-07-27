<script setup>
definePageMeta({
  layout: "dashboard"
});

import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

import RoleForm from "~/components/dashboard/roles/RoleForm.vue";
import roleService from "~/services/role.service";

const route = useRoute();
const router = useRouter();
const { hasPermission } = useAuthUser();
const canUpdateRole = computed(() => hasPermission("UPDATE_ROLE"));

const loading = ref(false);
const permissions = ref([]);

const role = ref({
  roleName: "",
  permissions: []
});

const goBack = () => {
  router.push("/dashboard/roles");
};

const loadData = async () => {
  loading.value = true;

  try {
    const [roleResponse, permissionResponse] = await Promise.all([
      roleService.getRole(route.params.id),
      roleService.getPermissions()
    ]);

    permissions.value = permissionResponse;

    role.value = {
      roleName: roleResponse.roleName,
      permissions: roleResponse.rolePermissions.map(
        (item) => item.permissionId
      )
    };
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const submit = async (form) => {
  loading.value = true;

  try {
    await roleService.updateRole(route.params.id, form);

    router.push("/dashboard/roles");
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  if (!canUpdateRole.value) {
    await navigateTo("/dashboard", { replace: true });
    return;
  }

  await loadData();
});
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Edit Role</h1>
        <p>Update role permissions</p>
      </div>

      <button
        class="back-btn"
        type="button"
        @click="goBack"
      >
        ← Back
      </button>
    </div>

    <RoleForm
      :role="role"
      :permissions="permissions"
      :loading="loading"
      @submit="submit"
      @cancel="goBack"
    />
  </div>
</template>

<style scoped>
.page {
  max-width: 1400px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0 0 6px;
  color: #1f2937;
  font-size: 30px;
}

.page-header p {
  margin: 0;
  color: #6b7280;
}

.back-btn {
  padding: 10px 18px;
  color: #ffffff;
  background: #4f46e5;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}

.back-btn:hover {
  background: #4338ca;
}
</style>
