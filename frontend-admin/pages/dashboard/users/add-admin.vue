<template>
  <div class="page">

    <div class="page-header">
      <h1>Add New Admin</h1>
      <p>Create a new admin account.</p>
    </div>

    <form class="form" @submit.prevent="saveAdmin" autocomplete="off">

      <div class="grid">

        <div class="form-group">
          <label>Employee Code</label>
          <input
            v-model="form.employeeCode"
            type="text"
            placeholder="EMP001"
            required
          />
        </div>

        <div class="form-group">
          <label>Full Name</label>
          <input
            v-model="form.fullName"
            type="text"
            placeholder="Enter full name"
            required
          />
        </div>

        <div class="form-group">
          <label>Email</label>
          <input
            v-model="form.email"
            type="email"
            placeholder="Enter email"
            autocomplete="off"
            required
          />
        </div>

        <div class="form-group">
          <label>Password</label>
          <input
            v-model="form.password"
            type="password"
            placeholder="Enter password"
            autocomplete="off"
            required
          />
        </div>

        <div class="form-group">
          <label>First Name</label>
          <input
            v-model="form.firstName"
            type="text"
            placeholder="First name"
            required
          />
        </div>

        <div class="form-group">
          <label>Last Name</label>
          <input
            v-model="form.lastName"
            type="text"
            placeholder="Last name"
            required
          />
        </div>

        <div class="form-group">
          <label>Phone</label>
          <input
            v-model="form.phone"
            type="text"
            placeholder="03xxxxxxxxx"
          />
        </div>

        <div class="form-group">
          <label>Department</label>
          <input
            v-model="form.department"
            type="text"
            placeholder="Department"
            required
          />
        </div>

        <div class="form-group">
          <label>Designation</label>
          <input
            v-model="form.designation"
            type="text"
            placeholder="Designation"
          />
        </div>

        <div class="form-group">
          <label>Joining Date</label>
          <input
            v-model="form.joiningDate"
            type="date"
          />
        </div>

        <div class="form-group full">
          <label>Address</label>
          <textarea
            v-model="form.address"
            rows="4"
            placeholder="Employee address"
          ></textarea>
        </div>

        <div class="form-group full">
          <label>Photo</label>
          <input
            type="file"
            @change="selectPhoto"
          />
        </div>

      </div>

      <div class="buttons">

        <NuxtLink
          to="/dashboard/users/add"
          class="cancel"
        >
          Cancel
        </NuxtLink>

        <button type="submit">
          Create Admin
        </button>

      </div>

    </form>

  </div>
</template>

<script setup>

definePageMeta({
  layout:"dashboard"
})

const form = ref({
  employeeCode:"",
  fullName:"",
  email:"",
  password:"",
  firstName:"",
  lastName:"",
  phone:"",
  department:"",
  designation:"",
  joiningDate:"",
  address:"",
  photo:null
})

const selectPhoto = (event) => {
  form.value.photo = event.target.files[0]
}

const config = useRuntimeConfig()

const saveAdmin = async () => {

  try {

    const response = await $fetch(
      `${config.public.apiBase}/users/admin`,
      {
        method: "POST",
        body: {
          fullName: form.value.fullName,
          email: form.value.email,
          password: form.value.password,
          firstName: form.value.firstName,
          lastName: form.value.lastName,
          phone: form.value.phone,
          office: form.value.office
        }
      }
    )

    alert(response.message)

    await navigateTo("/dashboard/users")

  }

  catch(error){

    console.log(error)

    alert(
      error?.data?.message ||
      "Something went wrong"
    )

  }

}

</script>

<style scoped>

.page{
  max-width:1100px;
}

.page-header{
  margin-bottom:30px;
}

.page-header h1{
  font-size:30px;
  margin-bottom:6px;
}

.page-header p{
  color:#6B7280;
}

.form{
  background:#fff;
  border:1px solid #E5E7EB;
  border-radius:14px;
  padding:35px;
}

.grid{
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:20px;
}

.full{
  grid-column:1/3;
}

.form-group{
  display:flex;
  flex-direction:column;
}

label{
  margin-bottom:8px;
  font-weight:600;
}

input,
textarea{
  padding:12px;
  border:1px solid #D1D5DB;
  border-radius:8px;
  outline:none;
  font-size:15px;
}

input:focus,
textarea:focus{
  border-color:#756DB0;
}

.buttons{
  display:flex;
  justify-content:flex-end;
  gap:15px;
  margin-top:35px;
}

.cancel{
  padding:12px 24px;
  border:1px solid #D1D5DB;
  border-radius:8px;
  text-decoration:none;
  color:#374151;
}

button{
  background:#756DB0;
  color:#fff;
  border:none;
  padding:12px 26px;
  border-radius:8px;
  cursor:pointer;
}

button:hover{
  background:#655DA2;
}

@media(max-width:768px){

.grid{
  grid-template-columns:1fr;
}

.full{
  grid-column:auto;
}

}

</style>