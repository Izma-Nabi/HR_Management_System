const router = require("express").Router();

const auth = require("../../middlewares/auth.middleware");
const {
  requirePermission,
  requireAnyRole,
} = require("../../middlewares/permission.middleware");

const leaveController = require("./leave.controller");

// Middleware allowing Admins, HR (hr@company.com), Team Leads, and Project Managers to review leaves
const canReviewLeaves = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message: "Authentication is required"
    });
  }

  const role = String(req.user.role || req.user.roleName || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  if (role === "SUPER_ADMIN" || role === "ADMIN") {
    return next();
  }

  const email = String(req.user.email || "").trim().toLowerCase();
  const departmentName = String(
    req.user.department?.departmentName || ""
  ).trim().toLowerCase();
  const designation = String(
    req.user.designation?.designationName || req.user.designation || ""
  ).trim().toLowerCase();

  const isHR =
    email === "hr@company.com" ||
    departmentName === "hr" ||
    departmentName === "human resources" ||
    designation.includes("hr");

  const isLeadOrManager =
    designation.includes("team lead") ||
    designation.includes("project manager");

  const permissions = new Set(
    (req.user.permissions || []).map((p) =>
      String(p).trim().toUpperCase().replace(/[\s-]+/g, "_")
    )
  );

  if (
    isHR ||
    isLeadOrManager ||
    permissions.has("APPROVE_LEAVE") ||
    permissions.has("REJECT_LEAVE") ||
    permissions.has("VIEW_ALL_LEAVES") ||
    permissions.has("VIEW_TEAM_LEAVES")
  ) {
    return next();
  }

  return res.status(403).json({
    success: false,
    statusCode: 403,
    message: "You do not have permission to review leave requests"
  });
};

// Get all leave requests
router.get(
  "/",
  auth,
  canReviewLeaves,
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
  canReviewLeaves,
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
  requireAnyRole("ADMIN", "EMPLOYEE"),
  requirePermission("CREATE_LEAVE"),
  leaveController.createLeave
);

// Get a single leave request
router.get(
  "/:id",
  auth,
  canReviewLeaves,
  leaveController.getLeaveRequest
);

// Approve leave
router.patch(
  "/:id/approve",
  auth,
  canReviewLeaves,
  leaveController.approveLeave
);

// Reject leave
router.patch(
  "/:id/reject",
  auth,
  canReviewLeaves,
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