<template>
  <div class="login-page">
    <div class="login-card">
      <h1>Administrator Login</h1>

      <form @submit.prevent="loginAdmin">

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

        <button
          type="submit"
          :disabled="loading">
          {{ loading ? "Logging In..." : "Login" }}
        </button>

        <p
          v-if="errorMessage"
          class="error">
          {{ errorMessage }}
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

const config = useRuntimeConfig()

const loginAdmin = async () => {

  loading.value = true
  errorMessage.value = ""

  try {

    const response: any = await $fetch(
      `${config.public.apiBase}/auth/login`,
      {
        method: "POST",
        body: {
          email: email.value,
          password: password.value
        }
      }
    )

    console.log(response)

    localStorage.setItem(
      "token",
      response.data.token
    )

    localStorage.setItem(
      "user",
      JSON.stringify(response.data.administrator)
    )

    // Uncomment when dashboard is ready
     await navigateTo("/dashboard")

  } catch (error: any) {

    console.log(error)
    errorMessage.value =
      error?.data?.message ||
      "Invalid email or password"

  } finally {
    loading.value = false
  }
}

</script>

<style scoped>

.login-page{
    display:flex;
    justify-content:center;
    align-items:center;
    height:100vh;
    background:#f5f5f5;
}

.login-card{
    width:350px;
    background:white;
    padding:30px;
    border-radius:10px;
    box-shadow:0 0 10px rgba(0,0,0,.1);
}

h1{
    text-align:center;
    margin-bottom:20px;
}

.form-group{
    margin-bottom:15px;
}

label{
    display:block;
    margin-bottom:5px;
    font-weight:bold;
}

input{
    width:100%;
    padding:10px;
    border:1px solid #ccc;
    border-radius:5px;
}

button{
    width:100%;
    padding:10px;
    border:none;
    background:#756DB0;
    color:white;
    border-radius:5px;
    cursor:pointer;
}

button:disabled{
    opacity:.6;
}

.error{
    margin-top:15px;
    color:red;
    text-align:center;
}

</style>