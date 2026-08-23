<script setup lang="ts">
import LeaveSummaryCards from "~/components/leaves/LeaveSummaryCards.vue";
import LeaveToolbar from "~/components/leaves/LeaveToolbar.vue";
import LeaveRequestList from "~/components/leaves/LeaveRequestList.vue";
import LeaveReviewPanel from "~/components/leaves/LeaveReviewPanel.vue";
import leaveService from "~/services/leave.service";

definePageMeta({
  layout: "dashboard"
});

const {
  authUser,
  isSuperAdmin,
  isAdmin,
  isLeaveReviewer,
  hasPermission,
  hasAnyPermission
} = useAuthUser();
const route = useRoute();

const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const processingDecision = ref<"APPROVED" | "REJECTED" | null>(null);

const search = ref("");
const statusFilter = ref<LeaveStatus | "ALL">("PENDING");
const typeFilter = ref<LeaveType | "ALL">("ALL");

const selectedRequestId = ref<number | null>(null);
const decisionNote = ref("");

const leaveRequests = ref<LeaveRequest[]>([]);
let loadRequestId = 0;

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
  assignedReviewerName: string | null;
  decisionNote: string | null;
  decidedAt: string | null;
  workflowStage: "HR_REVIEW" | "TEAM_LEAD_REVIEW" | "COMPLETED";
  allowedActions: {
    accept: boolean;
    reject: boolean;
  };
};

const userCode = computed(() => {
  return authUser.value?.userCode || "";
});

const canViewOwnLeaves = computed(() =>
  !isAdmin.value &&
  !isSuperAdmin.value &&
  hasAnyPermission("CREATE_LEAVE", "VIEW_OWN_LEAVES")
);

const canViewEmployeeLeaves = computed(() =>
  isLeaveReviewer.value &&
  hasAnyPermission(
    "LIST_LEAVE_REQUESTS",
    "VIEW_ALL_LEAVES",
    "VIEW_TEAM_LEAVES"
  )
);

const viewMode = computed<"own" | "employees">(() => {
  if (route.query.view === "employees" && canViewEmployeeLeaves.value) {
    return "employees";
  }

  if (route.query.view === "own" && canViewOwnLeaves.value) {
    return "own";
  }

  return canViewOwnLeaves.value ? "own" : "employees";
});

const isOwnView = computed(() => viewMode.value === "own");

const canApprove = computed(() =>
  hasAnyPermission("ACCEPT_LEAVE_REQUEST", "APPROVE_LEAVE")
);

const canReject = computed(() =>
  hasAnyPermission("REJECT_LEAVE_REQUEST", "REJECT_LEAVE")
);

const canCreateLeave = computed(() => {
  return isOwnView.value &&
    !isAdmin.value &&
    !isSuperAdmin.value &&
    hasPermission("CREATE_LEAVE");
});

const canFilter = computed(() => {
  return hasAnyPermission(
    "VIEW_ALL_LEAVES",
    "VIEW_TEAM_LEAVES",
    "LIST_LEAVE_REQUESTS"
  );
});

const loadLeaves = async () => {
  const requestId = ++loadRequestId;
  const ownView = isOwnView.value;

  loading.value = true;
  errorMessage.value = "";

  try {
    const response = ownView
      ? await leaveService.getMyLeaveRequests()
      : await leaveService.getLeaveRequests();

    const rawLeaves = response?.data || [];

    const mappedLeaves = rawLeaves.map((leave: any) => {
      const user = leave.user || {};

      const firstApproval =
        leave.approvals?.length > 0
          ? leave.approvals[leave.approvals.length - 1]
          : null;

      const requesterName = ownView
        ? `${authUser.value?.firstName || ""} ${
            authUser.value?.lastName || ""
          }`.trim() || "You"
        : `${user.firstName || ""} ${
            user.lastName || ""
          }`.trim() || "Unknown User";

      const requesterCode = ownView
        ? authUser.value?.userCode || `USER-${leave.userId}`
        : user.userCode || `USER-${leave.userId}`;

      return {
        id: leave.id,

        requestCode:
          leave.requestCode ||
          `LV-${String(leave.id).padStart(4, "0")}`,

        requesterName,

        requesterCode,

        requesterRole:
          user.role?.roleName?.toUpperCase() === "ADMIN"
            ? "ADMIN"
            : "EMPLOYEE",

        department:
          user.department?.departmentName ||
          authUser.value?.department?.departmentName ||
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
          : leave.reportingTo
            ? `${leave.reportingTo.firstName || ""} ${
                leave.reportingTo.lastName || ""
              }`.trim()
            : null,

        assignedReviewerName: leave.reportingTo
          ? `${leave.reportingTo.firstName || ""} ${
              leave.reportingTo.lastName || ""
            }`.trim() || null
          : null,

        decisionNote:
          firstApproval?.decisionNote || null,

        decidedAt:
          firstApproval?.decidedAt || null,

        workflowStage:
          leave.workflowStage ||
          (leave.status === "PENDING"
            ? Number(leave.currentApprovalLevel) === 2
              ? "TEAM_LEAD_REVIEW"
              : "HR_REVIEW"
            : "COMPLETED"),

        allowedActions: {
          accept: Boolean(leave.allowedActions?.accept),
          reject: Boolean(leave.allowedActions?.reject),
        },
      };
    });

    if (requestId !== loadRequestId) {
      return;
    }

    leaveRequests.value = mappedLeaves;

    if (
      selectedRequestId.value === null &&
      leaveRequests.value.length > 0
    ) {
      selectedRequestId.value = leaveRequests.value[0].id;
    }
  } catch (error: any) {
    if (requestId !== loadRequestId) {
      return;
    }

    console.error("Failed to load leaves:", error);

    errorMessage.value =
      error?.data?.message ||
      error?.response?.data?.message ||
      "Unable to load leave requests.";

    leaveRequests.value = [];
  } finally {
    if (requestId === loadRequestId) {
      loading.value = false;
    }
  }
};

const selectedRequest = computed(() => {
  return (
    leaveRequests.value.find(
      (request) =>
        request.id === selectedRequestId.value
    ) || null
  );
});

const canApproveSelected = computed(() =>
  Boolean(
    canApprove.value &&
    selectedRequest.value?.allowedActions.accept
  )
);

const canRejectSelected = computed(() =>
  Boolean(
    canReject.value &&
    selectedRequest.value?.allowedActions.reject
  )
);

const showDecisionControls = computed(() =>
  !isOwnView.value &&
  selectedRequest.value?.status === "PENDING" &&
  (canApprove.value || canReject.value)
);

const reviewAvailabilityMessage = computed(() => {
  const request = selectedRequest.value;

  if (!request || request.status !== "PENDING") {
    return "";
  }

  if (canApproveSelected.value || canRejectSelected.value) {
    return "This request is ready for your decision.";
  }

  if (request.workflowStage === "HR_REVIEW") {
    return "Approve and Reject will unlock after HR accepts this request.";
  }

  if (request.workflowStage === "TEAM_LEAD_REVIEW") {
    return request.assignedReviewerName
      ? `This request is assigned to ${request.assignedReviewerName}. Only the assigned Team Lead can approve or reject it.`
      : "Only the assigned Team Lead can approve or reject this request.";
  }

  return "This request is not available for review.";
});

const filteredRequests = computed(() => {
  let requests = [...leaveRequests.value];

  if (isOwnView.value) {
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
  const requests = isOwnView.value
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

const updateDecision = async (status: "APPROVED" | "REJECTED") => {
  if (processingDecision.value || !selectedRequest.value) {
    return;
  }

  if (selectedRequest.value.status !== "PENDING") {
    return;
  }

  const hasDecisionPermission =
    status === "APPROVED"
      ? canApproveSelected.value
      : canRejectSelected.value;

  if (!hasDecisionPermission) {
    errorMessage.value = `You do not have permission to ${status.toLowerCase()} leave requests.`;
    return;
  }

  try {
    loading.value = true;
    errorMessage.value = "";
    successMessage.value = "";
    processingDecision.value = status;

    const note = decisionNote.value.trim();

    let response: any;

    if (status === "APPROVED") {
      response = await leaveService.approveLeave(selectedRequest.value.id, note);
    } else {
      response = await leaveService.rejectLeave(selectedRequest.value.id, note);
    }

    decisionNote.value = "";

    await loadLeaves();
    successMessage.value =
      response?.message ||
      `Leave request ${status.toLowerCase()} successfully.`;

  } catch (error: any) {
    console.error(`Failed to ${status.toLowerCase()} leave:`, error);

    errorMessage.value =
      error?.data?.message ||
      error?.response?.data?.message ||
      `Unable to ${status === "APPROVED" ? "approve" : "reject"} leave request.`;
  } finally {
    loading.value = false;
    processingDecision.value = null;
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

watch(
  viewMode,
  () => {
    selectedRequestId.value = null;
    decisionNote.value = "";
    loadLeaves();
  }
);

onMounted(loadLeaves);
</script>

<template>
  <div class="page-header">
    <div>
      <h1>
        {{ isOwnView ? "My Leaves" : "Employee Leaves" }}
      </h1>

      <p>
        {{
          isOwnView
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

  <p v-if="errorMessage" class="feedback feedback-error" role="alert">
    {{ errorMessage }}
  </p>

  <p v-if="successMessage" class="feedback feedback-success" role="status">
    {{ successMessage }}
  </p>

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
      :show-decision-controls="showDecisionControls"
      :show-approve-action="canApprove"
      :show-reject-action="canReject"
      :can-approve="canApproveSelected"
      :can-reject="canRejectSelected"
      :review-availability-message="reviewAvailabilityMessage"
      :processing-decision="processingDecision"
      @update:decision-note="decisionNote = $event"
      @update-decision="updateDecision"
    />
  </div>

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

.feedback {
  margin: 0 0 18px;
  padding: 11px 14px;
  border: 1px solid;
  border-radius: 8px;
  font-weight: 700;
}

.feedback-error {
  color: #991b1b;
  background: #fef2f2;
  border-color: #fecaca;
}

.feedback-success {
  color: #1d4ed8;
  background: #eff6ff;
  border-color: #93c5fd;
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
