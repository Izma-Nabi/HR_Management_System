const express = require("express");
const authMiddleware = require("../../middlewares/auth.middleware");
const { requireAnyPermission } = require("../../middlewares/permission.middleware");
const controller = require("./role.controller");

const router = express.Router();

router.use(authMiddleware);

router.get(
  "/",
  requireAnyPermission("CREATE_ADMIN", "CREATE_EMPLOYEE", "UPDATE_USER"),
  controller.listRoles
);

module.exports = router;
