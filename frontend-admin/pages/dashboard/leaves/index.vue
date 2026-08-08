<script setup lang="ts">
import LeaveSummaryCards from "~/components/leaves/LeaveSummaryCards.vue";
import LeaveToolbar from "~/components/leaves/LeaveToolbar.vue";
import LeaveRequestList from "~/components/leaves/LeaveRequestList.vue";
import LeaveReviewPanel from "~/components/leaves/LeaveReviewPanel.vue";
import ApplyLeaveModal from "~/components/leaves/ApplyLeaveModal.vue";
import leaveService from "~/services/leave.service";

definePageMeta({
  layout: "dashboard"
});

const {
  authUser,
  role,
  hasPermission,
  hasAnyPermission
} = useAuthUser();

const showApplyModal = ref(false);

const loading = ref(false);
const errorMessage = ref("");

const search = ref("");
const statusFilter = ref<LeaveStatus | "ALL">("PENDING");
const typeFilter = ref<LeaveType | "ALL">("ALL");

const selectedRequestId = ref<number | null>(null);
const decisionNote = ref("");

const leaveRequests = ref<LeaveRequest[]>([]);

type LeaveStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

type LeaveType =
  | "ANNUAL"
  | "SICK"
  | "CASUAL"
  | "UNPAID"
  | "OTHER";

type LeaveRequest = {
  id: number;
  requestCode: string;
  requesterName: string;
  requesterCode: string;
  requesterRole: "ADMIN" | "EMPLOYEE";
  department: string;
  type: LeaveType;
  status: LeaveStatus;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  submittedAt: string;
  approverName: string | null;
  decisionNote: string | null;
  decidedAt: string | null;
};

const roleKey = computed(() => {
  return String(role.value || "").toUpperCase();
});

const userCode = computed(() => {
  return authUser.value?.userCode || "";
});

const isSuperAdmin = computed(() => {
  return roleKey.value === "SUPER_ADMIN";
});

const isEmployee = computed(() => {
  return roleKey.value === "EMPLOYEE";
});

const canApprove = computed(() => {
  return hasAnyPermission(
    "APPROVE_LEAVE",
    "REJECT_LEAVE"
  );
});

const canCreateLeave = computed(() => {
  return hasPermission("CREATE_LEAVE");
});

const canFilter = computed(() => {
  return hasAnyPermission(
    "VIEW_ALL_LEAVES",
    "VIEW_TEAM_LEAVES"
  );
});

const currentApproverLabel = computed(() => {
  if (roleKey.value === "SUPER_ADMIN") {
    return "Super Admin";
  }

  if (roleKey.value === "ADMIN") {
    return "Admin";
  }

  return "Approver";
});

const loadLeaves = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await leaveService.getLeaveRequests();

    const rawLeaves = response?.data || [];

    leaveRequests.value = rawLeaves.map((leave: any) => {
      const user = leave.user || {};

      const firstApproval =
        leave.approvals?.length > 0
          ? leave.approvals[leave.approvals.length - 1]
          : null;

      const requesterName =
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        "Unknown User";

      return {
        id: leave.id,

        requestCode:
          leave.requestCode ||
          `LV-${String(leave.id).padStart(4, "0")}`,

        requesterName,

        requesterCode:
          user.userCode ||
          `USER-${leave.userId}`,

        requesterRole:
          user.role?.roleName?.toUpperCase() === "ADMIN"
            ? "ADMIN"
            : "EMPLOYEE",

        department:
          user.department?.departmentName ||
          "No Department",

        type: leave.type,

        status: leave.status,

        startDate: leave.startDate
          ? String(leave.startDate).split("T")[0]
          : "",

        endDate: leave.endDate
          ? String(leave.endDate).split("T")[0]
          : "",

        days: Number(leave.totalDays || 0),

        reason: leave.reason || "",

        submittedAt: leave.createdAt || "",

        approverName: firstApproval?.approver
          ? `${firstApproval.approver.firstName || ""} ${
              firstApproval.approver.lastName || ""
            }`.trim()
          : null,

        decisionNote:
          firstApproval?.decisionNote || null,

        decidedAt:
          firstApproval?.decidedAt || null,
      };
    });

    console.log("LOADED LEAVES:", leaveRequests.value);

    if (
      selectedRequestId.value === null &&
      leaveRequests.value.length > 0
    ) {
      selectedRequestId.value = leaveRequests.value[0].id;
    }

  } catch (error: any) {
    console.error("Failed to load leaves:", error);

    errorMessage.value =
      error?.data?.message ||
      error?.response?.data?.message ||
      "Unable to load leave requests.";

    leaveRequests.value = [];
  } finally {
    loading.value = false;
  }
};

const handleLeaveSubmitted = async () => {
  showApplyModal.value = false;

  await loadLeaves();
};

const selectedRequest = computed(() => {
  return (
    leaveRequests.value.find(
      (request) =>
        request.id === selectedRequestId.value
    ) || null
  );
});

const filteredRequests = computed(() => {
  let requests = [...leaveRequests.value];

  if (isEmployee.value) {
    requests = requests.filter(
      (request) => request.requesterCode === userCode.value
    );
  }

  const keyword = search.value.trim().toLowerCase();

  return requests.filter((request) => {
    const matchesSearch =
      !keyword ||
      String(request.requestCode || "")
        .toLowerCase()
        .includes(keyword) ||
      String(request.requesterName || "")
        .toLowerCase()
        .includes(keyword) ||
      String(request.requesterCode || "")
        .toLowerCase()
        .includes(keyword) ||
      String(request.department || "")
        .toLowerCase()
        .includes(keyword);

    const matchesStatus =
      statusFilter.value === "ALL" ||
      request.status === statusFilter.value;

    const matchesType =
      typeFilter.value === "ALL" ||
      request.type === typeFilter.value;

    return matchesSearch && matchesStatus && matchesType;
  });
});

const summary = computed(() => {
  const requests = isEmployee.value
    ? leaveRequests.value.filter(
        (request) =>
          request.requesterCode === userCode.value
      )
    : leaveRequests.value;

  return {
    pending: requests.filter(
      (request) =>
        request.status === "PENDING"
    ).length,

    approved: requests.filter(
      (request) =>
        request.status === "APPROVED"
    ).length,

    rejected: requests.filter(
      (request) =>
        request.status === "REJECTED"
    ).length,

    totalDays: requests
      .filter(
        (request) =>
          request.status === "APPROVED"
      )
      .reduce(
        (total, request) =>
          total + Number(request.days || 0),
        0
      )
  };
});

const statusOptions: Array<
  LeaveStatus | "ALL"
> = [
  "ALL",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED"
];

const typeOptions: Array<
  LeaveType | "ALL"
> = [
  "ALL",
  "ANNUAL",
  "SICK",
  "CASUAL",
  "UNPAID",
  "OTHER"
];

const formatDate = (date: string) => {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(
    new Date(`${date}T00:00:00`)
  );
};

const applyLeave = async (leave: {
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
}) => {
  try {
    loading.value = true;
    errorMessage.value = "";
    await leaveService.createLeave({
      type: leave.type,
      startDate: leave.startDate,
      endDate: leave.endDate,
      reason: leave.reason
    });

    showApplyModal.value = false;

    await loadLeaves();
  } catch (error: any) {
    console.error(
      "Failed to submit leave:",
      error
    );

    errorMessage.value =
      error?.data?.message ||
      error?.response?.data?.message ||
      error?.message ||
      "Unable to submit leave request.";
  } finally {
    loading.value = false;
  }
};

const updateDecision = async (status: "APPROVED" | "REJECTED") => {
  if (!selectedRequest.value) {
    return;
  }

  if (selectedRequest.value.status !== "PENDING") {
    return;
  }

  const requestId = selectedRequest.value.id;

  try {
    loading.value = true;
    errorMessage.value = "";

    const note = decisionNote.value.trim();

    if (status === "APPROVED") {
      await leaveService.approveLeave(requestId, note);
    } else {
      await leaveService.rejectLeave(requestId, note);
    }

    decisionNote.value = "";

    await loadLeaves();

    selectedRequestId.value = requestId;

  } catch (error: any) {
    console.error(`Failed to ${status.toLowerCase()} leave:`, error);

    errorMessage.value =
      error?.data?.message ||
      error?.response?.data?.message ||
      `Unable to ${status === "APPROVED" ? "approve" : "reject"} leave request.`;
  } finally {
    loading.value = false;
  }
};

watch(
  filteredRequests,
  (requests) => {
    if (!requests.length) {
      selectedRequestId.value = null;
      return;
    }

    const stillExists = requests.some(
      (request) =>
        request.id === selectedRequestId.value
    );

    if (!stillExists) {
      selectedRequestId.value =
        requests[0].id;
    }
  },
  {
    immediate: true
  }
);

onMounted(() => {
  loadLeaves();
});
</script>

<template>
  <div class="page-header">
    <div>
      <h1>
        {{ isEmployee ? "My Leaves" : "Leave Requests" }}
      </h1>

      <p>
        {{
          isEmployee
            ? "View and apply for your leaves"
            : "Review employee leave requests"
        }}
      </p>
    </div>

    <NuxtLink
      v-if="canCreateLeave"
      to="/dashboard/leaves/apply"
      class="apply-btn"
    >
      + Apply Leave
    </NuxtLink>
  </div>

  <LeaveSummaryCards
    :summary="summary"
  />

  <LeaveToolbar
    :search="search"
    :status-filter="statusFilter"
    :type-filter="typeFilter"
    :status-options="statusOptions"
    :type-options="typeOptions"
    :show-filters="canFilter"
    @update:search="search = $event"
    @update:status-filter="statusFilter = $event"
    @update:type-filter="typeFilter = $event"
  />

  <div class="work-area">
    <LeaveRequestList
      :filtered-requests="filteredRequests"
      :selected-request-id="selectedRequestId"
      :format-date="formatDate"
      @select="selectedRequestId = $event"
    />

    <LeaveReviewPanel
      :selected-request="selectedRequest"
      :decision-note="decisionNote"
      :format-date="formatDate"
      :can-approve="canApprove"
      @update:decision-note="decisionNote = $event"
      @update-decision="updateDecision"
    />
  </div>

  <ApplyLeaveModal
    v-if="showApplyModal"
    @close="showApplyModal = false"
    @submit="handleLeaveSubmitted"
  />
</template>

<style scoped>
/* Keep ONLY these styles from your old file */

.page {
  max-width: 1240px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.page-header h1 {
  margin: 0 0 6px;
  color: #1f2937;
  font-size: 30px;
}

.page-header p {
  margin: 0;
  color: #6b7280;
}

.work-area {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 390px;
  gap: 18px;
  align-items: start;
}

@media (max-width:1050px){
  .work-area{
    grid-template-columns:1fr;
  }
}

@media (max-width:760px){
  .page-header{
    flex-direction:column;
    align-items:stretch;
  }
}

.apply-btn {
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  background: #2563eb;
  color: white;
  font-weight: 700;
  cursor: pointer;
}

.apply-btn:hover {
  background: #1d4ed8;
}
</style>
