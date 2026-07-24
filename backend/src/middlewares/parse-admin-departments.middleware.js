const parseAdminDepartments = (req, res, next) => {
  try {
    if (req.body.managedDepartmentIds) {
      req.body.managedDepartmentIds = JSON.parse(
        req.body.managedDepartmentIds
      );
    }

    if (req.body.departmentId === "") {
      req.body.departmentId = null;
    }

    if (req.body.joiningDate === "") {
      req.body.joiningDate = null;
    }

    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid managed departments format"
    });
  }
};

module.exports = parseAdminDepartments;
