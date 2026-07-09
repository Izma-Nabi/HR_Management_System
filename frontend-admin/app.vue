<template>
  <div class="auth-page">
    <div class="auth-box">

      <h1>Administrator Login</h1>

      <form @submit.prevent="login">

        <div class="form-group">
          <label>Email</label>
          <input
            v-model="email"
            type="email"
            placeholder="Enter email"
            required
          />
        </div>


        <div class="form-group">
          <label>Password</label>
          <input
            v-model="password"
            type="password"
            placeholder="Enter password"
            required
          />
        </div>


        <button type="submit" :disabled="loading">
          {{ loading ? "Logging in..." : "Login" }}
        </button>


        <p v-if="errorMessage" class="error">
          {{ errorMessage }}
        </p>


        <p v-if="successMessage" class="success">
          {{ successMessage }}
        </p>

      </form>

    </div>
  </div>
</template>


<script setup lang="ts">

const email = ref("")
const password = ref("")

const loading = ref(false)

const errorMessage = ref("")
const successMessage = ref("")


const config = useRuntimeConfig()



const login = async () => {

  loading.value = true

  errorMessage.value = ""
  successMessage.value = ""


  try {

    const response = await $fetch(
      `${config.public.apiBase}/auth/login`,
      {
        method: "POST",

        body: {
          email: email.value,
          password: password.value
        }
      }
    )


    localStorage.setItem(
      "token",
      response.data.token
    )


    localStorage.setItem(
      "user",
      JSON.stringify(response.data.user)
    )


    successMessage.value = "Login successful"


    // later redirect to dashboard
    // await navigateTo("/dashboard")


  }

  catch(error:any){

    errorMessage.value =
      error?.data?.message ||
      "Invalid email or password"

  }


  finally{

    loading.value = false

  }

}

</script>



<style scoped>

.auth-page {

  min-height:100vh;

  display:flex;

  justify-content:center;

  align-items:center;

  background:#f3f4f6;

}


.auth-box {

  width:420px;

  padding:35px;

  background:white;

  border-radius:12px;

  box-shadow:
  0 10px 25px rgba(0,0,0,0.1);

}


h1 {

  text-align:center;

  margin-bottom:30px;

}


.form-group {

  margin-bottom:16px;

}


label {

  display:block;

  margin-bottom:6px;

  font-weight:600;

}


input {

  width:100%;

  padding:10px;

  border:1px solid #d1d5db;

  border-radius:8px;

}


button {

  width:100%;

  padding:10px;

  border:none;

  border-radius:8px;

  background:#2563eb;

  color:white;

  cursor:pointer;

}


button:disabled {

  opacity:0.7;

  cursor:wait;

}


.error {

  margin-top:12px;

  color:#dc2626;

}


.success {

  margin-top:12px;

  color:#15803d;

}

</style>