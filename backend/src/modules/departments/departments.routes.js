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
  "/:id/designations",
    requireAnyPermission(
      "VIEW_DEPARTMENTS",
      "CREATE_ADMIN",
      "UPDATE_ADMIN",
      "CREATE_EMPLOYEE",
      "UPDATE_EMPLOYEE"
    ),
  departmentsController.listDepartmentDesignations
);


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

router.get(
  "/:id",
  requireAnyPermission(
    "VIEW_DEPARTMENTS",
    "CREATE_USER",
    "UPDATE_USER"
  ),
  departmentsController.getDepartment
);

router.post(
  "/",
  requirePermission("CREATE_DEPARTMENT"),
  validate(createDepartmentSchema),
  departmentsController.createDepartment
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
