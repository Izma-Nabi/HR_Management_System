const express = require("express");
const validate = require("../../middlewares/validate.middleware");
const authMiddleware = require("../../middlewares/auth.middleware");
const { requirePermission } = require("../../middlewares/permission.middleware");
const { uploadAdminPhoto } = require("../../middlewares/upload.middleware");

const userController = require("./user.controller");

const {
  createUserSchema,
  updateUserSchema
} = require("./user.validation");


const router = express.Router();

router.use(authMiddleware);


router.post(
  "/",
  requirePermission("CREATE_USER"),
  uploadAdminPhoto,
  validate(createUserSchema),
  userController.createUser
);


router.get(
  "/",
  requirePermission("VIEW_USERS"),
  userController.listUsers
);


router.get(
  "/:id",
  requirePermission("VIEW_USERS"),
  userController.getUser
);


router.patch(
  "/:id",
  requirePermission("UPDATE_USER"),
  uploadAdminPhoto,
  validate(updateUserSchema),
  userController.updateUser
);


router.delete(
  "/:id",
  requirePermission("DELETE_USER"),
  userController.deleteUser
);


module.exports = router;