const express = require("express");
const validate = require("../../middlewares/validate.middleware");

const userController = require("./user.controller");

const {
  createAdminSchema,
  createEmployeeSchema
} = require("./user.validation");

const router = express.Router();

router.post(
  "/admin",
  validate(createAdminSchema),
  userController.createAdmin
);

router.post(
  "/employee",
  validate(createEmployeeSchema),
  userController.createEmployee
);

module.exports = router;