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

type Department = {
  id: number;
  departmentName: string;
};

const config = useRuntimeConfig();

const defaultForm = () => ({
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  address: "",
  photo: null as File | null,
  departmentId: null as number | null,
  designation: ""
});

const form = reactive(defaultForm());
const token = ref("");
const photoInputKey = ref(0);
const adminUser = ref<AdminUser | null>(null);
const departments = ref<Department[]>([]);
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

const loadDepartments = async () => {
  const response = await $fetch<{ data: Department[] }>(`${config.public.apiBase}/departments`, {
    headers: {
      Authorization: `Bearer ${token.value}`
    }
  });

  departments.value = response.data;
};

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

  if (!accessDenied.value) {
    try {
      await loadDepartments();
    } catch {
      departments.value = [];
    }
  }

  pageReady.value = true;
});

const resetForm = () => {
  Object.assign(form, defaultForm());
  fieldErrors.value = [];
  errorMessage.value = "";
  photoInputKey.value += 1;
};

const selectPhoto = (event: Event) => {
  const input = event.target as HTMLInputElement;
  form.photo = input.files?.[0] || null;
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
    const body = new FormData();

    body.append("firstName", form.firstName);
    body.append("lastName", form.lastName);
    body.append("email", form.email);
    body.append("password", form.password);
    body.append("phone", form.phone);
    body.append("address", form.address);
    body.append("departmentId", form.departmentId ? String(form.departmentId) : "");
    body.append("designation", form.designation);

    if (form.photo) {
      body.append("photo", form.photo);
    }

    const response = await $fetch<{ message: string }>(`${config.public.apiBase}/admin/employees`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.value}`
      },
      body
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
          <span>First name</span>
          <input v-model="form.firstName" type="text" autocomplete="given-name" required>
          <small v-if="fieldErrorMap.firstName">{{ fieldErrorMap.firstName }}</small>
        </label>

        <label class="field">
          <span>Last name</span>
          <input v-model="form.lastName" type="text" autocomplete="family-name" required>
          <small v-if="fieldErrorMap.lastName">{{ fieldErrorMap.lastName }}</small>
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
          <span>Photo</span>
          <input
            :key="photoInputKey"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            @change="selectPhoto"
          >
          <small v-if="fieldErrorMap.photo">{{ fieldErrorMap.photo }}</small>
        </label>

        <label class="field">
          <span>Department</span>
          <select v-model.number="form.departmentId">
            <option value="">Select Department</option>
            <option
              v-for="department in departments"
              :key="department.id"
              :value="department.id"
            >
              {{ department.departmentName }}
            </option>
          </select>
          <small v-if="fieldErrorMap.departmentId">{{ fieldErrorMap.departmentId }}</small>
        </label>

        <label class="field">
          <span>Designation</span>
          <input v-model="form.designation" type="text">
          <small v-if="fieldErrorMap.designation">{{ fieldErrorMap.designation }}</small>
        </label>

        <label class="field field-full">
          <span>Address</span>
          <textarea v-model="form.address" rows="4"></textarea>
          <small v-if="fieldErrorMap.address">{{ fieldErrorMap.address }}</small>
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
.field select,
.field textarea {
  width: 100%;
  min-height: 42px;
  padding: 9px 11px;
  color: #172033;
  background: #ffffff;
  border: 1px solid #cfd7e6;
  border-radius: 6px;
  outline: none;
}

.field textarea {
  resize: vertical;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  border-color: #1f6feb;
  box-shadow: 0 0 0 3px rgba(31, 111, 235, 0.12);
}

.field small {
  color: #b42318;
  font-size: 12px;
  font-weight: 700;
}

.field-full {
  grid-column: 1 / -1;
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

  .field-full {
    grid-column: auto;
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
