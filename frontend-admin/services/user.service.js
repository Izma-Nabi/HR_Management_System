import authService from "~/services/auth.service";

const usersUrl = (path = "") => {
  const config = useRuntimeConfig();

  return `${config.public.apiBase}/users${path}`;
};

const getUsers = async () => {
  const response = await $fetch(
    usersUrl(),
    {
      method: "GET",
      headers: authService.getAuthHeaders()
    }
  );

  return response.data;
};

const getUser = async (id) => {
  const response = await $fetch(
    usersUrl(`/${id}`),
    {
      method: "GET",
      headers: authService.getAuthHeaders()
    }
  );

  return response.data;
};

const createUser = async (data) => {
  const response = await $fetch(
    usersUrl(),
    {
      method: "POST",
      headers: authService.getAuthHeaders(),
      body: data
    }
  );

  return response.data;
};

const updateUser = async (id, data) => {
  const response = await $fetch(
    usersUrl(`/${id}`),
    {
      method: "PUT",
      headers: authService.getAuthHeaders(),
      body: data
    }
  );

  return response.data;
};

const deleteUser = async (id) => {
  const response = await $fetch(
    usersUrl(`/admin/${id}`),
    {
      method: "DELETE",
      headers: authService.getAuthHeaders()
    }
  );

  return response.data;
};

export default {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
};