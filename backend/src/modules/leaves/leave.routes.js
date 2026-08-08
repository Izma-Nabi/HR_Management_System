const router = require("express").Router();

const auth = require("../../middlewares/auth.middleware");
const { requirePermission } = require("../../middlewares/permission.middleware");

const leaveController = require("./leave.controller");


// Get all leave requests
router.get(
  "/",
  auth,
  requirePermission("VIEW_ALL_LEAVES"),
  leaveController.getLeaveRequests
);


// Create leave request
router.post(
  "/",
  auth,
  requirePermission("CREATE_LEAVE"),
  leaveController.createLeave
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


// Approve leave
router.patch(
  "/:id/approve",
  auth,
  requirePermission("APPROVE_LEAVE"),
  leaveController.approveLeave
);


// Reject leave
router.patch(
  "/:id/reject",
  auth,
  requirePermission("REJECT_LEAVE"),
  leaveController.rejectLeave
);


// Cancel leave
router.patch(
  "/:id/cancel",
  auth,
  requirePermission("CANCEL_LEAVE"),
  leaveController.cancelLeave
);

router.get(
  "/",
  auth,
  requirePermission("VIEW_ALL_LEAVES"),
  leaveController.getLeaveRequests
);

router.get(
  "/:id",
  auth,
  requirePermission("VIEW_ALL_LEAVES"),
  leaveController.getLeaveRequest
);

module.exports = router;