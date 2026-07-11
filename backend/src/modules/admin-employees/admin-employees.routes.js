const express = require("express");
const validate = require("../../middlewares/validate.middleware");
const authMiddleware = require("../../middlewares/auth.middleware");
const allowRoles = require("../../middlewares/role.middleware");
const adminEmployeesController = require("./admin-employees.controller");
const {
  createEmployeeSchema
} = require("./admin-employees.validation");

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  allowRoles("SUPER_ADMIN"),
  validate(createEmployeeSchema),
  adminEmployeesController.createEmployee
);

module.exports = router;
