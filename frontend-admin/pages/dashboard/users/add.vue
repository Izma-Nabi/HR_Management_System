<script setup lang="ts">
import departmentService from "~/services/department.service";
import roleService from "~/services/role.service";
import userService from "~/services/user.service";

type FieldError = {
  field: string;
  message: string;
};

type Role = {
  id: number;
  roleName: string;
};

type Designation = {
  id: number;
  designationName: string;
};

type Department = {
  id: number;
  departmentName: string;
};

type UserForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  photo: File | null;
  roleId: number | null;
  departmentId: number | null;
  designationId: number | null;
  joiningDate: string;
};

definePageMeta({
  layout: "dashboard"
});

const { hasPermission, hasAnyPermission } = useAuthUser();

const canCreateUser = computed(() =>
  hasAnyPermission("CREATE_ADMIN", "CREATE_EMPLOYEE")
);

const defaultForm = (): UserForm => ({
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  address: "",
  photo: null,
  roleId: null,
  departmentId: null,
  designationId: null,
  joiningDate: ""
});

const form = reactive(defaultForm());
const roles = ref<Role[]>([]);
const designations = ref<Designation[]>([]);
const departments = ref<Department[]>([]);
const loading = ref(false);
const pageLoading = ref(true);
const successMessage = ref("");
const errorMessage = ref("");
const fieldErrors = ref<FieldError[]>([]);
const photoInputKey = ref(0);

const visibleRoles = computed(() => roles.value);

const fieldErrorMap = computed(() => {
  return fieldErrors.value.reduce<Record<string, string>>((errors, error) => {
    errors[error.field] = error.message;
    return errors;
  }, {});
});

const loadDepartments = async (headers: Record<string, string>) => {
  departments.value = await departmentService.getDepartments();
};

const loadRoles = async (headers: Record<string, string>) => {
   roles.value = await roleService.getRoles();
};

const loadDesignations = async (departmentId: number, headers: Record<string, string>) => {
  designations.value =  await departmentService.getDesignations(departmentId);
};

watch(
  () => form.departmentId,
  async (departmentId) => {
    form.designationId = null;
    designations.value = [];

    if (!departmentId) {
      return;
    }

    try {
      await loadDesignations(departmentId);
    } catch (error: any) {
      errorMessage.value = error?.data?.message || "Unable to load designations";
    }
  }
);

onMounted(async () => {
  if (!canCreateUser.value) {
    await navigateTo("/dashboard", { replace: true });
    return;
  }

  const headers = authHeaders();

  if (!headers) {
    await navigateTo("/login", { replace: true });
    return;
  }

  try {
    await Promise.all([
      loadDepartments(headers),
      loadRoles(headers)
    ]);

    if (!form.roleId && visibleRoles.value.length === 1) {
      form.roleId = visibleRoles.value[0].id;
    }
  } catch (error: any) {
    errorMessage.value = error?.data?.message || "Unable to load form data";
  } finally {
    pageLoading.value = false;
  }
});

const resetForm = () => {
  Object.assign(form, defaultForm());

  if (visibleRoles.value.length === 1) {
    form.roleId = visibleRoles.value[0].id;
  }

  designations.value = [];
  fieldErrors.value = [];
  errorMessage.value = "";
  successMessage.value = "";
  photoInputKey.value += 1;
};

const selectPhoto = (event: Event) => {
  const input = event.target as HTMLInputElement;
  form.photo = input.files?.[0] || null;
};

const saveUser = async () => {
  const headers = authHeaders();

  if (!headers) {
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
    body.append("roleId", form.roleId ? String(form.roleId) : "");
    body.append("departmentId", form.departmentId ? String(form.departmentId) : "");
    body.append("designationId", form.designationId ? String(form.designationId) : "");
    body.append("joiningDate", form.joiningDate);

    if (form.photo) {
      body.append("photo", form.photo);
    }

    const response = await $fetch<{ message: string }>(
      `${config.public.apiBase}/users`,
      {
        method: "POST",
        headers,
        body
      }
    );

    successMessage.value = response.message || "User created successfully";
    resetForm();
  } catch (error: any) {
    errorMessage.value = error?.data?.message || "Unable to create user";
    fieldErrors.value = Array.isArray(error?.data?.errors)
      ? error.data.errors
      : [];

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
        <h1>Create User</h1>
        <p>Create a user account.</p>
      </div>

      <NuxtLink to="/dashboard/users" class="back-link">
        Back
      </NuxtLink>
    </div>

    <p v-if="errorMessage" class="notice error">{{ errorMessage }}</p>
    <p v-if="pageLoading" class="loading">Loading form...</p>

    <form v-else class="form" autocomplete="off" @submit.prevent="saveUser">
      <div class="grid">
        <label class="form-group">
          <span>First Name</span>
          <input v-model="form.firstName" type="text" placeholder="First name" autocomplete="given-name" required>
          <small v-if="fieldErrorMap.firstName">{{ fieldErrorMap.firstName }}</small>
        </label>

        <label class="form-group">
          <span>Last Name</span>
          <input v-model="form.lastName" type="text" placeholder="Last name" autocomplete="family-name" required>
          <small v-if="fieldErrorMap.lastName">{{ fieldErrorMap.lastName }}</small>
        </label>

        <label class="form-group">
          <span>Email</span>
          <input v-model="form.email" type="email" placeholder="user@company.com" autocomplete="email" required>
          <small v-if="fieldErrorMap.email">{{ fieldErrorMap.email }}</small>
        </label>

        <label class="form-group">
          <span>Password</span>
          <input v-model="form.password" type="password" placeholder="Minimum 8 characters" autocomplete="new-password" required>
          <small v-if="fieldErrorMap.password">{{ fieldErrorMap.password }}</small>
        </label>

        <label class="form-group">
          <span>Department</span>
          <select v-model.number="form.departmentId" required>
            <option :value="null" disabled>Select Department</option>
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
          <select v-model.number="form.designationId" :disabled="!form.departmentId" required>
            <option :value="null" disabled>Select Designation</option>
            <option
              v-for="designation in designations"
              :key="designation.id"
              :value="designation.id"
            >
              {{ designation.designationName }}
            </option>
          </select>
          <small v-if="fieldErrorMap.designationId">{{ fieldErrorMap.designationId }}</small>
        </label>

        <label class="form-group">
          <span>Role</span>
          <select v-model.number="form.roleId" required>
            <option :value="null" disabled>Select Role</option>
            <option
              v-for="role in visibleRoles"
              :key="role.id"
              :value="role.id"
            >
              {{ role.roleName }}
            </option>
          </select>
          <small v-if="fieldErrorMap.roleId">{{ fieldErrorMap.roleId }}</small>
        </label>

        <label class="form-group">
          <span>Joining Date</span>
          <input v-model="form.joiningDate" type="date" :min="today">
          <small v-if="fieldErrorMap.joiningDate">{{ fieldErrorMap.joiningDate }}</small>
        </label>

        <label class="form-group">
          <span>Phone</span>
          <input v-model="form.phone" type="tel" placeholder="03xxxxxxxxx" autocomplete="tel">
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

        <label class="form-group full">
          <span>Address</span>
          <textarea v-model="form.address" rows="4" placeholder="Address"></textarea>
          <small v-if="fieldErrorMap.address">{{ fieldErrorMap.address }}</small>
        </label>
      </div>

      <p v-if="successMessage" class="notice success">{{ successMessage }}</p>

      <div class="buttons">
        <button class="secondary-button" type="button" @click="resetForm">
          Clear
        </button>

        <button class="primary-button" type="submit" :disabled="loading">
          {{ loading ? "Creating..." : "Save" }}
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
  box-sizing: border-box;
}

select:disabled {
  color: #374151;
  background: #f9fafb;
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

.notice,
.loading {
  margin: 18px 0 0;
  padding: 12px 14px;
  border-radius: 8px;
  font-weight: 700;
}

.loading {
  color: #374151;
  background: #ffffff;
  border: 1px solid #e5e7eb;
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
