const express = require("express");
const authMiddleware = require("../../middlewares/auth.middleware");
const {
  requireAnyPermission,
  requirePermission
} = require("../../middlewares/permission.middleware");
const controller = require("./role.controller");

const router = express.Router();

router.use(authMiddleware);

router.get(
  "/",
  requireAnyPermission(
    "VIEW_ROLES",
    "CREATE_ROLE",
    "UPDATE_ROLE",
    "DELETE_ROLE",
    "CREATE_ADMIN",
    "CREATE_EMPLOYEE",
    "UPDATE_USER"
  ),
  controller.listRoles
);

router.get(
  "/permissions",
  requireAnyPermission("VIEW_ROLES", "CREATE_ROLE", "UPDATE_ROLE"),
  controller.listPermissions
);

router.get(
  "/:id/details",
  requirePermission("VIEW_ROLES"),
  controller.getRoleDetails
);

router.get(
  "/:id",
  requireAnyPermission("VIEW_ROLES", "UPDATE_ROLE"),
  controller.getRole
);

router.post(
  "/",
  requirePermission("CREATE_ROLE"),
  controller.createRole
);

router.put(
  "/:id",
  requirePermission("UPDATE_ROLE"),
  controller.updateRole
);

router.delete(
  "/:id",
  requirePermission("DELETE_ROLE"),
  controller.deleteRole
);

module.exports = router;
