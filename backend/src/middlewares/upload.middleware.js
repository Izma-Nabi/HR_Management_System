const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { ApiError } = require("../utils/apiResponse");

const uploadsRoot = path.join(__dirname, "../../uploads");
const employeePhotosDirectory = path.join(uploadsRoot, "employees");
const adminPhotosDirectory = path.join(uploadsRoot, "admins");
const employeePhotosPublicPath = "/uploads/employees";
const adminPhotosPublicPath = "/uploads/admins";

fs.mkdirSync(employeePhotosDirectory, { recursive: true });
fs.mkdirSync(adminPhotosDirectory, { recursive: true });

const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp"
]);

const imageExtensionByMimeType = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
};

const createStorage = ({ directory, filenamePrefix }) => {
  return multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, directory);
    },
    filename: (req, file, callback) => {
      const extension = imageExtensionByMimeType[file.mimetype];
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

      callback(null, `${filenamePrefix}-${uniqueSuffix}${extension}`);
    }
  });
};

const createPhotoUpload = (storage) => {
  return multer({
    storage,
    limits: {
      fileSize: 2 * 1024 * 1024
    },
    fileFilter: (req, file, callback) => {
      if (!allowedImageTypes.has(file.mimetype)) {
        return callback(new ApiError(400, "Photo must be a JPG, PNG, or WebP image"));
      }

      return callback(null, true);
    }
  });
};

const mapUploadError = (error) => {
  if (error instanceof multer.MulterError) {
    const message = error.code === "LIMIT_FILE_SIZE"
      ? "Photo must be 2MB or smaller"
      : "Invalid photo upload";

    return new ApiError(400, message);
  }

  return error;
};

const createSinglePhotoMiddleware = ({ upload, publicPath }) => {
  return (req, res, next) => {
    upload.single("photo")(req, res, (error) => {
      if (error) {
        return next(mapUploadError(error));
      }

      if (req.file) {
        req.body.photo = `${publicPath}/${req.file.filename}`;
      }

      return next();
    });
  };
};

const employeePhotoUpload = createPhotoUpload(createStorage({
  directory: employeePhotosDirectory,
  filenamePrefix: "employee"
}));

const adminPhotoUpload = createPhotoUpload(createStorage({
  directory: adminPhotosDirectory,
  filenamePrefix: "admin"
}));

const uploadEmployeePhoto = createSinglePhotoMiddleware({
  upload: employeePhotoUpload,
  publicPath: employeePhotosPublicPath
});

const uploadAdminPhoto = createSinglePhotoMiddleware({
  upload: adminPhotoUpload,
  publicPath: adminPhotosPublicPath
});

module.exports = {
  uploadsRoot,
  uploadEmployeePhoto,
  uploadAdminPhoto
};
