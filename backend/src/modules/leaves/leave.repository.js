const { prisma } = require("../../../../database/prisma");

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
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          userCode: true,
          role: {
            select: {
              id: true,
              roleName: true
            }
          },
          department: {
            select: {
              id: true,
              departmentName: true
            }
          }
        }
      },
      approvals: {
        include: {
          approver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: {
          approvalLevel: "asc"
        }
      },
      currentApprover: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      approvalHistory: true
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
      user: {
        include: {
          role: true,
          department: true
        }
      },
      approvals: {
        include: {
          approver: true
        }
      }
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
      approvalHistory: true,
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
