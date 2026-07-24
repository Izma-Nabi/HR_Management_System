const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { ApiError } = require("../utils/apiResponse");

const uploadsRoot = path.join(__dirname, "../../uploads");
const employeePhotosDirectory = path.join(uploadsRoot, "employees");
const adminPhotosDirectory = path.join(uploadsRoot, "admins");
const userPhotosDirectory = path.join(uploadsRoot, "users");
const employeePhotosPublicPath = "/uploads/employees";
const adminPhotosPublicPath = "/uploads/admins";
const userPhotosPublicPath = "/uploads/users";
const attendanceDirectory = path.join(uploadsRoot, "attendance");
const attendancePublicPath = "/uploads/attendance";

fs.mkdirSync(attendanceDirectory, { recursive: true });

fs.mkdirSync(employeePhotosDirectory, { recursive: true });
fs.mkdirSync(adminPhotosDirectory, { recursive: true });
fs.mkdirSync(userPhotosDirectory, { recursive: true });

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

const allowedExcelTypes = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel"
]);

const excelExtensionByMimeType = {
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.ms-excel": ".xls"
};

const createStorage = ({ directory, filenamePrefix }) => {
  return multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, directory);
    },
    filename: (req, file, callback) => {
      const extension =
        imageExtensionByMimeType[file.mimetype] ||
        excelExtensionByMimeType[file.mimetype] ||
        path.extname(file.originalname);

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


const createExcelUpload = (storage) => {
  return multer({
    storage,
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, callback) => {
      if (!allowedExcelTypes.has(file.mimetype)) {
        return callback(
          new ApiError(400, "Only Excel (.xlsx or .xls) files are allowed")
        );
      }

      return callback(null, true);
    }
  });
};

const createSingleExcelMiddleware = ({ upload, publicPath }) => {
  return (req, res, next) => {
    upload.single("file")(req, res, (error) => {
      if (error) {
        return next(mapUploadError(error));
      }

      if (req.file) {
        req.body.filePath = req.file.path;
        req.body.fileName = req.file.filename;
        req.body.fileUrl = `${publicPath}/${req.file.filename}`;
      }

      return next();
    });
  };
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

const userPhotoUpload = createPhotoUpload(createStorage({
  directory: userPhotosDirectory,
  filenamePrefix: "user"
}));

const uploadEmployeePhoto = createSinglePhotoMiddleware({
  upload: employeePhotoUpload,
  publicPath: employeePhotosPublicPath
});

const uploadAdminPhoto = createSinglePhotoMiddleware({
  upload: adminPhotoUpload,
  publicPath: adminPhotosPublicPath
});

const uploadUserPhoto = createSinglePhotoMiddleware({
  upload: userPhotoUpload,
  publicPath: userPhotosPublicPath
});

const attendanceUpload = createExcelUpload(
  createStorage({
    directory: attendanceDirectory,
    filenamePrefix: "attendance"
  })
);

const uploadAttendanceExcel = createSingleExcelMiddleware({
  upload: attendanceUpload,
  publicPath: attendancePublicPath
});


module.exports = {
  uploadsRoot,
  uploadEmployeePhoto,
  uploadAdminPhoto,
  uploadUserPhoto,
  uploadAttendanceExcel
};
