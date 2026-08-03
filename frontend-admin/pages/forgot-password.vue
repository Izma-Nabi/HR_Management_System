<script setup lang="ts">
import authService from "~/services/auth.service";

const email = ref("");
const loading = ref(false);
const successMessage = ref("");
const errorMessage = ref("");

const sendResetLink = async () => {
  console.log("Button clicked");

  loading.value = true;
  successMessage.value = "";
  errorMessage.value = "";

  try {
    const response: any =
      await authService.forgotPassword(email.value);

    console.log(response);

    successMessage.value =
      response?.message ||
      "If an account exists, a password reset email has been sent.";

  } catch (error: any) {
    console.log(error);

    errorMessage.value =
      error?.data?.message ||
      "Unable to send reset email.";

  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <main class="login-page">
    <section class="login-panel">

      <div class="brand-block">
        <span class="brand-mark">B</span>

        <div>
          <p class="eyebrow">Bookme HR</p>
          <h1>Forgot Password</h1>
        </div>
      </div>

      <form class="login-form" @submit.prevent="sendResetLink">

        <label class="field">
          <span>Email Address</span>

          <input
            v-model="email"
            type="email"
            placeholder="Enter your email"
            required
          >
        </label>

        <button
          class="primary-button"
          :disabled="loading"
        >
          {{ loading ? "Sending..." : "Send Reset Link" }}
        </button>

        <NuxtLink
          to="/login"
          class="back-link"
        >
          Back to Login
        </NuxtLink>

        <p
          v-if="successMessage"
          class="alert success"
        >
          {{ successMessage }}
        </p>

        <p
          v-if="errorMessage"
          class="alert error"
        >
          {{ errorMessage }}
        </p>

      </form>

    </section>
  </main>
</template>

<style scoped>
.login-page{
min-height:100vh;
display:grid;
place-items:center;
padding:32px;
background:#f6f8fb;
}

.login-panel{
width:min(100%,420px);
padding:28px;
background:#fff;
border-radius:8px;
box-shadow:0 18px 45px rgba(0,0,0,.08);
}

.brand-block{
display:flex;
gap:14px;
align-items:center;
margin-bottom:28px;
}

.brand-mark{
width:44px;
height:44px;
display:grid;
place-items:center;
background:#1f6feb;
color:#fff;
font-weight:800;
border-radius:8px;
}

.login-form{
display:grid;
gap:16px;
}

.field{
display:grid;
gap:8px;
}

.field input{
height:42px;
padding:0 12px;
border:1px solid #ccc;
border-radius:6px;
}

.primary-button{
height:44px;
border:none;
background:#1f6feb;
color:#fff;
border-radius:6px;
font-weight:700;
cursor:pointer;
}

.back-link{
text-align:center;
text-decoration:none;
color:#1f6feb;
font-weight:600;
}

.alert{
padding:10px;
border-radius:6px;
font-size:14px;
}

.success{
background:#e9fff0;
color:#087443;
}

.error{
background:#fff1f1;
color:#b42318;
}
</style>