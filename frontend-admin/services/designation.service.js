import authService from "~/services/auth.service";

const designationUrl = (path = "") => {
  const config = useRuntimeConfig();

  return `${config.public.apiBase}/designations${path}`;
};

const getDesignations = async () => {
  const response = await $fetch(designationUrl(), {
    method: "GET",
    headers: authService.getAuthHeaders()
  });

  return response.data;
};

const createDesignation = async (data) => {
  const response = await $fetch(designationUrl(), {
    method: "POST",
    headers: authService.getAuthHeaders(),
    body: data
  });

  return response.data;
};

const updateDesignation = async (id, data) => {
  const response = await $fetch(designationUrl(`/${id}`), {
    method: "PUT",
    headers: authService.getAuthHeaders(),
    body: data
  });

  return response.data;
};

const deleteDesignation = async (id) => {
  const response = await $fetch(designationUrl(`/${id}`), {
    method: "DELETE",
    headers: authService.getAuthHeaders()
  });

  return response.data;
};

export default {
  getDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation
};
