<script setup>
definePageMeta({
  alias: ["/login"]
});

const config = useRuntimeConfig();

const form = reactive({
  email: "",
  password: ""
});

const loading = ref(false);
const message = ref("");
const isError = ref(false);

const login = async () => {
  loading.value = true;
  message.value = "";
  isError.value = false;

  try {
    const response = await $fetch(`${config.public.apiBaseUrl}/employee/auth/login`, {
      method: "POST",
      body: form
    });

    if (process.client && response?.data?.token) {
      localStorage.setItem("employee_token", response.data.token);
    }

    message.value = response.message || "Login successful";
  } catch (error) {
    isError.value = true;
    message.value = error?.data?.message || "Login failed";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <main class="page">
    <section class="auth-box">
      <h1>Employee Login</h1>
      <p>Login with employee email and password.</p>

      <form @submit.prevent="login">
        <div class="field">
          <label for="email">Email</label>
          <input id="email" v-model="form.email" type="email" required>
        </div>

        <div class="field">
          <label for="password">Password</label>
          <input id="password" v-model="form.password" type="password" required>
        </div>

        <button class="button" type="submit" :disabled="loading">
          {{ loading ? "Logging in..." : "Login" }}
        </button>
      </form>

      <div v-if="message" class="message" :class="isError ? 'error' : 'success'">
        {{ message }}
      </div>
    </section>
  </main>
</template>

