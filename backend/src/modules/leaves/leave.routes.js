const router = require("express").Router();

const auth = require("../../middlewares/auth.middleware");
const {requirePermission} = require("../../middlewares/permission.middleware");

const leaveController = require("./leave.controller");



router.post(
"/",
auth,
requirePermission("CREATE_LEAVE"),
leaveController.createLeave
);



router.get(
"/my",
auth,
requirePermission("VIEW_OWN_LEAVE"),
leaveController.myLeaves
);



router.get(
"/team",
auth,
requirePermission("VIEW_TEAM_LEAVE"),
leaveController.teamLeaves
);



router.patch(
"/:id/approve",
auth,
requirePermission("APPROVE_LEAVE"),
leaveController.approveLeave
);



router.patch(
"/:id/reject",
auth,
requirePermission("REJECT_LEAVE"),
leaveController.rejectLeave
);



router.patch(
"/:id/cancel",
auth,
requirePermission("CANCEL_LEAVE"),
leaveController.cancelLeave
);



module.exports = router;