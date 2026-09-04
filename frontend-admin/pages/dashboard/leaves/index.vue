<script setup lang="ts">
import LeaveSummaryCards from "~/components/leaves/LeaveSummaryCards.vue";
import LeaveToolbar from "~/components/leaves/LeaveToolbar.vue";
import LeaveRequestList from "~/components/leaves/LeaveRequestList.vue";
import LeaveReviewPanel from "~/components/leaves/LeaveReviewPanel.vue";
import leaveService from "~/services/leave.service";

definePageMeta({
  layout: "dashboard"
});

const route = useRoute();
const router = useRouter();

const {
  authUser,
  role,
  hasPermission,
  hasAnyPermission
} = useAuthUser();

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

const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const processingDecision = ref<
  "APPROVED" | "REJECTED" | null
>(null);

const search = ref("");
const statusFilter = ref<LeaveStatus | "ALL">("PENDING");
const typeFilter = ref<LeaveType | "ALL">("ALL");

const selectedRequestId = ref<number | null>(null);
const decisionNote = ref("");

const leaveRequests = ref<LeaveRequest[]>([]);

/* =========================================================
   ROLE
========================================================= */

const roleKey = computed(() => {
  return String(role.value || "")
    .trim()
    .toUpperCase();
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

/* =========================================================
   DESIGNATION
========================================================= */

const userDesignationName = computed(() => {
  const designation = authUser.value?.designation;

  if (typeof designation === "string") {
    return designation;
  }

  return (
    (designation as any)?.designationName ||
    (authUser.value as any)?.designationName ||
    ""
  );
});

const normalizedDesignation = computed(() => {
  return userDesignationName.value
    .trim()
    .toLowerCase();
});

const isHRDesignation = computed(() => {
  const designation =
    normalizedDesignation.value;

  return (
    designation === "hr" ||
    designation.startsWith("hr ") ||
    designation.includes("human resources")
  );
});

const isTeamLeadDesignation = computed(() => {
  return normalizedDesignation.value.includes(
    "team lead"
  );
});

const isProjectManagerDesignation = computed(() => {
  return normalizedDesignation.value.includes(
    "project manager"
  );
});

const isSpecialDesignation = computed(() => {
  return (
    isHRDesignation.value ||
    isTeamLeadDesignation.value ||
    isProjectManagerDesignation.value
  );
});

/*
 * HR / Team Lead / Project Manager are still
 * EMPLOYEE role users.
 */
const isSpecialEmployee = computed(() => {
  return (
    roleKey.value === "EMPLOYEE" &&
    isSpecialDesignation.value
  );
});

/* =========================================================
   LEAVE PERMISSIONS
========================================================= */

/*
 * ALL employees can apply for leave.
 *
 * This includes:
 * - Normal Employee
 * - HR designation
 * - Team Lead designation
 * - Project Manager designation
 */
const canCreateLeave = computed(() => {
  return roleKey.value === "EMPLOYEE";
});

const canToggleOwnLeaves = computed(() => {
  return (
    isSpecialEmployee.value &&
    canFilter.value
  );
});

/*
 * Employee Leaves / Team Leaves requires
 * VIEW_TEAM_LEAVES or VIEW_ALL_LEAVES.
 */
const canFilter = computed(() => {
  return hasAnyPermission(
    "VIEW_ALL_LEAVES",
    "VIEW_TEAM_LEAVES"
  );
});

const canViewTeamScope = computed(() => {
  return canFilter.value;
});

/* =========================================================
   APPROVAL PERMISSIONS
========================================================= */

const canApprove = computed(() => {
  return hasPermission("APPROVE_LEAVE");
});

const canReject = computed(() => {
  return hasPermission("REJECT_LEAVE");
});

/* =========================================================
   VIEW SCOPE
========================================================= */

/*
 * Supported URLs:
 *
 * /dashboard/leaves?scope=my
 * /dashboard/leaves?scope=employee
 * /dashboard/leaves?scope=team
 *
 * Also:
 *
 * /dashboard/leaves?view=my
 * /dashboard/leaves?view=employee
 * /dashboard/leaves?view=team
 */
const requestedScope = computed(() => {
  const scope =
    route.query.scope ||
    route.query.view ||
    "";

  return String(scope)
    .trim()
    .toLowerCase();
});

const defaultViewScope = computed<
  "own" | "team"
>(() => {
  /*
   * Explicit URL scope has priority.
   */

  if (
    requestedScope.value === "my" ||
    requestedScope.value === "own" ||
    requestedScope.value === "myleaves"
  ) {
    return "own";
  }

  if (
    requestedScope.value === "employee" ||
    requestedScope.value === "employees" ||
    requestedScope.value === "team" ||
    requestedScope.value === "employee-leaves"
  ) {
    return "team";
  }

  /*
   * ALL employees start on My Leaves.
   *
   * This includes:
   * HR
   * Team Lead
   * Project Manager
   * Normal Employee
   */
  if (isEmployee.value) {
    return "own";
  }

  /*
   * Admin / Super Admin start on Employee Leaves.
   */
  return "team";
});

const viewScope = ref<"own" | "team">(
  defaultViewScope.value
);

const isOwnView = computed(() => {
  return viewScope.value === "own";
});

const pageTitle = computed(() => {
  return isOwnView.value
    ? "My Leaves"
    : "Employee Leaves";
});

const pageSubtitle = computed(() => {
  return isOwnView.value
    ? "View and apply for your leaves"
    : "Review employee leave requests";
});

const currentApproverLabel = computed(() => {
  if (isSuperAdmin.value) {
    return "Super Admin";
  }

  if (roleKey.value === "ADMIN") {
    return "Admin";
  }

  return "Approver";
});

/* =========================================================
   DEBUG
========================================================= */

const logUserInfo = () => {
  console.log("[Leaves] User:", {
    role: roleKey.value,
    designation: userDesignationName.value,
    normalizedDesignation:
      normalizedDesignation.value,

    isEmployee: isEmployee.value,

    isHRDesignation:
      isHRDesignation.value,

    isTeamLeadDesignation:
      isTeamLeadDesignation.value,

    isProjectManagerDesignation:
      isProjectManagerDesignation.value,

    isSpecialEmployee:
      isSpecialEmployee.value,

    canCreateLeave:
      canCreateLeave.value,

    canFilter:
      canFilter.value
  });
};

/* =========================================================
   LOAD LEAVES
========================================================= */

const loadLeaves = async () => {
  if (loading.value) {
    return;
  }

  loading.value = true;
  errorMessage.value = "";

  try {
    console.log(
      "[Leaves] Loading:",
      isOwnView.value
        ? "MY LEAVES"
        : "EMPLOYEE LEAVES"
    );

    console.log(
      "[Leaves] API:",
      isOwnView.value
        ? "GET /leaves/my"
        : "GET /leaves"
    );

    const response = isOwnView.value
      ? await leaveService.getMyLeaveRequests()
      : await leaveService.getLeaveRequests();

    console.log(
      "[Leaves] API response:",
      response
    );

    const rawLeaves = Array.isArray(
      response?.data
    )
      ? response.data
      : [];

    leaveRequests.value =
      rawLeaves.map(
        (leave: any) => {
          const user =
            leave.user || {};

          const approvals =
            Array.isArray(
              leave.approvals
            )
              ? leave.approvals
              : [];

          const firstApproval =
            approvals.length > 0
              ? approvals[
                  approvals.length - 1
                ]
              : null;

          const requesterName =
            isOwnView.value
              ? `${authUser.value?.firstName || ""} ${
                  authUser.value?.lastName || ""
                }`.trim() || "You"
              : `${user.firstName || ""} ${
                  user.lastName || ""
                }`.trim() ||
                "Unknown User";

          const requesterCode =
            isOwnView.value
              ? authUser.value
                  ?.userCode ||
                `USER-${leave.userId}`
              : user.userCode ||
                `USER-${leave.userId}`;

          const requesterRole =
            String(
              user.role?.roleName ||
                ""
            ).toUpperCase() ===
            "ADMIN"
              ? "ADMIN"
              : "EMPLOYEE";

          const department =
            user.department
              ?.departmentName ||
            authUser.value?.department
              ?.departmentName ||
            "No Department";

          let approverName:
            | string
            | null = null;

          if (
            firstApproval?.approver
          ) {
            approverName =
              `${firstApproval.approver.firstName || ""} ${
                firstApproval.approver.lastName || ""
              }`.trim() || null;
          } else if (
            leave.reportingTo
          ) {
            approverName =
              `${leave.reportingTo.firstName || ""} ${
                leave.reportingTo.lastName || ""
              }`.trim() || null;
          }

          return {
            id: Number(leave.id),

            requestCode:
              leave.requestCode ||
              `LV-${String(
                leave.id
              ).padStart(4, "0")}`,

            requesterName,

            requesterCode,

            requesterRole,

            department,

            type: leave.type,

            status: leave.status,

            startDate:
              leave.startDate
                ? String(
                    leave.startDate
                  ).split("T")[0]
                : "",

            endDate:
              leave.endDate
                ? String(
                    leave.endDate
                  ).split("T")[0]
                : "",

            days: Number(
              leave.totalDays || 0
            ),

            reason:
              leave.reason || "",

            submittedAt:
              leave.createdAt || "",

            approverName,

            decisionNote:
              firstApproval?.decisionNote ||
              null,

            decidedAt:
              firstApproval?.decidedAt ||
              null
          };
        }
      );

    if (
      leaveRequests.value.length >
      0
    ) {
      const selectedStillExists =
        leaveRequests.value.some(
          (request) =>
            request.id ===
            selectedRequestId.value
        );

      if (
        selectedRequestId.value ===
          null ||
        !selectedStillExists
      ) {
        selectedRequestId.value =
          leaveRequests.value[0].id;
      }
    } else {
      selectedRequestId.value =
        null;
    }
  } catch (error: any) {
    console.error(
      "[Leaves] Failed to load leaves:",
      error
    );

    errorMessage.value =
      error?.data?.message ||
      error?.response?.data?.message ||
      error?.message ||
      "Unable to load leave requests.";

    leaveRequests.value = [];
    selectedRequestId.value = null;
  } finally {
    loading.value = false;
  }
};

/* =========================================================
   SELECTED REQUEST
========================================================= */

const selectedRequest = computed(() => {
  return (
    leaveRequests.value.find(
      (request) =>
        request.id ===
        selectedRequestId.value
    ) || null
  );
});

/* =========================================================
   FILTERS
========================================================= */

const filteredRequests = computed(() => {
  let requests = [
    ...leaveRequests.value
  ];

  if (isOwnView.value) {
    requests = requests.filter(
      (request) =>
        request.requesterCode ===
        userCode.value
    );
  }

  const keyword =
    search.value
      .trim()
      .toLowerCase();

  return requests.filter(
    (request) => {
      const matchesSearch =
        !keyword ||
        String(
          request.requestCode || ""
        )
          .toLowerCase()
          .includes(keyword) ||
        String(
          request.requesterName || ""
        )
          .toLowerCase()
          .includes(keyword) ||
        String(
          request.requesterCode || ""
        )
          .toLowerCase()
          .includes(keyword) ||
        String(
          request.department || ""
        )
          .toLowerCase()
          .includes(keyword);

      const matchesStatus =
        statusFilter.value ===
          "ALL" ||
        request.status ===
          statusFilter.value;

      const matchesType =
        typeFilter.value === "ALL" ||
        request.type ===
          typeFilter.value;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType
      );
    }
  );
});

/* =========================================================
   SUMMARY
========================================================= */

const summary = computed(() => {
  const requests =
    isOwnView.value
      ? leaveRequests.value.filter(
          (request) =>
            request.requesterCode ===
            userCode.value
        )
      : leaveRequests.value;

  return {
    pending: requests.filter(
      (request) =>
        request.status ===
        "PENDING"
    ).length,

    approved: requests.filter(
      (request) =>
        request.status ===
        "APPROVED"
    ).length,

    rejected: requests.filter(
      (request) =>
        request.status ===
        "REJECTED"
    ).length,

    totalDays: requests
      .filter(
        (request) =>
          request.status ===
          "APPROVED"
      )
      .reduce(
        (total, request) =>
          total +
          Number(
            request.days || 0
          ),
        0
      )
  };
});

/* =========================================================
   OPTIONS
========================================================= */

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
  "PENDING" as LeaveType,
  "SICK",
  "CASUAL",
  "UNPAID",
  "OTHER"
];

/*
 * Correct type options.
 */
typeOptions.splice(
  1,
  1,
  "ANNUAL"
);

/* =========================================================
   DATE
========================================================= */

const formatDate = (
  date: string
) => {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "en",
    {
      month: "short",
      day: "2-digit",
      year: "numeric"
    }
  ).format(
    new Date(
      `${date}T00:00:00`
    )
  );
};

/* =========================================================
   CHANGE VIEW
========================================================= */

const setViewScope = async (
  scope: "own" | "team"
) => {
  if (
    scope === "own" &&
    !canCreateLeave.value
  ) {
    return;
  }

  if (
    scope === "team" &&
    !canViewTeamScope.value
  ) {
    return;
  }

  if (
    viewScope.value === scope
  ) {
    return;
  }

  viewScope.value = scope;

  selectedRequestId.value =
    null;

  statusFilter.value =
    "PENDING";

  typeFilter.value = "ALL";

  search.value = "";

  decisionNote.value = "";

  errorMessage.value = "";

  successMessage.value = "";

  await router.replace({
    query: {
      ...route.query,

      scope:
        scope === "own"
          ? "my"
          : "employee"
    }
  });

  await loadLeaves();
};

/* =========================================================
   URL -> VIEW
========================================================= */

watch(
  requestedScope,
  async () => {
    const nextScope =
      defaultViewScope.value;

    if (
      viewScope.value !==
      nextScope
    ) {
      viewScope.value =
        nextScope;

      selectedRequestId.value =
        null;

      statusFilter.value =
        "PENDING";

      typeFilter.value =
        "ALL";

      search.value = "";

      await loadLeaves();
    }
  }
);

/* =========================================================
   APPROVE / REJECT
========================================================= */

const updateDecision = async (
  status:
    | "APPROVED"
    | "REJECTED"
) => {
  if (
    processingDecision.value ||
    !selectedRequest.value
  ) {
    return;
  }

  if (
    selectedRequest.value.status !==
    "PENDING"
  ) {
    return;
  }

  const hasDecisionPermission =
    status === "APPROVED"
      ? canApprove.value
      : canReject.value;

  if (!hasDecisionPermission) {
    errorMessage.value =
      `You do not have permission to ${status.toLowerCase()} leave requests.`;

    return;
  }

  try {
    loading.value = true;

    errorMessage.value = "";

    successMessage.value = "";

    processingDecision.value =
      status;

    const note =
      decisionNote.value.trim();

    if (
      status === "APPROVED"
    ) {
      await leaveService.approveLeave(
        selectedRequest.value.id,
        note
      );
    } else {
      await leaveService.rejectLeave(
        selectedRequest.value.id,
        note
      );
    }

    decisionNote.value = "";

    await loadLeaves();

    successMessage.value =
      `Leave request ${status.toLowerCase()} successfully.`;
  } catch (error: any) {
    console.error(
      `Failed to ${status.toLowerCase()} leave:`,
      error
    );

    errorMessage.value =
      error?.data?.message ||
      error?.response?.data?.message ||
      error?.message ||
      `Unable to ${
        status === "APPROVED"
          ? "approve"
          : "reject"
      } leave request.`;
  } finally {
    loading.value = false;

    processingDecision.value =
      null;
  }
};

/* =========================================================
   KEEP SELECTED REQUEST VALID
========================================================= */

watch(
  filteredRequests,
  (requests) => {
    if (!requests.length) {
      selectedRequestId.value =
        null;

      return;
    }

    const stillExists =
      requests.some(
        (request) =>
          request.id ===
          selectedRequestId.value
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

/* =========================================================
   INITIAL LOAD
========================================================= */

onMounted(async () => {
  viewScope.value =
    defaultViewScope.value;

  logUserInfo();

  console.log(
    "[Leaves] Initial scope:",
    viewScope.value
  );

  console.log(
    "[Leaves] Apply Leave visible:",
    canCreateLeave.value
  );

  await loadLeaves();
});
</script>

<template>
  <div class="page-header">
    <div>
      <h1>
        {{ pageTitle }}
      </h1>

      <p>
        {{ pageSubtitle }}
      </p>
    </div>

    <div class="header-actions">

      <!--
        HR / Team Lead / Project Manager
        can switch between My Leaves
        and Employee Leaves when they
        have team-leave permission.
      -->
      <div
        v-if="
          canToggleOwnLeaves &&
          canViewTeamScope
        "
        class="scope-toggle"
        role="tablist"
        aria-label="Leave view"
      >

        <button
          type="button"
          role="tab"
          class="scope-btn"
          :class="{
            active:
              viewScope === 'team'
          }"
          :aria-selected="
            viewScope === 'team'
          "
          :disabled="loading"
          @click="
            setViewScope('team')
          "
        >
          Employee Leaves
        </button>
      </div>

      <!--
        Employee who only has My Leaves
      -->
      <div
        v-else-if="
          canCreateLeave &&
          !canViewTeamScope
        "
        class="scope-toggle"
        role="tablist"
        aria-label="Leave view"
      >
        <button
          type="button"
          role="tab"
          class="scope-btn active"
          aria-selected="true"
          disabled
        >
          My Leaves
        </button>
      </div>

      <!--
        IMPORTANT:
        Every EMPLOYEE can apply for leave.

        HR, Team Lead and Project Manager
        are EMPLOYEE role users, so they
        also see this button.
      -->
      <NuxtLink
        to="/dashboard/leaves/apply"
        class="apply-btn"
      >
        + Apply Leave
      </NuxtLink>
    </div>
  </div>

  <LeaveSummaryCards
    :summary="summary"
  />

  <p
    v-if="errorMessage"
    class="feedback feedback-error"
    role="alert"
  >
    {{ errorMessage }}
  </p>

  <p
    v-if="successMessage"
    class="feedback feedback-success"
    role="status"
  >
    {{ successMessage }}
  </p>

  <LeaveToolbar
    :search="search"
    :status-filter="statusFilter"
    :type-filter="typeFilter"
    :status-options="statusOptions"
    :type-options="typeOptions"
    :show-filters="canFilter"
    @update:search="
      search = $event
    "
    @update:status-filter="
      statusFilter = $event
    "
    @update:type-filter="
      typeFilter = $event
    "
  />

  <div class="work-area">
    <LeaveRequestList
      :filtered-requests="
        filteredRequests
      "
      :selected-request-id="
        selectedRequestId
      "
      :format-date="formatDate"
      @select="
        selectedRequestId = $event
      "
    />

    <LeaveReviewPanel
      :selected-request="
        selectedRequest
      "
      :decision-note="
        decisionNote
      "
      :format-date="formatDate"
      :can-approve="canApprove"
      :can-reject="canReject"
      :processing-decision="
        processingDecision
      "
      @update:decision-note="
        decisionNote = $event
      "
      @update-decision="
        updateDecision
      "
    />
  </div>
</template>

<style scoped>
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.scope-toggle {
  display: inline-flex;
  padding: 4px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.scope-btn {
  padding: 8px 14px;
  color: #6b7280;
  background: transparent;
  border: none;
  border-radius: 7px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.scope-btn:hover {
  color: #1f2937;
}

.scope-btn.active {
  color: #fff;
  background: #2563eb;
}

.scope-btn:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.work-area {
  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    390px;
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

.apply-btn {
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  background: #2563eb;
  color: white;
  font-weight: 700;
  cursor: pointer;
  text-align: center;
  text-decoration: none;
}

.apply-btn:hover {
  background: #1d4ed8;
}

@media (max-width: 1050px) {
  .work-area {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .scope-toggle {
    justify-content: center;
  }
}
</style>
