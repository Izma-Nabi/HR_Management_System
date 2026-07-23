const express = require("express");
const validate = require("../../middlewares/validate.middleware");
const authMiddleware = require("../../middlewares/auth.middleware");
const { requirePermission } = require("../../middlewares/permission.middleware");
const { uploadEmployeePhoto } = require("../../middlewares/upload.middleware");
const adminEmployeesController = require("./admin-employees.controller");
const {
  createEmployeeSchema
} = require("./admin-employees.validation");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  requirePermission("VIEW_EMPLOYEES"),
  adminEmployeesController.listEmployees
);

router.post(
  "/",
  authMiddleware,
  requirePermission("CREATE_EMPLOYEE"),
  uploadEmployeePhoto,
  validate(createEmployeeSchema),
  adminEmployeesController.createEmployee
);

module.exports = router;
