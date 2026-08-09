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

const getAllUsersWeek = async (startDate) => {
  const config = useRuntimeConfig();
  const response = await $fetch(
    `${config.public.apiBase}/attendance/all/week`,
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

const getAttendanceComplaints = async () => {
  const config = useRuntimeConfig();

  const response = await $fetch(
    `${config.public.apiBase}/attendance/admin/complaints`,
    {
      method: "GET",
      headers: authService.getAuthHeaders()
    }
  );

  return response.data;
};

const reviewAttendanceComplaint = async (id, payload) => {
  const config = useRuntimeConfig();

  const response = await $fetch(
    `${config.public.apiBase}/attendance/admin/complaints/${id}`,
    {
      method: "PATCH",
      headers: authService.getAuthHeaders(),
      body: payload
    }
  );

  return response.data;
};

const editAttendanceComplaint = async (id, data) => {
  const config = useRuntimeConfig();

  const response = await $fetch(
    `${config.public.apiBase}/attendance/admin/complaints/${id}/edit`,
    {
      method: "PATCH",
      headers: authService.getAuthHeaders(),
      body: data
    }
  );

  return response.data;
};

const insertManualAttendance = async (payload) => {
  const config = useRuntimeConfig();

  const response = await $fetch(
    `${config.public.apiBase}/attendance/admin/manual`,
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
  getAllUsersWeek,
  getMyDayDetails,
  getAttendanceComplaints,
  reviewAttendanceComplaint,
  editAttendanceComplaint,
  insertManualAttendance
};
