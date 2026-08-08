import authService from "~/services/auth.service";

const departmentsUrl = (path = "") => {
  const config = useRuntimeConfig();

  return `${config.public.apiBase}/departments${path}`;
};

const getDepartments = async () => {
  const response = await $fetch(departmentsUrl(), {
    method: "GET",
    headers: authService.getAuthHeaders()
  });

  return response.data;
};

const getDepartment = async (id) => {
  const response = await $fetch(departmentsUrl(`/${id}`), {
    method: "GET",
    headers: authService.getAuthHeaders()
  });

  return response.data;
};

const createDepartment = async (data) => {
  const response = await $fetch(departmentsUrl(), {
    method: "POST",
    headers: authService.getAuthHeaders(),
    body: data
  });

  return response.data;
};

const updateDepartment = async (id, data) => {
  const response = await $fetch(departmentsUrl(`/${id}`), {
    method: "PUT",
    headers: authService.getAuthHeaders(),
    body: data
  });

  return response.data;
};

const deleteDepartment = async (id) => {
  const response = await $fetch(departmentsUrl(`/${id}`), {
    method: "DELETE",
    headers: authService.getAuthHeaders()
  });

  return response.data;
};

const getDepartmentDesignations = async (departmentId) => {
  const config = useRuntimeConfig();

  const response = await $fetch(
    `${config.public.apiBase}/departments/${departmentId}/designations`,
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


export default {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentDesignations,
  getDepartmentUsers
};