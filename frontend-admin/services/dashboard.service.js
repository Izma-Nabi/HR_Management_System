const getDashboardSummary = async () => {

  const config = useRuntimeConfig();

  const response = await $fetch(
    `${config.public.apiBase}/dashboard/summary`,
    {
      method: "GET",
      credentials: "include"
    }
  );

  return response.data;
};

const getDepartmentAttendance = async () => {

  const config = useRuntimeConfig();

  const response = await $fetch(
    `${config.public.apiBase}/dashboard/department-attendance`,
    {
      method: "GET",
      credentials: "include"
    }
  );

  return response.data;
};


const getAttendanceTrend = async () => {

  const config = useRuntimeConfig();

  const response = await $fetch(
    `${config.public.apiBase}/dashboard/attendance-trend`,
    {
      method: "GET",
      credentials: "include"
    }
  );

  return response.data;
};

export default {
  getDashboardSummary,
  getAttendanceTrend,
  getDepartmentAttendance
};