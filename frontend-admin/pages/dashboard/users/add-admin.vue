<script setup lang="ts">
type Department = {
  id: number;
  departmentName: string;
};

type FieldError = {
  field: string;
  message: string;
};

definePageMeta({
  layout: "dashboard"
});

const config = useRuntimeConfig();
const { hasPermission } = useAuthUser();
const canCreateAdmin = computed(() => hasPermission("CREATE_ADMIN"));

const departments = ref<Department[]>([]);
const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const fieldErrors = ref<FieldError[]>([]);
const photoInputKey = ref(0);
const today = new Date().toISOString().split("T")[0];


const form = reactive({
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
  departmentId: null as number | null,
  designation: "",
  joiningDate: "",
  photo: null as File |null
});

const fieldErrorMap = computed(() => {
  return fieldErrors.value.reduce<Record<string, string>>((errors, error) => {
    errors[error.field] = error.message;
    return errors;
  }, {});
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

const loadDepartments = async () => {
  const headers = authHeaders();

  if (!headers) {
    await navigateTo("/login", { replace: true });
    return;
  }

  const response = await $fetch<{ data: Department[] }>(`${config.public.apiBase}/departments`, {
    headers
  });

  departments.value = response.data;
};

onMounted(async () => {
  if (!canCreateAdmin.value) {
    await navigateTo("/dashboard", { replace: true });
    return;
  }

  try {
    await loadDepartments();
  } catch (error: any) {
    errorMessage.value = error?.data?.message || "Unable to load departments";
  }
});

const selectPhoto = (event: Event) => {
  const input = event.target as HTMLInputElement;
  form.photo = input.files?.[0] || null;
};

const resetForm = () => {
  form.email = "";
  form.password = "";
  form.firstName = "";
  form.lastName = "";
  form.phone = "";
  form.address = "";
  form.departmentId = null;
  form.designation = "";
  form.joiningDate = "";
  form.photo = null;
  fieldErrors.value = [];
  errorMessage.value = "";
  photoInputKey.value += 1;
};

const validateForm = () => {
  fieldErrors.value = [];

  if (!form.firstName.trim()) {
    fieldErrors.value.push({
      field: "firstName",
      message: "First Name is required."
    });
  }

  if (!form.email.trim()) {
    fieldErrors.value.push({
      field: "email",
      message: "Email is required."
    });
  }

  if (!form.password.trim()) {
    fieldErrors.value.push({
      field: "password",
      message: "Password is required."
    });
  }

  if (!form.departmentId) {
    fieldErrors.value.push({
      field: "departmentId",
      message: "Please select a department."
    });
  }

  if (form.password && form.password.length < 8) {
    fieldErrors.value.push({
      field: "password",
      message: "Password must be at least 8 characters."
    });
  }

  if (
    form.phone &&
    !/^03\d{9}$/.test(form.phone)
  ) {
    fieldErrors.value.push({
      field: "phone",
      message: "Enter a valid phone number."
    });
  }

  if (form.address && form.address.trim().length < 5) {
    fieldErrors.value.push({
      field: "address",
      message: "Address is too short."
    });
  }

  if (form.joiningDate && form.joiningDate < today) {
    fieldErrors.value.push({
      field: "joiningDate",
      message: "Joining date cannot be before today."
    });
  }

  return fieldErrors.value.length === 0;
};


const saveAdmin = async () => {
  const headers = authHeaders();

  if (!headers) {
    await navigateTo("/login", { replace: true });
    return;
  }

  loading.value = true;
  errorMessage.value = "";
  successMessage.value = "";
  fieldErrors.value = [];

  if (!validateForm()) {
    loading.value = false;
    return;
  }

  try {
    const body = new FormData();

    body.append("email", form.email);
    body.append("password", form.password);
    body.append("firstName", form.firstName);
    body.append("lastName", form.lastName);
    body.append("phone", form.phone);
    body.append("address", form.address);
    body.append("designation", form.designation);
    body.append("joiningDate", form.joiningDate);

    body.append(
      "departmentId",
      form.departmentId ? String(form.departmentId) : ""
    );

    if (form.photo) {
      body.append("photo", form.photo);
    }

    const response = await $fetch<{ message: string }>(
      `${config.public.apiBase}/users/admin`,
      {
        method: "POST",
        headers,
        body
      }
    );

    successMessage.value =
      response.message || "Administrator created successfully";

    resetForm();

    setTimeout(async () => {
      await navigateTo("/dashboard/admins");
    }, 1500);
  } catch (error: any) {
    errorMessage.value =
      error?.data?.message || "Unable to create administrator";

    fieldErrors.value = Array.isArray(error?.data?.errors)
      ? error.data.errors
      : [];
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Add New Admin</h1>
        <p>Create a new admin account.</p>
      </div>

      <NuxtLink to="/dashboard/admins" class="back-link">
        Back
      </NuxtLink>
    </div>

    <form class="form" autocomplete="off" @submit.prevent="saveAdmin">
      <div class="grid">
        <label class="form-group">
          <span>First Name</span>
          <input v-model="form.firstName" type="text" placeholder="First name" required>
          <small v-if="fieldErrorMap.firstName">{{ fieldErrorMap.firstName }}</small>
        </label>

        <label class="form-group">
          <span>Last Name</span>
          <input v-model="form.lastName" type="text" placeholder="Last name">
          <small v-if="fieldErrorMap.lastName">{{ fieldErrorMap.lastName }}</small>
        </label>

        <label class="form-group">
          <span>Email</span>
          <input v-model="form.email" type="email" placeholder="admin@company.com" autocomplete="new-email" required>
          <small v-if="fieldErrorMap.email">{{ fieldErrorMap.email }}</small>
        </label>

        <label class="form-group">
          <span>Password</span>
          <input v-model="form.password" type="password" placeholder="Minimum 8 characters" autocomplete="new-password" required>
          <small v-if="fieldErrorMap.password">{{ fieldErrorMap.password }}</small>
        </label>

        <label class="form-group">
          <span>Phone</span>
          <input v-model="form.phone" type="tel" placeholder="03xxxxxxxxx">
          <small v-if="fieldErrorMap.phone">{{ fieldErrorMap.phone }}</small>
        </label>

        <label class="form-group full">
          <span>Department</span>
          <select v-model.number="form.departmentId">
            <option :value="null" disabled>Select Department</option>
            <option
              v-for="department in departments"
              :key="department.id"
              :value="department.id"
            >
              {{ department.departmentName }}
            </option>
          </select>
          <small v-if="fieldErrorMap.departmentId">
            {{ fieldErrorMap.departmentId }}
          </small>
        </label>

        <label class="form-group">
          <span>Designation</span>
          <input v-model="form.designation" type="text" placeholder="Designation">
          <small v-if="fieldErrorMap.designation">{{ fieldErrorMap.designation }}</small>
        </label>

        <label class="form-group">
          <span>Joining Date</span>
          <input  v-model="form.joiningDate"  type="date"  :min="today"/>
          <small v-if="fieldErrorMap.joiningDate">{{ fieldErrorMap.joiningDate }}</small>
        </label>

        <label class="form-group full">
          <span>Address</span>
          <textarea v-model="form.address" rows="3" placeholder="Enter address"></textarea>
          <small v-if="fieldErrorMap.address">{{ fieldErrorMap.address }}</small>
        </label>

        <label class="form-group full">
          <span>Photo</span>
          <input
            :key="photoInputKey"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            @change="selectPhoto"
          >
          <small v-if="fieldErrorMap.photo">{{ fieldErrorMap.photo }}</small>
        </label>
      </div>

      <p v-if="errorMessage" class="notice error">{{ errorMessage }}</p>
      <p v-if="successMessage" class="notice success">{{ successMessage }}</p>

      <div class="buttons">
        <NuxtLink to="/dashboard/admins" class="cancel">
          Cancel
        </NuxtLink>

        <button type="submit" :disabled="loading">
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

.back-link,
.cancel {
  padding: 10px 16px;
  color: #374151;
  text-decoration: none;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-weight: 700;
}

.form {
  padding: 35px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
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
  gap: 15px;
  margin-top: 35px;
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
}
</style>
