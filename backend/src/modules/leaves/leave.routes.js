const router = require("express").Router();

const auth = require("../../middlewares/auth.middleware");
const {
  requirePermission,
  requireAnyPermission,
} = require("../../middlewares/permission.middleware");

const leaveController = require("./leave.controller");

// Get all leave requests
router.get(
  "/",
  auth,
  requireAnyPermission(
    "LIST_LEAVE_REQUESTS",
    "VIEW_ALL_LEAVES",
    "VIEW_TEAM_LEAVES"
  ),
  leaveController.getLeaveRequests
);

// Get logged-in user's leaves
router.get(
  "/my",
  auth,
  requirePermission("VIEW_OWN_LEAVES"),
  leaveController.myLeaves
);

// Get team leaves
router.get(
  "/team",
  auth,
  requirePermission("VIEW_TEAM_LEAVES"),
  leaveController.teamLeaves
);

// Get managers / team leads for "Reporting To"
router.get(
  "/approvers",
  auth,
  requirePermission("CREATE_LEAVE"),
  leaveController.getLeaveApprovers
);

// Get employees for optional "Backup Employee"
router.get(
  "/backup-employees",
  auth,
  requirePermission("CREATE_LEAVE"),
  leaveController.getBackupEmployees
);

// Create leave request
router.post(
  "/",
  auth,
  requirePermission("CREATE_LEAVE"),
  leaveController.createLeave
);

// Get a single leave request
router.get(
  "/:id",
  auth,
  requireAnyPermission(
    "LIST_LEAVE_REQUESTS",
    "VIEW_ALL_LEAVES",
    "VIEW_TEAM_LEAVES"
  ),
  leaveController.getLeaveRequest
);

// Approve leave
router.patch(
  "/:id/approve",
  auth,
  requireAnyPermission(
    "ACCEPT_LEAVE_REQUEST",
    "APPROVE_LEAVE"
  ),
  leaveController.approveLeave
);

// Reject leave
router.patch(
  "/:id/reject",
  auth,
  requireAnyPermission(
    "REJECT_LEAVE_REQUEST",
    "REJECT_LEAVE"
  ),
  leaveController.rejectLeave
);

// Cancel leave
router.patch(
  "/:id/cancel",
  auth,
  requirePermission("CANCEL_LEAVE"),
  leaveController.cancelLeave
);

module.exports = router;
