<script setup lang="ts">
type RoleKey = "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE";

type Department = {
  id: number;
  departmentName: string;
};

type UserProfile = {
  id: number;
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  photo: string | null;
  designation: string | null;
  joiningDate: string | null;
  role: RoleKey;
  employmentStatus: string;
  departmentId: number | null;
};

definePageMeta({
  layout: "dashboard"
});

const route = useRoute();
const config = useRuntimeConfig();
const { hasPermission } = useAuthUser();
const userId = route.params.id;

const departments = ref<Department[]>([]);
const loading = ref(false);
const pageLoading = ref(true);
const errorMessage = ref("");
const photoInputKey = ref(0);
const canUpdateUser = computed(() => hasPermission("UPDATE_USER"));

const roles: Array<{ value: RoleKey; label: string }> = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "EMPLOYEE", label: "Employee" }
];

const employmentStatuses = [
  "ACTIVE",
  "INACTIVE",
  "RESIGNED",
  "TERMINATED"
];

const form = reactive({
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
  role: "EMPLOYEE" as RoleKey,
  departmentId: null as number | null,
  designation: "",
  employmentStatus: "ACTIVE",
  joiningDate: "",
  photo: null as File | null
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

const formatDate = (value: string | null) => {
  return value ? value.substring(0, 10) : "";
};

const selectPhoto = (event: Event) => {
  const input = event.target as HTMLInputElement;
  form.photo = input.files?.[0] || null;
};

const loadDepartments = async (headers: Record<string, string>) => {
  const response = await $fetch<{ data: Department[] }>(
    `${config.public.apiBase}/departments`,
    { headers }
  );

  departments.value = response.data;
};

const loadUser = async (headers: Record<string, string>) => {
  const response = await $fetch<{ data: UserProfile }>(
    `${config.public.apiBase}/users/${userId}`,
    { headers }
  );

  const user = response.data;

  form.email = user.email;
  form.firstName = user.firstName;
  form.lastName = user.lastName || "";
  form.phone = user.phone || "";
  form.address = user.address || "";
  form.role = user.role;
  form.departmentId = user.departmentId || null;
  form.designation = user.designation || "";
  form.employmentStatus = user.employmentStatus || "ACTIVE";
  form.joiningDate = formatDate(user.joiningDate);
  form.photo = null;
  photoInputKey.value += 1;
};

onMounted(async () => {
  if (!canUpdateUser.value) {
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
      loadUser(headers)
    ]);
  } catch (error: any) {
    errorMessage.value = error?.data?.message || "Unable to load user";
  } finally {
    pageLoading.value = false;
  }
});

const saveUser = async () => {
  const headers = authHeaders();

  if (!headers) {
    await navigateTo("/login", { replace: true });
    return;
  }

  loading.value = true;
  errorMessage.value = "";

  try {
    const body = new FormData();

    body.append("email", form.email);
    body.append("firstName", form.firstName);
    body.append("lastName", form.lastName);
    body.append("phone", form.phone);
    body.append("address", form.address);
    body.append("role", form.role);
    body.append("departmentId", form.departmentId ? String(form.departmentId) : "");
    body.append("designation", form.designation);
    body.append("employmentStatus", form.employmentStatus);
    body.append("joiningDate", form.joiningDate);

    if (form.photo) {
      body.append("photo", form.photo);
    }

    await $fetch(`${config.public.apiBase}/users/${userId}`, {
      method: "PUT",
      headers,
      body
    });

    await navigateTo("/dashboard/users");
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
      <div>
        <h1>Edit User</h1>
        <p>Update account, role, and profile information.</p>
      </div>

      <NuxtLink to="/dashboard/users" class="cancel">
        Back
      </NuxtLink>
    </div>

    <p v-if="errorMessage" class="notice error">{{ errorMessage }}</p>
    <p v-if="pageLoading" class="loading">Loading user...</p>

    <form v-else class="form" autocomplete="off" @submit.prevent="saveUser">
      <div class="grid">
        <label class="form-group">
          <span>First Name</span>
          <input v-model="form.firstName" type="text" placeholder="First name" required>
        </label>

        <label class="form-group">
          <span>Last Name</span>
          <input v-model="form.lastName" type="text" placeholder="Last name">
        </label>

        <label class="form-group">
          <span>Email</span>
          <input v-model="form.email" type="email" placeholder="user@company.com" required>
        </label>

        <label class="form-group">
          <span>Role</span>
          <select v-model="form.role" required>
            <option
              v-for="role in roles"
              :key="role.value"
              :value="role.value"
            >
              {{ role.label }}
            </option>
          </select>
        </label>

        <label class="form-group">
          <span>Phone</span>
          <input v-model="form.phone" type="tel" placeholder="03xxxxxxxxx">
        </label>

        <label class="form-group">
          <span>Status</span>
          <select v-model="form.employmentStatus">
            <option
              v-for="status in employmentStatuses"
              :key="status"
              :value="status"
            >
              {{ status.replaceAll("_", " ") }}
            </option>
          </select>
        </label>

        <label class="form-group">
          <span>Primary Department</span>
          <select v-model.number="form.departmentId">
            <option :value="null">No Department</option>
            <option
              v-for="department in departments"
              :key="department.id"
              :value="department.id"
            >
              {{ department.departmentName }}
            </option>
          </select>
        </label>

        <label class="form-group">
          <span>Designation</span>
          <input v-model="form.designation" type="text" placeholder="Designation">
        </label>

        <label class="form-group">
          <span>Joining Date</span>
          <input v-model="form.joiningDate" type="date">
        </label>

        <label class="form-group full">
          <span>Address</span>
          <textarea v-model="form.address" rows="3" placeholder="Enter address"></textarea>
        </label>

        <label class="form-group full">
          <span>Photo</span>
          <input
            :key="photoInputKey"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            @change="selectPhoto"
          >
        </label>
      </div>

      <div class="buttons">
        <NuxtLink to="/dashboard/users" class="cancel">
          Cancel
        </NuxtLink>

        <button type="submit" :disabled="loading">
          {{ loading ? "Saving..." : "Save Changes" }}
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
}

.form-group > span {
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

textarea {
  resize: vertical;
}

.buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 28px;
}

.buttons button,
.cancel {
  min-height: 42px;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 700;
}

.buttons button {
  color: #ffffff;
  background: #4f46e5;
  border: 0;
  cursor: pointer;
}

.buttons button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.cancel {
  display: inline-flex;
  align-items: center;
  color: #374151;
  background: #ffffff;
  border: 1px solid #d1d5db;
  text-decoration: none;
}

.loading,
.notice {
  padding: 14px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-weight: 700;
}

.notice.error {
  color: #9f1d1d;
  background: #fff0f0;
  border-color: #f4c7c7;
}

@media (max-width: 720px) {
  .page-header,
  .buttons {
    align-items: stretch;
    flex-direction: column;
  }

  .form {
    padding: 22px;
  }

  .grid {
    grid-template-columns: 1fr;
  }

  .full {
    grid-column: auto;
  }
}
</style>
