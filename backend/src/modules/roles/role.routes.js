const express = require("express");
const authMiddleware = require("../../middlewares/auth.middleware");
const { requirePermission } = require("../../middlewares/permission.middleware");
const controller = require("./role.controller");

const router = express.Router();

router.use(authMiddleware);

router.get(
  "/",
  requirePermission("CREATE_EMPLOYEE"),
  controller.listRoles
);

module.exports = router;