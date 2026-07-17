import authService from "~/services/auth.service";

const getDashboard = async () => {

  const config = useRuntimeConfig();

  const response = await $fetch(
    `${config.public.apiBase}/dashboard`,
    {
      method: "GET",
      headers: authService.getAuthHeaders()
    }
  );

  return response.data;
};

export default {
  getDashboard
};
