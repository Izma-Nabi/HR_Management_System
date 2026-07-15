<script setup lang="ts">
type Department = {
  id: number;
  departmentName: string;
};

type AdminProfile = {
  id: number;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  address: string | null;
  departmentId: number | null;
  managedDepartmentIds: number[];
  designation: string | null;
  joiningDate: string | null;
  user: {
    email: string;
  };
};

definePageMeta({
  layout: "dashboard"
});

const route = useRoute();
const config = useRuntimeConfig();
const id = route.params.id;

const departments = ref<Department[]>([]);
const loading = ref(false);
const pageLoading = ref(true);
const errorMessage = ref("");
const photoInputKey = ref(0);

const form = reactive({
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
  selectedDepartmentId: null as number | null,
  managedDepartmentIds: [] as number[],
  designation: "",
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
  const response = await $fetch<{ data: Department[] }>(`${config.public.apiBase}/departments`, {
    headers
  });

  departments.value = response.data;
};

const loadAdmin = async (headers: Record<string, string>) => {
  const response = await $fetch<{ data: AdminProfile }>(`${config.public.apiBase}/users/admin/${id}`, {
    headers
  });

  const admin = response.data;

  form.email = admin.user.email;
  form.firstName = admin.firstName;
  form.lastName = admin.lastName || "";
  form.phone = admin.phone || "";
  form.address = admin.address || "";
  form.managedDepartmentIds =
  admin.managedDepartmentIds || [];
  form.designation = admin.designation || "";
  form.joiningDate = formatDate(admin.joiningDate);
  form.photo = null;
  photoInputKey.value += 1;
};

onMounted(async () => {
  const headers = authHeaders();

  if (!headers) {
    await navigateTo("/login", { replace: true });
    return;
  }

  try {
    await Promise.all([
      loadDepartments(headers),
      loadAdmin(headers)
    ]);
  } catch (error: any) {
    errorMessage.value = error?.data?.message || "Unable to load administrator";
  } finally {
    pageLoading.value = false;
  }
});

const addDepartment = () => {

  if (!form.selectedDepartmentId) {
    return;
  }

  if (!form.managedDepartmentIds.includes(form.selectedDepartmentId)) {
    form.managedDepartmentIds.push(
      form.selectedDepartmentId
    );
  }

  form.selectedDepartmentId = null;
};


const removeDepartment = (departmentId:number) => {

  form.managedDepartmentIds =
    form.managedDepartmentIds.filter(
      id => id !== departmentId
    );

};


const getDepartmentName = (id:number) => {

  return departments.value.find(
    department => department.id === id
  )?.departmentName || "";

};


const saveAdmin = async () => {
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
    body.append("designation", form.designation);
    body.append("joiningDate", form.joiningDate);

    // Primary department (users.department_id)
    body.append(
      "departmentId",
      form.managedDepartmentIds.length
        ? String(form.managedDepartmentIds[0])
        : ""
    );

    // Managed departments (admin_departments)
    body.append(
      "managedDepartmentIds",
      JSON.stringify(form.managedDepartmentIds)
    );

    if (form.photo) {
      body.append("photo", form.photo);
    }

    await $fetch(`${config.public.apiBase}/users/admin/${id}`, {
      method: "PUT",
      headers,
      body
    });

    await navigateTo("/dashboard/admins");
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
        <h1>Edit Administrator</h1>
        <p>Update administrator information.</p>
      </div>

      <NuxtLink to="/dashboard/admins" class="cancel">
        Back
      </NuxtLink>
    </div>

    <p v-if="errorMessage" class="notice error">{{ errorMessage }}</p>
    <p v-if="pageLoading" class="loading">Loading administrator...</p>

    <form v-else class="form" autocomplete="off" @submit.prevent="saveAdmin">
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
          <input v-model="form.email" type="email" placeholder="admin@company.com" required>
        </label>

        <label class="form-group">
          <span>Phone</span>
          <input v-model="form.phone" type="tel" placeholder="03xxxxxxxxx">
        </label>

        <label class="form-group full">
          <span>Departments</span>

          <div class="department-picker">

            <select v-model.number="form.selectedDepartmentId">

              <option :value="null" disabled>
                Select Department
              </option>

              <option
                v-for="department in departments"
                :key="department.id"
                :value="department.id"
              >
                {{ department.departmentName }}
              </option>

            </select>


            <button
              type="button"
              @click="addDepartment"
            >
              +
            </button>

          </div>


          <div
            v-if="form.managedDepartmentIds.length"
            class="department-list"
          >

            <div
              v-for="departmentId in form.managedDepartmentIds"
              :key="departmentId"
              class="department-chip"
            >

              <span>
                {{ getDepartmentName(departmentId) }}
              </span>


              <button
                type="button"
                @click="removeDepartment(departmentId)"
              >
                ×
              </button>

            </div>

          </div>

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
        <NuxtLink to="/dashboard/admins" class="cancel">
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

.buttons {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 35px;
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
