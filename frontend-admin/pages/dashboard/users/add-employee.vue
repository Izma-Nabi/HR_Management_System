<script setup lang="ts">
type FieldError = {
  field: string;
  message: string;
};

type EmployeeForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  photo: File | null;
  departmentId: number | null;
  designation: string;
};

type Department = {
  id: number;
  departmentName: string;
};

definePageMeta({
  layout: "dashboard"
});

const config = useRuntimeConfig();

const defaultForm = (): EmployeeForm => ({
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  address: "",
  photo: null,
  departmentId: null,
  designation: ""
});

const form = reactive(defaultForm());
const photoInputKey = ref(0);
const departments = ref<Department[]>([]);
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

const loadDepartments = async (token: string) => {
  const response = await $fetch<{ data: Department[] }>(`${config.public.apiBase}/departments`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  departments.value = response.data;
};

onMounted(async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    await navigateTo("/login", { replace: true });
    return;
  }

  try {
    await loadDepartments(token);
  } catch {
    departments.value = [];
  }
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

const saveEmployee = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    await navigateTo("/login", { replace: true });
    return;
  }

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
        Authorization: `Bearer ${token}`
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
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Create Employee</h1>
        <p>Add employee profile and login details.</p>
      </div>

      <NuxtLink to="/dashboard/users/add" class="back-link">
        Back
      </NuxtLink>
    </div>

    <form class="form" @submit.prevent="saveEmployee">
      <div class="grid">
        <label class="form-group">
          <span>First Name</span>
          <input
            v-model="form.firstName"
            type="text"
            placeholder="First name"
            autocomplete="given-name"
            required
          >
          <small v-if="fieldErrorMap.firstName">{{ fieldErrorMap.firstName }}</small>
        </label>

        <label class="form-group">
          <span>Last Name</span>
          <input
            v-model="form.lastName"
            type="text"
            placeholder="Last name"
            autocomplete="family-name"
            required
          >
          <small v-if="fieldErrorMap.lastName">{{ fieldErrorMap.lastName }}</small>
        </label>

        <label class="form-group">
          <span>Email</span>
          <input
            v-model="form.email"
            type="email"
            placeholder="employee@company.com"
            autocomplete="email"
            required
          >
          <small v-if="fieldErrorMap.email">{{ fieldErrorMap.email }}</small>
        </label>

        <label class="form-group">
          <span>Password</span>
          <input
            v-model="form.password"
            type="password"
            placeholder="Minimum 8 characters"
            autocomplete="new-password"
            required
          >
          <small v-if="fieldErrorMap.password">{{ fieldErrorMap.password }}</small>
        </label>

        <label class="form-group">
          <span>Phone</span>
          <input
            v-model="form.phone"
            type="tel"
            placeholder="03xxxxxxxxx"
            autocomplete="tel"
          >
          <small v-if="fieldErrorMap.phone">{{ fieldErrorMap.phone }}</small>
        </label>

        <label class="form-group">
          <span>Photo</span>
          <input
            :key="photoInputKey"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            @change="selectPhoto"
          >
          <small v-if="fieldErrorMap.photo">{{ fieldErrorMap.photo }}</small>
        </label>

        <label class="form-group">
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

        <label class="form-group">
          <span>Designation</span>
          <input
            v-model="form.designation"
            type="text"
            placeholder="Designation"
          >
          <small v-if="fieldErrorMap.designation">{{ fieldErrorMap.designation }}</small>
        </label>

        <label class="form-group full">
          <span>Address</span>
          <textarea
            v-model="form.address"
            rows="4"
            placeholder="Employee address"
          ></textarea>
          <small v-if="fieldErrorMap.address">{{ fieldErrorMap.address }}</small>
        </label>
      </div>

      <p v-if="errorMessage" class="notice error">{{ errorMessage }}</p>
      <p v-if="successMessage" class="notice success">{{ successMessage }}</p>

      <div class="buttons">
        <button class="secondary-button" type="button" @click="resetForm">
          Clear
        </button>

        <button class="primary-button" type="submit" :disabled="loading">
          {{ loading ? "Creating..." : "Create Employee" }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.page {
  max-width: 1100px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;
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

.back-link {
  padding: 10px 16px;
  color: #374151;
  text-decoration: none;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-weight: 700;
}

.form {
  padding: 32px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.full {
  grid-column: 1 / -1;
}

.form-group {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.form-group span {
  color: #374151;
  font-weight: 700;
}

input,
select,
textarea {
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  color: #111827;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  outline: none;
}

textarea {
  resize: vertical;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #756db0;
  box-shadow: 0 0 0 3px rgba(117, 109, 176, 0.14);
}

small {
  color: #b42318;
  font-size: 12px;
  font-weight: 700;
}

.notice {
  margin: 18px 0 0;
  padding: 12px 14px;
  border-radius: 8px;
  font-weight: 700;
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

.buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 28px;
}

.primary-button,
.secondary-button {
  min-height: 44px;
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 800;
}

.primary-button {
  color: #ffffff;
  background: #756db0;
  border: 1px solid #756db0;
}

.secondary-button {
  color: #374151;
  background: #ffffff;
  border: 1px solid #d1d5db;
}

.primary-button:disabled {
  cursor: wait;
  opacity: 0.7;
}

@media (max-width: 768px) {
  .page-header {
    align-items: stretch;
    flex-direction: column;
  }

  .grid {
    grid-template-columns: 1fr;
  }

  .full {
    grid-column: auto;
  }

  .buttons {
    flex-direction: column-reverse;
  }

  .primary-button,
  .secondary-button {
    width: 100%;
  }
}
</style>
