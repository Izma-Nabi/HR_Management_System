<script setup lang="ts">
definePageMeta({
  layout: "dashboard"
});

const route = useRoute();
const config = useRuntimeConfig();
const { hasPermission } = useAuthUser();

const loading = ref(false);
const pageLoading = ref(true);
const errorMessage = ref("");
const canUpdateDepartment = computed(() => hasPermission("UPDATE_DEPARTMENT"));

const form = reactive({
  departmentName: "",
  description: ""
});

const authHeaders = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return null;
  }

  return {
    Authorization: `Bearer ${token}`
  };
};

const loadDepartment = async () => {
  const headers = authHeaders();

  if (!headers) {
    await navigateTo("/login", { replace: true });
    return;
  }

  try {
    const response = await $fetch<{ data: { departmentName: string; description: string | null } }>(
      `${config.public.apiBase}/departments/${route.params.id}`,
      {
        headers
      }
    );

    form.departmentName = response.data.departmentName;
    form.description = response.data.description || "";
  } catch (error: any) {
    errorMessage.value = error?.data?.message || "Unable to load department";
  } finally {
    pageLoading.value = false;
  }
};

onMounted(async () => {
  if (!canUpdateDepartment.value) {
    await navigateTo("/dashboard", { replace: true });
    return;
  }

  await loadDepartment();
});

const updateDepartment = async () => {
  const headers = authHeaders();

  if (!headers) {
    await navigateTo("/login", { replace: true });
    return;
  }

  loading.value = true;
  errorMessage.value = "";

  try {
    await $fetch(`${config.public.apiBase}/departments/${route.params.id}`, {
      method: "PUT",
      headers,
      body: {
        departmentName: form.departmentName,
        description: form.description
      }
    });

    await navigateTo("/dashboard/departments");
  } catch (error: any) {
    errorMessage.value = error?.data?.message || "Update failed";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h1>Edit Department</h1>
      <p>Update department information.</p>
    </div>

    <p v-if="errorMessage" class="notice error">{{ errorMessage }}</p>
    <p v-if="pageLoading" class="loading">Loading department...</p>

    <form v-else class="form" @submit.prevent="updateDepartment">
      <label class="form-group">
        <span>Department Name</span>
        <input v-model="form.departmentName" type="text" required>
      </label>

      <label class="form-group">
        <span>Description</span>
        <textarea v-model="form.description" rows="4"></textarea>
      </label>

      <div class="buttons">
        <NuxtLink to="/dashboard/departments" class="cancel">
          Cancel
        </NuxtLink>

        <button type="submit" :disabled="loading">
          {{ loading ? "Updating..." : "Save" }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.page {
  max-width: 900px;
}

.page-header {
  margin-bottom: 30px;
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

.form {
  padding: 35px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.form-group {
  display: grid;
  gap: 8px;
  margin-bottom: 22px;
}

.form-group span {
  color: #374151;
  font-weight: 700;
}

input,
textarea {
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  outline: none;
}

textarea {
  resize: vertical;
}

input:focus,
textarea:focus {
  border-color: #756db0;
  box-shadow: 0 0 0 3px rgba(117, 109, 176, 0.14);
}

.buttons {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;
}

.cancel {
  padding: 10px 16px;
  color: #374151;
  text-decoration: none;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-weight: 700;
}

button {
  min-height: 44px;
  padding: 10px 20px;
  color: #ffffff;
  background: #756db0;
  border: 1px solid #756db0;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 800;
}

button:disabled {
  cursor: wait;
  opacity: 0.7;
}

.notice,
.loading {
  margin: 0 0 16px;
  padding: 12px 14px;
  border-radius: 8px;
  font-weight: 700;
}

.notice.error {
  color: #9f1d1d;
  background: #fff0f0;
  border: 1px solid #f4c7c7;
}

.loading {
  color: #6b7280;
  background: #ffffff;
  border: 1px solid #e5e7eb;
}
</style>
