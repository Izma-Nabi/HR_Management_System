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
  requireAnyPermission(
    "VIEW_DEPARTMENTS",
    "CREATE_ADMIN",
    "UPDATE_ADMIN",
    "CREATE_EMPLOYEE",
    "UPDATE_EMPLOYEE"
  ),
  departmentsController.listDepartments
);

router.post(
  "/",
  requirePermission("CREATE_DEPARTMENT"),
  validate(createDepartmentSchema),
  departmentsController.createDepartment
);

router.get(
  "/:id",
  requireAnyPermission(
    "VIEW_DEPARTMENTS",
    "CREATE_ADMIN",
    "UPDATE_ADMIN",
    "CREATE_EMPLOYEE",
    "UPDATE_EMPLOYEE"
  ),
  departmentsController.getDepartment
);

router.put(
  "/:id",
  requirePermission("UPDATE_DEPARTMENT"),
  validate(updateDepartmentSchema),
  departmentsController.updateDepartment
);

router.patch(
  "/:id",
  requirePermission("UPDATE_DEPARTMENT"),
  validate(updateDepartmentSchema),
  departmentsController.updateDepartment
);

router.delete(
  "/:id",
  requirePermission("DELETE_DEPARTMENT"),
  departmentsController.deleteDepartment
);

module.exports = router;
