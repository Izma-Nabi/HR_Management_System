export default defineNuxtRouteMiddleware(async (to) => {
  if (!process.client || to.path === "/login") {
    return;
  }

  const token = localStorage.getItem("token");

  if (!token) {
    return navigateTo("/login");
  }

  const config = useRuntimeConfig();
  const authUser = useState("auth.user", () => null);

  try {
    const response: any = await $fetch(`${config.public.apiBase}/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    authUser.value = response.data.user;
    localStorage.setItem("user", JSON.stringify(response.data.user));
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    return navigateTo("/login");
  }
});
