<script setup>
import { reactive, ref, watch } from "vue";
import PermissionList from "./PermissionList.vue";

const errors = ref({});

const props = defineProps({
  permissions: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  role: {
    type: Object,
    default: () => ({
      roleName: "",
      permissions: [],
    }),
  },
});

const emit = defineEmits([
  "submit",
  "cancel",
]);

const form = reactive({
  roleName: "",
  permissions: [],
});

watch(
  () => props.role,
  (newRole) => {
    form.roleName = newRole?.roleName || "";
    form.permissions = [...(newRole?.permissions || [])];
  },
  {
    immediate: true,
    deep: true,
  }
);

const submitForm = () => {
  errors.value = {};

  if (!form.roleName.trim()) {
    errors.value.roleName = "Role name is required";
  }

  if (!form.permissions.length) {
    errors.value.permissions = "Select at least one permission";
  }

  if (Object.keys(errors.value).length > 0) {
    return;
  }

  emit("submit", {
    roleName: form.roleName.trim(),
    permissions: form.permissions,
  });
};
</script>

<template>
  <div class="card">
    <div class="header">
      <h2>Role Information</h2>
    </div>

    <div class="body">
      <div class="field">
        <label>Role Name</label>

        <input
          v-model="form.roleName"
          type="text"
          placeholder="Enter role name"
        />

        <p
          v-if="errors.roleName"
          class="error"
        >
          {{ errors.roleName }}
        </p>
      </div>

      <div class="field">
        <label>Permissions</label>

        <PermissionList
          v-model="form.permissions"
          :permissions="permissions"
        />

        <p
          v-if="errors.permissions"
          class="error"
        >
          {{ errors.permissions }}
        </p>
      </div>
    </div>

    <div class="footer">
      <button
        class="cancel-btn"
        @click="emit('cancel')"
      >
        Cancel
      </button>

      <button
        class="save-btn"
        :disabled="loading"
        @click="submitForm"
      >
        {{ loading ? "Saving..." : "Save Role" }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.header {
  padding: 24px;
  border-bottom: 1px solid #ececec;
}

.header h2 {
  color: #374151;
}

.body {
  padding: 24px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 30px;
}

label {
  font-weight: 600;
}

input {
  padding: 14px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 15px;
}

input:focus {
  outline: none;
  border-color: #4f46e5;
}

.error {
  margin-top: 5px;
  color: #dc2626;
  font-size: 13px;
}

.footer {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  padding: 24px;
  border-top: 1px solid #ececec;
}

button {
  padding: 12px 22px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}

.cancel-btn {
  background: #e5e7eb;
}

.save-btn {
  background: #4f46e5;
  color: #fff;
}

.save-btn:hover {
  background: #4338ca;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>