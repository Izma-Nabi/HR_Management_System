import authService from "~/services/auth.service";

const rolesUrl = (path = "") => {
  const config = useRuntimeConfig();

  return `${config.public.apiBase}/roles${path}`;
};

const getRoles = async () => {
  const response = await $fetch(
    rolesUrl(),
    {
      method: "GET",
      headers: authService.getAuthHeaders()
    }
  );

  return response.data;
};

const getRole = async (id) => {
  const response = await $fetch(
    rolesUrl(`/${id}`),
    {
      method: "GET",
      headers: authService.getAuthHeaders()
    }
  );

  return response.data;
};

const getRoleDetails = async (id) => {
  const response = await $fetch(
    rolesUrl(`/${id}/details`),
    {
      method: "GET",
      headers: authService.getAuthHeaders()
    }
  );

  return response.data;
};

const getPermissions = async () => {
  const response = await $fetch(
    rolesUrl("/permissions"),
    {
      method: "GET",
      headers: authService.getAuthHeaders()
    }
  );

  return response.data;
};

const createRole = async (data) => {
  const response = await $fetch(
    rolesUrl(),
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
    rolesUrl(`/${id}`),
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
    rolesUrl(`/${id}`),
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
