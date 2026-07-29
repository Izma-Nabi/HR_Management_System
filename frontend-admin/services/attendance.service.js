import authService from "~/services/auth.service";

const getMyCurrentWeek = async (startDate) => {
  const config = useRuntimeConfig();
  const response = await $fetch(
    `${config.public.apiBase}/attendance/my/week`,
    {
      method: "GET",
      headers: authService.getAuthHeaders(),
      query: {
        startDate
      }
    }
  );

  return response.data;
};

const getMyDayDetails = async (attendanceDate) => {
  const config = useRuntimeConfig();
  const response = await $fetch(
    `${config.public.apiBase}/attendance/my/day/${encodeURIComponent(attendanceDate)}`,
    {
      method: "GET",
      headers: authService.getAuthHeaders()
    }
  );

  return response.data;
};

const createComplaint = async (payload) => {
  const config = useRuntimeConfig();
  const response = await $fetch(
    `${config.public.apiBase}/attendance/complaints`,
    {
      method: "POST",
      headers: authService.getAuthHeaders(),
      body: payload
    }
  );

  return response.data;
};

export default {
  createComplaint,
  getMyCurrentWeek,
  getMyDayDetails
};
