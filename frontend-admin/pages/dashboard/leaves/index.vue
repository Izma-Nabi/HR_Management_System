<script setup lang="ts">
import LeaveSummaryCards from "~/components/leaves/LeaveSummaryCards.vue";
import LeaveToolbar from "~/components/leaves/LeaveToolbar.vue";
import LeaveRequestList from "~/components/leaves/LeaveRequestList.vue";
import LeaveReviewPanel from "~/components/leaves/LeaveReviewPanel.vue";
import ApplyLeaveModal from "~/components/leaves/ApplyLeaveModal.vue";

const showApplyModal = ref(false);
const {
  authUser,
  role,
  hasPermission,
  hasAnyPermission
} = useAuthUser();

const roleKey = computed(() => String(role.value || "").toUpperCase());
const userCode = computed(() => authUser.value?.userCode || "");

const isSuperAdmin = computed(() => roleKey.value === "SUPER_ADMIN");
const isEmployee = computed(() => roleKey.value === "EMPLOYEE");

const canApprove = computed(() =>
  hasAnyPermission("APPROVE_LEAVE", "REJECT_LEAVE")
);

const canCreateLeave = computed(() =>
  hasPermission("CREATE_LEAVE")
);

const canFilter = computed(() =>
  hasAnyPermission("VIEW_ALL_LEAVES", "VIEW_TEAM_LEAVES")
);

const currentApproverLabel = computed(() => {
  if (roleKey.value === "SUPER_ADMIN") {
    return "Super Admin";
  }

  if (roleKey.value === "ADMIN") {
    return "Admin";
  }

  return "Approver";
});

type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
type LeaveType = "ANNUAL" | "SICK" | "CASUAL" | "UNPAID" | "OTHER";

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

definePageMeta({
  layout: "dashboard"
});

const search = ref("");
const statusFilter = ref<LeaveStatus | "ALL">("PENDING");
const typeFilter = ref<LeaveType | "ALL">("ALL");
const selectedRequestId = ref<number | null>(1);
const decisionNote = ref("");

const leaveRequests = ref<LeaveRequest[]>([
  {
    id: 1,
    requestCode: "LV-1008",
    requesterName: "Ayesha Khan",
    requesterCode: "ADM004",
    requesterRole: "ADMIN",
    department: "Operations",
    type: "SICK",
    status: "PENDING",
    startDate: "2026-07-16",
    endDate: "2026-07-17",
    days: 2,
    reason: "Medical appointment and recovery.",
    submittedAt: "2026-07-15 09:20",
    approverName: null,
    decisionNote: null,
    decidedAt: null
  },
  {
    id: 2,
    requestCode: "LV-1007",
    requesterName: "Bilal Ahmed",
    requesterCode: "ADM002",
    requesterRole: "ADMIN",
    department: "Human Resources",
    type: "ANNUAL",
    status: "PENDING",
    startDate: "2026-07-21",
    endDate: "2026-07-23",
    days: 3,
    reason: "Family travel.",
    submittedAt: "2026-07-14 17:45",
    approverName: null,
    decisionNote: null,
    decidedAt: null
  },
  {
    id: 3,
    requestCode: "LV-1006",
    requesterName: "Hira Malik",
    requesterCode: "ADM003",
    requesterRole: "ADMIN",
    department: "Finance",
    type: "CASUAL",
    status: "APPROVED",
    startDate: "2026-07-15",
    endDate: "2026-07-15",
    days: 1,
    reason: "Personal work.",
    submittedAt: "2026-07-12 11:10",
    approverName: currentApproverLabel.value,
    decisionNote: "Coverage confirmed with Finance team.",
    decidedAt: "2026-07-13 10:05"
  },
  {
    id: 4,
    requestCode: "LV-1005",
    requesterName: "Usman Raza",
    requesterCode: "ADM001",
    requesterRole: "ADMIN",
    department: "Technology",
    type: "UNPAID",
    status: "REJECTED",
    startDate: "2026-07-18",
    endDate: "2026-07-20",
    days: 3,
    reason: "Out of city commitment.",
    submittedAt: "2026-07-10 15:30",
    approverName: "Super Admin",
    decisionNote: "Release window requires admin coverage.",
    decidedAt: "2026-07-11 09:00"
  }
]);

const statusOptions: Array<LeaveStatus | "ALL"> = ["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"];
const typeOptions: Array<LeaveType | "ALL"> = ["ALL", "ANNUAL", "SICK", "CASUAL", "UNPAID", "OTHER"];

const selectedRequest = computed(() => {
  return leaveRequests.value.find((request) => request.id === selectedRequestId.value) || null;
});

const filteredRequests = computed(() => {
  let requests = leaveRequests.value;

  if (isEmployee.value) {
    requests = requests.filter(
      r => r.requesterCode === userCode.value
    );
  }

  const keyword = search.value.toLowerCase();

  return requests.filter((request) => {
    const matchesSearch =
      !keyword ||
      request.requestCode.toLowerCase().includes(keyword) ||
      request.requesterName.toLowerCase().includes(keyword) ||
      request.department.toLowerCase().includes(keyword);

    if (isEmployee.value) {
      return matchesSearch;
    }

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
  return {
    pending: leaveRequests.value.filter((request) => request.status === "PENDING").length,
    approved: leaveRequests.value.filter((request) => request.status === "APPROVED").length,
    rejected: leaveRequests.value.filter((request) => request.status === "REJECTED").length,
    totalDays: leaveRequests.value
      .filter((request) => request.status === "APPROVED")
      .reduce((total, request) => total + request.days, 0)
  };
});

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(new Date(`${date}T00:00:00`));
};

const applyLeave = (leave: {
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
}) => {
  console.log("Leave Request:", leave);

  // TODO:
  // await leaveService.createLeave(leave)

  showApplyModal.value = false;
};

const updateDecision = (status: "APPROVED" | "REJECTED") => {
  if (!selectedRequest.value || selectedRequest.value.status !== "PENDING") {
    return;
  }

  const now = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date());

  leaveRequests.value = leaveRequests.value.map((request) => {
    if (request.id !== selectedRequest.value?.id) {
      return request;
    }

    return {
      ...request,
      status,
      approverName: currentApproverLabel.value,
      decisionNote: decisionNote.value.trim() || null,
      decidedAt: now
    };
  });

  decisionNote.value = "";
};
</script>

<template>
  <div class="page">

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

      <button
        v-if="canCreateLeave"
        class="apply-btn"
        @click="$router.push('/dashboard/leaves/apply')"
      >
        + Apply Leave
      </button>
    </div>

    <LeaveSummaryCards :summary="summary" />

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

    <ApplyLeaveModal
  v-if="showApplyModal"
  @close="showApplyModal = false"
  @submit="showApplyModal = false"
/>
    </div>
    

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
