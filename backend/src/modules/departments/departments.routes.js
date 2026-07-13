const express = require("express");
const validate = require("../../middlewares/validate.middleware");
const authMiddleware = require("../../middlewares/auth.middleware");
const allowRoles = require("../../middlewares/role.middleware");
const departmentsController = require("./departments.controller");
const {
  createDepartmentSchema,
  updateDepartmentSchema
} = require("./departments.validation");

const router = express.Router();

router.use(authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN"));

router.get("/", departmentsController.listDepartments);
router.post("/", validate(createDepartmentSchema), departmentsController.createDepartment);
router.get("/:id", departmentsController.getDepartment);
router.put("/:id", validate(updateDepartmentSchema), departmentsController.updateDepartment);
router.patch("/:id", validate(updateDepartmentSchema), departmentsController.updateDepartment);
router.delete("/:id", departmentsController.deleteDepartment);

module.exports = router;
