import authService from "~/services/auth.service";

const getDepartments = async () => {
  const config = useRuntimeConfig();

  const response = await $fetch(
    `${config.public.apiBase}/departments`,
    {
      method: "GET",
      headers: authService.getAuthHeaders()
    }
  );

  return response.data;
};


const getDepartmentUsers = async (departmentId) => {
  const config = useRuntimeConfig();

  const response = await $fetch(
    `${config.public.apiBase}/departments/${departmentId}/users`,
    {
      method: "GET",
      headers: authService.getAuthHeaders()
    }
  );

  return response.data;
};


const getDepartment = async (id) => {
  const config = useRuntimeConfig();

  const response = await $fetch(
    `${config.public.apiBase}/departments/${id}`,
    {
      method: "GET",
      headers: authService.getAuthHeaders()
    }
  );

  return response.data;
};


const createDepartment = async (data) => {
  const config = useRuntimeConfig();

  const response = await $fetch(
    `${config.public.apiBase}/departments`,
    {
      method: "POST",
      headers: authService.getAuthHeaders(),
      body: data
    }
  );

  return response.data;
};


const updateDepartment = async (id, data) => {
  const config = useRuntimeConfig();

  const response = await $fetch(
    `${config.public.apiBase}/departments/${id}`,
    {
      method: "PUT",
      headers: authService.getAuthHeaders(),
      body: data
    }
  );

  return response.data;
};


const deleteDepartment = async (id) => {
  const config = useRuntimeConfig();

  const response = await $fetch(
    `${config.public.apiBase}/departments/${id}`,
    {
      method: "DELETE",
      headers: authService.getAuthHeaders()
    }
  );

  return response.data;
};



export default {
  getDepartments,
  getDepartment,
  getDepartmentUsers,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};