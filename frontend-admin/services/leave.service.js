import authService from "~/services/auth.service";

const getLeaveRequests = async () => {
  const config = useRuntimeConfig();

  return await $fetch(`${config.public.apiBase}/leaves`, {
    method: "GET",
    headers: authService.getAuthHeaders(),
  });
};

const getMyLeaveRequests = async () => {
  const config = useRuntimeConfig();

  return await $fetch(`${config.public.apiBase}/leaves/my`, {
    method: "GET",
    headers: authService.getAuthHeaders(),
  });
};

const getLeaveRequest = async (id) => {
  const config = useRuntimeConfig();

  return await $fetch(`${config.public.apiBase}/leaves/${id}`, {
    method: "GET",
    headers: authService.getAuthHeaders(),
  });
};

const createLeaveRequest = async (data) => {
  const config = useRuntimeConfig();

  return await $fetch(`${config.public.apiBase}/leaves`, {
    method: "POST",
    headers: {
      ...authService.getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: data,
  });
};

const approveLeave = async (id, decisionNote = "") => {
  const config = useRuntimeConfig();

  return await $fetch(
    `${config.public.apiBase}/leaves/${id}/approve`,
    {
      method: "PATCH",
      headers: {
        ...authService.getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: {
        decisionNote,
      },
    }
  );
};

const rejectLeave = async (id, decisionNote = "") => {
  const config = useRuntimeConfig();

  return await $fetch(
    `${config.public.apiBase}/leaves/${id}/reject`,
    {
      method: "PATCH",
      headers: {
        ...authService.getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: {
        decisionNote,
      },
    }
  );
};


const cancelLeave = async (id) => {
  const config = useRuntimeConfig();

  return await $fetch(
    `${config.public.apiBase}/leaves/${id}/cancel`,
    {
      method: "PATCH",
      headers: authService.getAuthHeaders(),
    }
  );
};

const getLeaveApprovers = async () => {
  const config = useRuntimeConfig();

  return await $fetch(
    `${config.public.apiBase}/leaves/approvers`,
    {
      method: "GET",
      headers: authService.getAuthHeaders(),
    }
  );
};


const getBackupEmployees = async () => {
  const config = useRuntimeConfig();

  return await $fetch(
    `${config.public.apiBase}/leaves/backup-employees`,
    {
      method: "GET",
      headers: authService.getAuthHeaders(),
    }
  );
};


export default {
  getLeaveRequests,
  getMyLeaveRequests,
  getLeaveRequest,
  createLeaveRequest,
  approveLeave,
  rejectLeave,
  cancelLeave,
  getLeaveApprovers,
  getBackupEmployees,
};
