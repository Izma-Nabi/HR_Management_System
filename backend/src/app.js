const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const env = require("../../global/env");
const { uploadsRoot } = require("./middlewares/upload.middleware");
const adminAuthRoutes = require("./modules/admin-auth/admin-auth.routes");
const userRoutes = require("./modules/users/user.routes");
const adminEmployeesRoutes = require("./modules/admin-employees/admin-employees.routes");
const employeeAuthRoutes = require("./modules/employee-auth/employee-auth.routes");
const departmentRoutes = require("./modules/departments/departments.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");

const {
  notFoundHandler,
  errorHandler
} = require("./middlewares/error.middleware");

const app = express();

// helmet sets common security-related HTTP headers.
app.use(helmet());

// cors controls which frontend origins can call this API from a browser.
const corsOptions = env.corsOrigin === "*"
  ? { origin: "*" }
  : {
      origin: env.corsOrigin.split(",").map((origin) => origin.trim()),
      credentials: true
    };

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true
  })
);
// Parse JSON request bodies. The small limit reduces abuse risk.
app.use(express.json({ limit: "10kb" }));

// Parse URL-encoded bodies. Useful if a tool sends form-style data.
app.use(express.urlencoded({ extended: false }));

// Serve uploaded employee photos.
app.use("/uploads", express.static(uploadsRoot));

app.use("/api/dashboard", dashboardRoutes);
// Log HTTP requests during development.
if (env.nodeEnv !== "test") {
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
}

// Root route for browser checks at http://localhost:5000/.
app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Bookme backend is running",
    data: {
      health: "/health",
      adminLogin: "/api/auth/login",
      adminEmployees: "/api/admin/employees",
      departments: "/api/departments",
      employeeLogin: "/api/v1/employee/auth/login"
    }
  });
});

// Health route for quick server checks.
app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Combined backend is running",
    data: {
      service: "admin-employee-backend",
      status: "ok"
    }
  });
});

// Admin routes.
// These power the admin frontend. /api/auth keeps the old admin backend path,
// while /api/admin/auth is the clearer combined-backend path.
app.use("/api/auth", adminAuthRoutes);
app.use("/api/users", userRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/departments", departmentRoutes);

// Compatibility for the current admin frontend page that calls /api/api/auth.
app.use("/api/api/auth", adminAuthRoutes);

// Compatibility for the old administrator signup route intent.
app.use("/api/administrator", adminAuthRoutes);

// Super Admin employee management routes.
app.use("/api/admin/employees", adminEmployeesRoutes);
app.use("/api/v1/admin/employees", adminEmployeesRoutes);
app.use("/api/v1/departments", departmentRoutes);

// Employee routes.
// These keep the employee frontend's existing /api/v1/employee/auth path.
app.use("/api/v1/employee/auth", employeeAuthRoutes);

// These must be after all real routes.
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
