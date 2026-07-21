const express = require("express");
const validate = require("../../middlewares/validate.middleware");
const authMiddleware = require("../../middlewares/auth.middleware");
const {
  requirePermission,
  requireAnyPermission
} = require("../../middlewares/permission.middleware");
const departmentsController = require("./departments.controller");
const {
  createDepartmentSchema,
  updateDepartmentSchema
} = require("./departments.validation");

const router = express.Router();

router.use(authMiddleware);

router.get(
  "/",
  requireAnyPermission("MANAGE_DEPARTMENTS", "MANAGE_ADMINS", "MANAGE_EMPLOYEES"),
  departmentsController.listDepartments
);

router.post(
  "/",
  requirePermission("MANAGE_DEPARTMENTS"),
  validate(createDepartmentSchema),
  departmentsController.createDepartment
);

router.get(
  "/:id",
  requireAnyPermission("MANAGE_DEPARTMENTS", "MANAGE_ADMINS", "MANAGE_EMPLOYEES"),
  departmentsController.getDepartment
);

router.put(
  "/:id",
  requirePermission("MANAGE_DEPARTMENTS"),
  validate(updateDepartmentSchema),
  departmentsController.updateDepartment
);

router.patch(
  "/:id",
  requirePermission("MANAGE_DEPARTMENTS"),
  validate(updateDepartmentSchema),
  departmentsController.updateDepartment
);

router.delete(
  "/:id",
  requirePermission("MANAGE_DEPARTMENTS"),
  departmentsController.deleteDepartment
);

module.exports = router;
