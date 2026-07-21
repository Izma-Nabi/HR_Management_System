const prisma = require("../../../database/prisma");

const createLeave = (data) => {
  return prisma.leaveRequest.create({
    data
  });
};

const getMyLeaves = (userId) => {
  return prisma.leaveRequest.findMany({
    where: {
      userId
    },
    include: {
      approvals: true,
      history: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });
};

const getTeamLeaves = (departmentId) => {
  return prisma.leaveRequest.findMany({
    where: {
      user: {
        departmentId
      }
    },
    include: {
      user: true,
      approvals: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });
};

const getLeaveById = (id) => {
  return prisma.leaveRequest.findUnique({
    where: {
      id
    },
    include: {
      approvals: true,
      history: true,
      user: true
    }
  });
};

const updateLeaveStatus = (id, data) => {
  return prisma.leaveRequest.update({
    where: {
      id
    },
    data
  });
};

const createApproval = (data) => {
  return prisma.leaveApproval.create({
    data
  });
};

const updateApproval = (id, data) => {
  return prisma.leaveApproval.update({
    where: {
      id
    },
    data
  });
};

const createHistory = (data) => {
  return prisma.leaveApprovalHistory.create({
    data
  });
};

module.exports = {
  createLeave,
  getMyLeaves,
  getTeamLeaves,
  getLeaveById,
  updateLeaveStatus,
  createApproval,
  updateApproval,
  createHistory
};