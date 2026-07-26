<script setup>
const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },

  role: {
    type: Object,
    default: null,
  },

  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "close",
  "confirm",
]);
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="overlay"
    >
      <div class="modal">

        <div class="header">
          <h2>Delete Role</h2>
        </div>

        <div class="body">

          <p>
            Are you sure you want to delete
            <strong>{{ role?.roleName }}</strong>?
          </p>

          <p class="warning">
            This action cannot be undone.
          </p>

        </div>

        <div class="footer">

          <button
            class="cancel-btn"
            @click="$emit('close')"
          >
            Cancel
          </button>

          <button
            class="delete-btn"
            :disabled="loading"
            @click="$emit('confirm')"
          >
            {{ loading ? "Deleting..." : "Delete" }}
          </button>

        </div>

      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay{
    position:fixed;
    inset:0;
    background:rgba(0,0,0,.45);
    display:flex;
    justify-content:center;
    align-items:center;
    z-index:9999;
}

.modal{
    width:420px;
    background:white;
    border-radius:14px;
    overflow:hidden;
    box-shadow:0 10px 30px rgba(0,0,0,.15);
}

.header{
    padding:22px;
    border-bottom:1px solid #ececec;
}

.body{
    padding:24px;
}

.warning{
    margin-top:12px;
    color:#dc2626;
    font-size:14px;
}

.footer{
    padding:20px;
    display:flex;
    justify-content:flex-end;
    gap:12px;
    border-top:1px solid #ececec;
}

button{
    border:none;
    padding:12px 20px;
    border-radius:10px;
    cursor:pointer;
    font-weight:600;
}

.cancel-btn{
    background:#e5e7eb;
}

.delete-btn{
    background:#dc2626;
    color:white;
}

.delete-btn:hover{
    background:#b91c1c;
}

.delete-btn:disabled{
    opacity:.6;
    cursor:not-allowed;
}
</style>