const express = require("express");
const validate = require("../../middlewares/validate.middleware");
const authMiddleware = require("../../middlewares/auth.middleware");
const allowRoles = require("../../middlewares/role.middleware");
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

router.use(authMiddleware, allowRoles("SUPER_ADMIN"));

router.post(
  "/admin",
  uploadAdminPhoto,
  parseAdminDepartments,
  validate(createAdminSchema),
  userController.createAdmin
);


router.get(
  "/admins",
  userController.listAdmins
);

router.get(
  "/admin/:id",
  userController.getAdmin
);

router.get(
  "/admins/:id",
  userController.getAdmin
);

router.put(
  "/admin/:id",
  uploadAdminPhoto,
  parseAdminDepartments,
  validate(updateAdminSchema),
  userController.updateAdmin
);

router.patch(
  "/admin/:id",
  uploadAdminPhoto,
  parseAdminDepartments,
  validate(updateAdminSchema),
  userController.updateAdmin
);

router.patch(
  "/admins/:id",
  uploadAdminPhoto,
  validate(updateAdminSchema),
  userController.updateAdmin
);

router.delete(
  "/admin/:id",
  userController.deleteAdmin
);

router.delete(
  "/admins/:id",
  userController.deleteAdmin
);

router.post(
  "/employee",
  validate(createEmployeeSchema),
  userController.createEmployee
);

module.exports = router;
