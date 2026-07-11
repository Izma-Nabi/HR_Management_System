<script setup lang="ts">
type LoginResponse = {
  success: boolean;
  message: string;
  data: {
    token: string;
    user?: {
      id: number;
      fullName: string;
      email: string;
      role: string;
      status: string;
    };
    administrator?: {
      id: number;
      fullName: string;
      email: string;
      role: string;
      status: string;
    };
  };
};

const config = useRuntimeConfig();

const form = reactive({
  email: "",
  password: ""
});

const loading = ref(false);
const errorMessage = ref("");

onMounted(async () => {
  const token = localStorage.getItem("token");

  if (token) {
    await navigateTo("/dashboard", { replace: true });
  }
});

const loginAdmin = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await $fetch<LoginResponse>(`${config.public.apiBase}/auth/login`, {
      method: "POST",
      body: {
        email: form.email,
        password: form.password
      }
    });

    const user = response.data.user || response.data.administrator;

    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user", JSON.stringify(user));

    await navigateTo("/dashboard");
  } catch (error: any) {
    errorMessage.value = error?.data?.message || "Invalid email or password";
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
          <h1>Administrator Login</h1>
        </div>
      </div>

      <form class="login-form" @submit.prevent="loginAdmin">
        <label class="field">
          <span>Email</span>
          <input
            v-model="form.email"
            type="email"
            autocomplete="email"
            placeholder="superadmin@company.com"
            required
          >
        </label>

        <label class="field">
          <span>Password</span>
          <input
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            placeholder="Enter password"
            required
          >
        </label>

        <button class="primary-button" type="submit" :disabled="loading">
          {{ loading ? "Signing in..." : "Sign in" }}
        </button>

        <p v-if="errorMessage" class="alert error">{{ errorMessage }}</p>
      </form>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(246, 248, 251, 0.94)),
    #f6f8fb;
}

.login-panel {
  width: min(100%, 420px);
  padding: 28px;
  background: #ffffff;
  border: 1px solid #dfe5ef;
  border-radius: 8px;
  box-shadow: 0 18px 45px rgba(34, 45, 64, 0.08);
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
}

.brand-mark {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  color: #ffffff;
  font-weight: 800;
  background: #1f6feb;
  border-radius: 8px;
}

.eyebrow {
  margin: 0 0 2px;
  color: #647086;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: #172033;
  font-size: 24px;
  line-height: 1.2;
}

.login-form {
  display: grid;
  gap: 16px;
}

.field {
  display: grid;
  gap: 7px;
}

.field span {
  color: #354052;
  font-size: 14px;
  font-weight: 700;
}

.field input {
  width: 100%;
  min-height: 42px;
  padding: 10px 12px;
  color: #172033;
  background: #ffffff;
  border: 1px solid #cfd7e6;
  border-radius: 6px;
  outline: none;
}

.field input:focus {
  border-color: #1f6feb;
  box-shadow: 0 0 0 3px rgba(31, 111, 235, 0.12);
}

.primary-button {
  min-height: 44px;
  border: 0;
  border-radius: 6px;
  color: #ffffff;
  font-weight: 800;
  background: #1f6feb;
}

.primary-button:disabled {
  cursor: wait;
  opacity: 0.72;
}

.alert {
  margin: 0;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 700;
}

.error {
  color: #9f1d1d;
  background: #fff0f0;
  border: 1px solid #f4c7c7;
}
</style>
