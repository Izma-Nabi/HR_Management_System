const express = require("express");

const authMiddleware = require("../../middlewares/auth.middleware");
const { requirePermission } = require("../../middlewares/permission.middleware");
const controller = require("./role.controller");

const router = express.Router();

router.use(authMiddleware);

// List all roles
router.get(
  "/",
  requirePermission("VIEW_ROLES"),
  controller.listRoles
);

// List all permissions
router.get(
  "/permissions",
  requirePermission("VIEW_ROLES"),
  controller.listPermissions
);

// View role details (employees + permissions)
router.get(
  "/:id/details",
  requirePermission("VIEW_ROLES"),
  controller.getRoleDetails
);

// Get single role (used for Edit page)
router.get(
  "/:id",
  requirePermission("VIEW_ROLES"),
  controller.getRole
);

// Create role
router.post(
  "/",
  requirePermission("CREATE_ROLE"),
  controller.createRole
);

// Update role
router.put(
  "/:id",
  requirePermission("UPDATE_ROLE"),
  controller.updateRole
);

// Delete role
router.delete(
  "/:id",
  requirePermission("DELETE_ROLE"),
  controller.deleteRole
);

module.exports = router;