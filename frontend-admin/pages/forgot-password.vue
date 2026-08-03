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

        <div class="field">
          <div class="input-container">
            <input
              v-model="email"
              type="email"
              class="input-field"
              placeholder=" "
              required
            >
            <label class="input-label">Email Address</label>
            <span class="input-highlight"></span>
          </div>
        </div>

        <button
          class="primary-button"
          :disabled="loading"
        >
          <span class="transition"></span>
          <span class="gradient"></span>
          <span class="label">{{ loading ? "Sending..." : "Send Reset Link" }}</span>
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
width:min(100%,480px);
padding:40px;
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
}

.input-container{
position:relative;
width:100%;
}

.input-field{
display:block;
width:100%;
padding:16px 12px 8px;
font-size:15px;
color:#172033;
background:transparent;
border:none;
border-bottom:2px solid #cfd7e6;
border-radius:0;
outline:none;
transition:border-color 0.2s ease;
}

.input-label{
position:absolute;
left:12px;
top:16px;
color:#8792a3;
font-size:15px;
font-weight:600;
pointer-events:none;
transition:all 0.2s ease;
}

.input-highlight{
position:absolute;
bottom:0;
left:0;
height:2px;
width:0;
background:#1f6feb;
transition:width 0.25s ease;
}

.input-field:focus{
border-color:#1f6feb;
}

.input-field:focus + .input-label,
.input-field:not(:placeholder-shown) + .input-label{
top:-2px;
font-size:12px;
color:#1f6feb;
}

.input-field:focus + .input-label + .input-highlight,
.input-field:not(:placeholder-shown) + .input-label + .input-highlight{
width:100%;
}

.primary-button{
position:relative;
width:100%;
min-height:44px;
overflow:hidden;
font-size:16px;
font-weight:700;
color:#fff;
background:#1f6feb;
border:none;
border-radius:8px;
cursor:pointer;
transition:transform 0.15s ease;
}

.primary-button .gradient{
position:absolute;
inset:0;
border-radius:8px;
background-image:linear-gradient(
  rgba(0,0,0,0),
  rgba(0,0,0,0),
  rgba(0,0,0,0.25)
);
}

.primary-button .label{
position:relative;
top:-1px;
}

.primary-button .transition{
position:absolute;
left:50%;
top:50%;
width:0;
height:0;
background-color:rgba(255,255,255,0.25);
border-radius:9999px;
transform:translate(-50%,-50%);
transition-timing-function:cubic-bezier(0,0,0.2,1);
transition-duration:500ms;
}

.primary-button:hover .transition{
width:30em;
height:30em;
}

.primary-button:active{
transform:scale(0.97);
}

.primary-button:disabled{
cursor:wait;
opacity:0.72;
}

.primary-button:disabled .transition{
width:0!important;
height:0!important;
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