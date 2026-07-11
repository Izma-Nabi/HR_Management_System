<script setup lang="ts">
type FieldError = {
  field: string;
  message: string;
};

type AdminUser = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  status: string;
};

const config = useRuntimeConfig();

const defaultForm = () => ({
  name: "",
  employeeCode: "",
  email: "",
  password: "",
  phone: "",
  department: "",
  designation: "",
  fingerprintId: "",
  employmentStatus: "ACTIVE"
});

const form = reactive(defaultForm());
const token = ref("");
const adminUser = ref<AdminUser | null>(null);
const pageReady = ref(false);
const accessDenied = ref(false);
const loading = ref(false);
const successMessage = ref("");
const errorMessage = ref("");
const fieldErrors = ref<FieldError[]>([]);

const fieldErrorMap = computed(() => {
  return fieldErrors.value.reduce<Record<string, string>>((errors, error) => {
    errors[error.field] = error.message;
    return errors;
  }, {});
});

onMounted(async () => {
  token.value = localStorage.getItem("token") || "";
  const rawUser = localStorage.getItem("user");

  if (!token.value || !rawUser) {
    await navigateTo("/login", { replace: true });
    return;
  }

  try {
    adminUser.value = JSON.parse(rawUser);
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    await navigateTo("/login", { replace: true });
    return;
  }

  accessDenied.value = adminUser.value?.role !== "SUPER_ADMIN";
  pageReady.value = true;
});

const resetForm = () => {
  Object.assign(form, defaultForm());
  fieldErrors.value = [];
  errorMessage.value = "";
};

const logout = async () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  await navigateTo("/login", { replace: true });
};

const createEmployee = async () => {
  loading.value = true;
  successMessage.value = "";
  errorMessage.value = "";
  fieldErrors.value = [];

  try {
    const response = await $fetch<{ message: string }>(`${config.public.apiBase}/admin/employees`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.value}`
      },
      body: form
    });

    successMessage.value = response.message || "Employee created successfully";
    resetForm();
  } catch (error: any) {
    errorMessage.value = error?.data?.message || "Unable to create employee";
    fieldErrors.value = Array.isArray(error?.data?.errors) ? error.data.errors : [];

    if (error?.statusCode === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      await navigateTo("/login", { replace: true });
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <main class="page">
    <section v-if="pageReady" class="panel">
      <header class="page-header">
        <div>
          <p class="eyebrow">Super Admin</p>
          <h1>Create Employee</h1>
        </div>

        <div class="account">
          <span>{{ adminUser?.fullName }}</span>
          <button class="secondary-button" type="button" @click="logout">Logout</button>
        </div>
      </header>

      <p v-if="accessDenied" class="notice error">
        This page is only available to Super Admin users.
      </p>

      <form v-else class="employee-form" @submit.prevent="createEmployee">
        <label class="field">
          <span>Name</span>
          <input v-model="form.name" type="text" autocomplete="name" required>
          <small v-if="fieldErrorMap.name">{{ fieldErrorMap.name }}</small>
        </label>

        <label class="field">
          <span>Employee code</span>
          <input v-model="form.employeeCode" type="text" required>
          <small v-if="fieldErrorMap.employeeCode">{{ fieldErrorMap.employeeCode }}</small>
        </label>

        <label class="field">
          <span>Email</span>
          <input v-model="form.email" type="email" autocomplete="email" required>
          <small v-if="fieldErrorMap.email">{{ fieldErrorMap.email }}</small>
        </label>

        <label class="field">
          <span>Password</span>
          <input v-model="form.password" type="password" autocomplete="new-password" required>
          <small v-if="fieldErrorMap.password">{{ fieldErrorMap.password }}</small>
        </label>

        <label class="field">
          <span>Phone</span>
          <input v-model="form.phone" type="tel" autocomplete="tel">
          <small v-if="fieldErrorMap.phone">{{ fieldErrorMap.phone }}</small>
        </label>

        <label class="field">
          <span>Department</span>
          <input v-model="form.department" type="text">
          <small v-if="fieldErrorMap.department">{{ fieldErrorMap.department }}</small>
        </label>

        <label class="field">
          <span>Designation</span>
          <input v-model="form.designation" type="text">
          <small v-if="fieldErrorMap.designation">{{ fieldErrorMap.designation }}</small>
        </label>

        <label class="field">
          <span>Fingerprint ID</span>
          <input v-model="form.fingerprintId" type="text">
          <small v-if="fieldErrorMap.fingerprintId">{{ fieldErrorMap.fingerprintId }}</small>
        </label>

        <label class="field">
          <span>Status</span>
          <select v-model="form.employmentStatus">
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="RESIGNED">Resigned</option>
            <option value="TERMINATED">Terminated</option>
          </select>
          <small v-if="fieldErrorMap.employmentStatus">{{ fieldErrorMap.employmentStatus }}</small>
        </label>

        <div class="actions">
          <button class="secondary-button" type="button" @click="resetForm">Clear</button>
          <button class="primary-button" type="submit" :disabled="loading">
            {{ loading ? "Creating..." : "Create employee" }}
          </button>
        </div>

        <p v-if="errorMessage" class="notice error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="notice success">{{ successMessage }}</p>
      </form>
    </section>

    <p v-else class="loading-state">Loading...</p>
  </main>
</template>

<style scoped>
.page {
  min-height: 100vh;
  padding: 32px;
  background: #f6f8fb;
}

.panel {
  width: min(100%, 900px);
  margin: 0 auto;
  padding: 24px;
  background: #ffffff;
  border: 1px solid #dfe5ef;
  border-radius: 8px;
  box-shadow: 0 12px 32px rgba(34, 45, 64, 0.06);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 22px;
}

.eyebrow {
  margin: 0 0 4px;
  color: #647086;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: #172033;
  font-size: 28px;
  line-height: 1.2;
}

.account {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #354052;
  font-weight: 700;
}

.employee-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.field {
  display: grid;
  gap: 7px;
  min-width: 0;
}

.field span {
  color: #354052;
  font-size: 14px;
  font-weight: 800;
}

.field input,
.field select {
  width: 100%;
  min-height: 42px;
  padding: 9px 11px;
  color: #172033;
  background: #ffffff;
  border: 1px solid #cfd7e6;
  border-radius: 6px;
  outline: none;
}

.field input:focus,
.field select:focus {
  border-color: #1f6feb;
  box-shadow: 0 0 0 3px rgba(31, 111, 235, 0.12);
}

.field small {
  color: #b42318;
  font-size: 12px;
  font-weight: 700;
}

.actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 6px;
}

.primary-button,
.secondary-button {
  min-height: 40px;
  padding: 9px 14px;
  border-radius: 6px;
  font-weight: 800;
}

.primary-button {
  color: #ffffff;
  background: #1f6feb;
  border: 1px solid #1f6feb;
}

.secondary-button {
  color: #354052;
  background: #ffffff;
  border: 1px solid #cfd7e6;
}

.primary-button:disabled {
  cursor: wait;
  opacity: 0.72;
}

.notice {
  grid-column: 1 / -1;
  margin: 0;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 800;
}

.notice.error {
  color: #9f1d1d;
  background: #fff0f0;
  border: 1px solid #f4c7c7;
}

.notice.success {
  color: #0f6b3d;
  background: #ecfdf3;
  border: 1px solid #b7ebc9;
}

.loading-state {
  min-height: calc(100vh - 64px);
  display: grid;
  place-items: center;
  color: #647086;
}

@media (max-width: 720px) {
  .page {
    padding: 18px;
  }

  .page-header,
  .account {
    align-items: stretch;
    flex-direction: column;
  }

  .employee-form {
    grid-template-columns: 1fr;
  }

  .actions {
    flex-direction: column-reverse;
  }

  .primary-button,
  .secondary-button {
    width: 100%;
  }
}
</style>
