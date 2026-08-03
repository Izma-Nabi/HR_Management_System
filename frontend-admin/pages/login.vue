<script setup lang="ts">
import authService from "~/services/auth.service";
const showPassword = ref(false);

type LoginResponse = {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: AuthUser;
  };
};

type MeResponse = {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
  };
};

type AuthUser = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  status: string;
  permissions?: string[];
};

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

const loginUser = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const loginResponse = await authService.login({
      email: form.email,
      password: form.password
    });

    const token = (loginResponse as LoginResponse).data.token;

    localStorage.setItem("token", token);

    const meResponse = await authService.me() as MeResponse;

    authService.setSession({
      token,
      user: meResponse.data.user
    });

    const authUser = useState<AuthUser | null>("auth.user", () => null);
    authUser.value = meResponse.data.user;

    await navigateTo("/dashboard");
  } catch (error: any) {
    authService.clearSession();
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
          <h1>Sign in</h1>
        </div>
      </div>

      <form class="login-form" @submit.prevent="loginUser">
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

          <div class="password-wrapper">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="Enter password"
              required
            >

            <button
              type="button"
              class="eye-button"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              :aria-pressed="showPassword"
              @click="showPassword = !showPassword"
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

      <div class="forgot-password">
        <NuxtLink to="/forgot-password">
          Forgot Password?
        </NuxtLink>
      </div>

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

.password-wrapper {
  position: relative;
}

.password-wrapper input {
  padding-right: 48px;
}

.eye-button {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  padding: 6px;
  color: #6b7280;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.eye-button:hover {
  color: #374151;
  background-color: rgba(0, 0, 0, 0.05);
}

.eye-button:focus-visible {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
}

.forgot-password {
  display: flex;
  justify-content: flex-end;
}

.forgot-password a {
  color: #1f6feb;
  font-size: 14px;
  text-decoration: none;
  font-weight: 600;
}

.forgot-password a:hover {
  text-decoration: underline;
}

</style>