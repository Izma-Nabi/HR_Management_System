<script setup>
defineProps({
  roles: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits([
  "edit",
  "delete"
]);
</script>

<template>
  <div class="table-card">
    <table class="table">
      <thead>
        <tr>
          <th>Role</th>
          <th>Users</th>
          <th>Permissions</th>
          <th class="actions-column">Actions</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="role in roles"
          :key="role.id"
        >
          <td>{{ role.roleName }}</td>

          <td>
            {{ role._count?.users || 0 }}
          </td>

          <td>
            {{ role.rolePermissions?.length || 0 }}
          </td>

          <td class="actions">
            <button
              class="edit-btn"
              @click="$emit('edit', role)"
            >
              Edit
            </button>

            <button
              class="delete-btn"
              @click="$emit('delete', role)"
            >
              Delete
            </button>
          </td>
        </tr>

        <tr v-if="!roles.length">
          <td
            colspan="4"
            class="empty"
          >
            No roles found.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-card{
    background:#fff;
    border-radius:14px;
    overflow:hidden;
    box-shadow:0 4px 18px rgba(0,0,0,.05);
}

.table{
    width:100%;
    border-collapse:collapse;
}

thead{
    background:#f8fafc;
}

th{
    text-align:left;
    padding:16px;
    font-weight:600;
    color:#374151;
}

td{
    padding:16px;
    border-top:1px solid #ececec;
}

.actions-column{
    width:180px;
}

.actions{
    display:flex;
    gap:10px;
}

button{
    border:none;
    cursor:pointer;
    border-radius:8px;
    padding:8px 14px;
    font-weight:500;
}

.edit-btn{
    background:#4F46E5;
    color:white;
}

.edit-btn:hover{
    background:#4338CA;
}

.delete-btn{
    background:#EF4444;
    color:white;
}

.delete-btn:hover{
    background:#DC2626;
}

.empty{
    text-align:center;
    color:#777;
    padding:40px;
}
</style>