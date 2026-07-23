const express = require("express");
const validate = require("../../middlewares/validate.middleware");
const authMiddleware = require("../../middlewares/auth.middleware");
const { requirePermission } = require("../../middlewares/permission.middleware");
const { uploadAdminPhoto } = require("../../middlewares/upload.middleware");
const userController = require("./user.controller");
const parseAdminDepartments = require("../../middlewares/parse-admin-departments.middleware");
const {
  createAdminSchema,
  updateAdminSchema,
  createEmployeeSchema
} = require("./user.validation");


const parseDepartments = (req,res,next)=>{
  if(req.body.managedDepartmentIds){
    req.body.managedDepartmentIds =
      JSON.parse(req.body.managedDepartmentIds);
  }

  next();
};


const router = express.Router();

router.use(authMiddleware);

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
