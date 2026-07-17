const express = require("express");
const validate = require("../../middlewares/validate.middleware");
const authMiddleware = require("../../middlewares/auth.middleware");
const allowRoles = require("../../middlewares/role.middleware");
const { uploadEmployeePhoto } = require("../../middlewares/upload.middleware");
const adminEmployeesController = require("./admin-employees.controller");
const {
  createEmployeeSchema
} = require("./admin-employees.validation");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN"),
  adminEmployeesController.listEmployees
);

router.post(
  "/",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN"),
  uploadEmployeePhoto,
  validate(createEmployeeSchema),
  adminEmployeesController.createEmployee
);

module.exports = router;
