<template>
  <div class="page">
    <div class="header">
      <div>
        <h1>Add User</h1>
        <p>Select the type of user you want to create.</p>
      </div>
    </div>

    <div class="cards">
      <NuxtLink
        to="/dashboard/users/add-admin"
        class="card"
      >
        <div class="icon">👨‍💼</div>

        <h2>Administrator</h2>

        <p>
          Create an administrator account with dashboard access.
        </p>

        <button>Create Admin</button>
      </NuxtLink>

      <NuxtLink
        to="/dashboard/users/add-employee"
        class="card"
      >
        <div class="icon">👤</div>

        <h2>Employee</h2>

        <p>
          Create an employee account for attendance management.
        </p>

        <button>Create Employee</button>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: "dashboard"
})
</script>

<style scoped>

.page{
  padding:10px;
}

.header{
  margin-bottom:35px;
}

.header h1{
  font-size:30px;
  color:#1F2937;
  margin-bottom:6px;
}

.header p{
  color:#6B7280;
}

.cards{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(320px,1fr));
  gap:25px;
}

.card{
  background:#fff;
  border:1px solid #E5E7EB;
  border-radius:14px;
  padding:35px;
  text-decoration:none;
  color:inherit;
  transition:.25s;
}

.card:hover{
  border-color:#756DB0;
  transform:translateY(-4px);
  box-shadow:0 10px 25px rgba(0,0,0,.08);
}

.icon{
  font-size:45px;
  margin-bottom:20px;
}

.card h2{
  margin-bottom:12px;
  color:#111827;
}

.card p{
  color:#6B7280;
  line-height:1.6;
  margin-bottom:25px;
}

button{
  background:#756DB0;
  color:#fff;
  border:none;
  padding:12px 24px;
  border-radius:8px;
  cursor:pointer;
  font-size:15px;
}

button:hover{
  background:#655DA2;
}

</style>