const leavesService = require("./leave.service");

const createLeave = async (req, res, next) => {
  try {
    const {
      type,
      startDate,
      endDate,
      totalDays,
      reason,
      reportingToId,
      backupEmployeeId
    } = req.body;

    if (
      !type ||
      !startDate ||
      !endDate ||
      !totalDays
    ) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message:
          "Leave type, start date, end date, and total days are required.",
        errors: []
      });
    }

    if (Number(totalDays) <= 0) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Total days must be greater than zero.",
        errors: []
      });
    }

    const userId = Number(req.user.id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: "Authenticated user not found.",
        errors: []
      });
    }

    const leaveRequest = await leavesService.createLeave(
      userId,
      {
        type,
        startDate,
        endDate,
        totalDays: Number(totalDays),
        reason,
        reportingToId: reportingToId ? Number(reportingToId) : null,
        backupEmployeeId: backupEmployeeId
          ? Number(backupEmployeeId)
          : null
      }
    );

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Leave request created successfully",
      data: leaveRequest
    });
  } catch (error) {
    next(error);
  }
};


// ============================================================
// MY LEAVES
// ============================================================

const myLeaves = async (req, res, next) => {
  try {
    const userId = Number(req.user.id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: "Authenticated user not found.",
        errors: [],
      });
    }

    const data = await leavesService.getMyLeaves(userId);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "My leaves fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};


// ============================================================
// TEAM LEAVES
// ============================================================

const teamLeaves = async (req, res, next) => {
  try {
    const departmentId = Number(
      req.user.departmentId ||
      req.user.department?.id
    );

    if (!departmentId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "User department not found.",
        errors: [],
      });
    }

    const data = await leavesService.getTeamLeaves(departmentId);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Team leaves fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};




const getLeaveRequests = async (req, res, next) => {
  try {
    const data = await leavesService.getLeaveRequests(req.user);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Leave requests fetched successfully",
      data
    });
  } catch (error) {
    next(error);
  }
};


const getLeaveRequest = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Invalid leave request ID",
        errors: []
      });
    }

    const data = await leavesService.getLeaveRequest(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: "Leave request not found",
        errors: []
      });
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Leave request fetched successfully",
      data
    });
  } catch (error) {
    next(error);
  }
};

const getLeaveApprovers = async (req, res, next) => {
  try {
    const data = await leavesService.getLeaveApprovers(
      req.user.id
    );

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Leave approvers fetched successfully",
      data
    });
  } catch (error) {
    next(error);
  }
};

const getBackupEmployees = async (req, res, next) => {
  try {
    const data = await leavesService.getBackupEmployees(
      req.user.id
    );

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Backup employees fetched successfully",
      data
    });
  } catch (error) {
    next(error);
  }
};


const approveLeave = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Invalid leave request ID",
        errors: [],
      });
    }

    const decisionNote =
      typeof req.body?.decisionNote === "string"
        ? req.body.decisionNote.trim() || null
        : null;

    const approverId = Number(req.user.id);

    if (!approverId) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: "Authenticated approver not found.",
        errors: [],
      });
    }

    const data = await leavesService.approveLeave(
      id,
      req.user,
      decisionNote
    );

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Leave request approved successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};


const rejectLeave = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Invalid leave request ID",
        errors: [],
      });
    }

    const decisionNote =
      typeof req.body?.decisionNote === "string"
        ? req.body.decisionNote.trim() || null
        : null;

    const approverId = Number(req.user.id);

    if (!approverId) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: "Authenticated approver not found.",
        errors: [],
      });
    }

    const data = await leavesService.rejectLeave(
      id,
      req.user,
      decisionNote
    );

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Leave request rejected successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};


const cancelLeave = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Invalid leave request ID",
        errors: [],
      });
    }

    const data = await leavesService.cancelLeave(
      id,
      req.user
    );

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Leave request cancelled successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  createLeave,
  myLeaves,
  teamLeaves,
  getLeaveRequests,
  getLeaveRequest,
  approveLeave,
  rejectLeave,
  cancelLeave,
  getLeaveApprovers,
  getBackupEmployees
};