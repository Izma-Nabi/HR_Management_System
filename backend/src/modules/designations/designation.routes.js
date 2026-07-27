const express = require("express");
const validate = require("../../middlewares/validate.middleware");
const authMiddleware = require("../../middlewares/auth.middleware");
const {
  requireAnyPermission,
  requirePermission
} = require("../../middlewares/permission.middleware");
const controller = require("./designation.controller");
const {
  createDesignationSchema
} = require("./designation.validation");

const router = express.Router();

router.use(authMiddleware);

router.get(
  "/",
  requireAnyPermission(
    "VIEW_DESIGNATIONS",
    "CREATE_DESIGNATION",
    "DELETE_DESIGNATION",
    "CREATE_ADMIN",
    "UPDATE_ADMIN",
    "CREATE_EMPLOYEE",
    "UPDATE_EMPLOYEE",
    "UPDATE_USER"
  ),
  controller.listDesignations
);

router.post(
  "/",
  requirePermission("CREATE_DESIGNATION"),
  validate(createDesignationSchema),
  controller.createDesignation
);

router.delete(
  "/:id",
  requirePermission("DELETE_DESIGNATION"),
  controller.deleteDesignation
);

module.exports = router;
