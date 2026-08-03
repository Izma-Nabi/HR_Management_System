const getToken = () => {
  if (!process.client) {
    return null;
  }

  return localStorage.getItem("token");
};

const getAuthHeaders = () => {
  const token = getToken();

  return token
    ? {
        Authorization: `Bearer ${token}`
      }
    : {};
};

const login = async ({ email, password }) => {
  const config = useRuntimeConfig();

  return $fetch(`${config.public.apiBase}/login`, {
    method: "POST",
    body: {
      email,
      password
    }
  });
};

const me = async () => {
  const config = useRuntimeConfig();

  return $fetch(`${config.public.apiBase}/me`, {
    method: "GET",
    headers: getAuthHeaders()
  });
};

const logout = async () => {
  const config = useRuntimeConfig();

  return $fetch(`${config.public.apiBase}/logout`, {
    method: "POST",
    headers: getAuthHeaders()
  });
};

const setSession = ({ token, user }) => {
  if (!process.client) {
    return;
  }

  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

const clearSession = () => {
  if (!process.client) {
    return;
  }

  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

const forgotPassword = async (email) => {
  const config = useRuntimeConfig();

  return $fetch(`${config.public.apiBase}/forgot-password`, {
    method: "POST",
    body: {
      email
    }
  });
};

const resetPassword = async ({
  token,
  password,
  confirmPassword
}) => {
  const config = useRuntimeConfig();

  return $fetch(`${config.public.apiBase}/reset-password`, {
    method: "POST",
    body: {
      token,
      password,
      confirmPassword
    }
  });
};

export default {
  getAuthHeaders,
  login,
  me,
  logout,
  forgotPassword,
  resetPassword,
  setSession,
  clearSession
};