const express = require("express");
const validate = require("../../middlewares/validate.middleware");
const authMiddleware = require("../../middlewares/auth.middleware");
const { requirePermission } = require("../../middlewares/permission.middleware");
const {
  uploadAdminPhoto,
  uploadUserPhoto
} = require("../../middlewares/upload.middleware");
const userController = require("./user.controller");
const parseAdminDepartments = require("../../middlewares/parse-admin-departments.middleware");
const {
  createAdminSchema,
  updateAdminSchema,
  createEmployeeSchema,
  updateUserSchema
} = require("./user.validation");

const router = express.Router();

router.use(authMiddleware);

router.get(
  "/",
  requirePermission("UPDATE_USER"),
  userController.listUsers
);

router.post(
  "/admin",
  requirePermission("CREATE_ADMIN"),
  uploadAdminPhoto,
  parseAdminDepartments,
  validate(createAdminSchema),
  userController.createAdmin
);


router.get(
  "/admins",
  requirePermission("VIEW_ADMINS"),
  userController.listAdmins
);

router.get(
  "/users",
  requirePermission("UPDATE_USER"),
  userController.listUsers
);

router.get(
  "/admin/:id",
  requirePermission("VIEW_ADMINS"),
  userController.getAdmin
);

router.get(
  "/admins/:id",
  requirePermission("VIEW_ADMINS"),
  userController.getAdmin
);

router.put(
  "/admin/:id",
  requirePermission("UPDATE_ADMIN"),
  uploadAdminPhoto,
  parseAdminDepartments,
  validate(updateAdminSchema),
  userController.updateAdmin
);

router.patch(
  "/admin/:id",
  requirePermission("UPDATE_ADMIN"),
  uploadAdminPhoto,
  parseAdminDepartments,
  validate(updateAdminSchema),
  userController.updateAdmin
);

router.patch(
  "/admins/:id",
  requirePermission("UPDATE_ADMIN"),
  uploadAdminPhoto,
  validate(updateAdminSchema),
  userController.updateAdmin
);

router.get(
  "/:id",
  requirePermission("UPDATE_USER"),
  userController.getUser
);

router.put(
  "/:id",
  requirePermission("UPDATE_USER"),
  uploadUserPhoto,
  parseAdminDepartments,
  validate(updateUserSchema),
  userController.updateUser
);

router.patch(
  "/:id",
  requirePermission("UPDATE_USER"),
  uploadUserPhoto,
  parseAdminDepartments,
  validate(updateUserSchema),
  userController.updateUser
);

router.delete(
  "/admin/:id",
  requirePermission("DELETE_ADMIN"),
  userController.deleteAdmin
);

router.delete(
  "/admins/:id",
  requirePermission("DELETE_ADMIN"),
  userController.deleteAdmin
);

router.post(
  "/employee",
  requirePermission("CREATE_EMPLOYEE"),
  validate(createEmployeeSchema),
  userController.createEmployee
);

module.exports = router;
