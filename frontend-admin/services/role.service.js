import authService from "~/services/auth.service";

const config = useRuntimeConfig();

const getRoles = async () => {
  const response = await $fetch(
    `${config.public.apiBase}/roles`,
    {
      method: "GET",
      headers: authService.getAuthHeaders()
    }
  );

  return response.data;
};

const getRole = async (id) => {
  const response = await $fetch(
    `${config.public.apiBase}/roles/${id}`,
    {
      method: "GET",
      headers: authService.getAuthHeaders()
    }
  );

  return response.data;
};

const getRoleDetails = async (id) => {
  const response = await $fetch(
    `${config.public.apiBase}/roles/${id}/details`,
    {
      method: "GET",
      headers: authService.getAuthHeaders()
    }
  );

  return response.data;
};

const getPermissions = async () => {
  const response = await $fetch(
    `${config.public.apiBase}/roles/permissions`,
    {
      method: "GET",
      headers: authService.getAuthHeaders()
    }
  );

  return response.data;
};

const createRole = async (data) => {
  const response = await $fetch(
    `${config.public.apiBase}/roles`,
    {
      method: "POST",
      headers: authService.getAuthHeaders(),
      body: data
    }
  );

  return response.data;
};

const updateRole = async (id, data) => {
  const response = await $fetch(
    `${config.public.apiBase}/roles/${id}`,
    {
      method: "PUT",
      headers: authService.getAuthHeaders(),
      body: data
    }
  );

  return response.data;
};

const deleteRole = async (id) => {
  const response = await $fetch(
    `${config.public.apiBase}/roles/${id}`,
    {
      method: "DELETE",
      headers: authService.getAuthHeaders()
    }
  );

  return response.data;
};

export default {
  getRoles,
  getRole,
  getRoleDetails,
  getPermissions,
  createRole,
  updateRole,
  deleteRole
};