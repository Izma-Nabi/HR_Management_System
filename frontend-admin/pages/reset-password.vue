<script setup lang="ts">
import authService from "~/services/auth.service";

const route = useRoute();

const form = reactive({
  password: "",
  confirmPassword: ""
});

const showPassword = ref(false);
const showConfirmPassword = ref(false);

const loading = ref(false);
const successMessage = ref("");
const errorMessage = ref("");

const token = route.query.token as string;

const resetPassword = async () => {
  loading.value = true;

  successMessage.value = "";
  errorMessage.value = "";

  try {

    const response:any = await authService.resetPassword({
      token,
      password: form.password,
      confirmPassword: form.confirmPassword
    });

    successMessage.value = response.message;

    setTimeout(() => {
      navigateTo("/login");
    }, 2000);

  } catch (error:any) {

    errorMessage.value =
      error?.data?.message ||
      "Unable to reset password.";

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
          <h1>Reset Password</h1>
        </div>
      </div>

      <form
        class="login-form"
        @submit.prevent="resetPassword"
      >

        <label class="field">

          <span>New Password</span>

          <div class="password-wrapper">

            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              required
            >

            <button
              type="button"
              class="eye-button"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              :aria-pressed="showPassword"
              @click="showPassword=!showPassword"
            >
              <svg v-if="showPassword" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.6 18.6 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
              <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>

          </div>

        </label>

        <label class="field">

          <span>Confirm Password</span>

          <div class="password-wrapper">

            <input
              v-model="form.confirmPassword"
              :type="showConfirmPassword ? 'text':'password'"
              required
            >

            <button
              type="button"
              class="eye-button"
              :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
              :aria-pressed="showConfirmPassword"
              @click="showConfirmPassword=!showConfirmPassword"
            >
              <svg v-if="showConfirmPassword" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.6 18.6 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
              <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>

          </div>

        </label>

        <button
          class="primary-button"
          :disabled="loading"
        >
          {{ loading ? "Resetting..." : "Reset Password" }}
        </button>

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

.password-wrapper{
position:relative;
}

.password-wrapper input{
width:100%;
height:42px;
padding:0 48px 0 12px;
border:1px solid #ccc;
border-radius:6px;
}

.eye-button{
position:absolute;
right:8px;
top:50%;
transform:translateY(-50%);
display:flex;
align-items:center;
justify-content:center;
border:none;
border-radius:6px;
background:none;
cursor:pointer;
padding:6px;
color:#6b7280;
transition:color 0.15s ease, background-color 0.15s ease;
}

.eye-button:hover{
color:#374151;
background-color:rgba(0,0,0,0.05);
}

.eye-button:focus-visible{
outline:2px solid #4f46e5;
outline-offset:2px;
}

.primary-button{
height:44px;
border:none;
background:#1f6feb;
color:white;
font-weight:700;
border-radius:6px;
cursor:pointer;
}

.alert{
padding:10px;
border-radius:6px;
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