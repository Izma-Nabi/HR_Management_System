const express = require("express");
const authMiddleware = require("../../middlewares/auth.middleware");
const { requireAnyPermission } = require("../../middlewares/permission.middleware");
const controller = require("./designation.controller");

const router = express.Router();

router.use(authMiddleware);

router.get(
  "/",
  requireAnyPermission(
    "CREATE_ADMIN",
    "UPDATE_ADMIN",
    "CREATE_EMPLOYEE",
    "UPDATE_EMPLOYEE",
    "UPDATE_USER"
  ),
  controller.listDesignations
);

module.exports = router;
