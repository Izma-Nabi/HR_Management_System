const { prisma } = require("../../../../database/prisma");
/*
|--------------------------------------------------------------------------
| CREATE LEAVE
|--------------------------------------------------------------------------
*/
const createLeave = async (
  userId,
  {
    type,
    startDate,
    endDate,
    totalDays,
    reason,
  }
) => {
  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      userId,
      type,
      startDate: new Date(`${startDate}T00:00:00`),
      endDate: new Date(`${endDate}T00:00:00`),
      totalDays: Number(totalDays),
      reason: reason || null,
      status: "PENDING",
      currentApprovalLevel: 1,
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
              roleName: true,
            },
          },
          department: {
            select: {
              id: true,
              departmentName: true,
            },
          },
        },
      },
      approvals: true,
    },
  });

  return leaveRequest;
};


/*
|--------------------------------------------------------------------------
| GET ALL LEAVE REQUESTS
|--------------------------------------------------------------------------
*/
const getLeaveRequests = async (user) => {
  const leaveRequests = await prisma.leaveRequest.findMany({
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
              roleName: true,
            },
          },
          department: {
            select: {
              id: true,
              departmentName: true,
            },
          },
        },
      },

      approvals: {
        include: {
          approver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          approvalLevel: "asc",
        },
      },

      currentApprover: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return leaveRequests;
};


/*
|--------------------------------------------------------------------------
| GET SINGLE LEAVE REQUEST
|--------------------------------------------------------------------------
*/
const getLeaveRequest = async (id) => {
  return prisma.leaveRequest.findUnique({
    where: {
      id: Number(id),
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
              roleName: true,
            },
          },
          department: {
            select: {
              id: true,
              departmentName: true,
            },
          },
        },
      },

      approvals: {
        include: {
          approver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },

        orderBy: {
          approvalLevel: "asc",
        },
      },

      currentApprover: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
};


/*
|--------------------------------------------------------------------------
| APPROVE LEAVE
|--------------------------------------------------------------------------
*/
const approveLeave = async (
  leaveId,
  user,
  decisionNote = null
) => {
  const id = Number(leaveId);
  const approverId = Number(user.id);

  if (!id || !approverId) {
    throw new Error("Invalid leave ID or approver ID.");
  }

  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: {
      id,
    },

    include: {
      approvals: {
        orderBy: {
          approvalLevel: "asc",
        },
      },
    },
  });

  if (!leaveRequest) {
    const error = new Error("Leave request not found.");
    error.statusCode = 404;
    throw error;
  }

  if (leaveRequest.status !== "PENDING") {
    const error = new Error(
      `Leave request is already ${leaveRequest.status.toLowerCase()}.`
    );

    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Find existing approval for this approver
  |--------------------------------------------------------------------------
  */

  let approval = await prisma.leaveApproval.findFirst({
    where: {
      leaveRequestId: id,
      refersTo: approverId,
      status: "PENDING",
    },

    orderBy: {
      approvalLevel: "asc",
    },
  });

  /*
  |--------------------------------------------------------------------------
  | If approval does not exist, create it
  |--------------------------------------------------------------------------
  */

  if (!approval) {
    approval = await prisma.leaveApproval.create({
      data: {
        leaveRequestId: id,
        refersTo: approverId,
        approvalLevel: leaveRequest.currentApprovalLevel || 1,
        status: "APPROVED",
        action: "APPROVED",
        decisionNote,
        decidedAt: new Date(),
      },
    });
  } else {
    /*
    |--------------------------------------------------------------------------
    | Update existing approval
    |--------------------------------------------------------------------------
    */

    approval = await prisma.leaveApproval.update({
      where: {
        id: approval.id,
      },

      data: {
        status: "APPROVED",
        action: "APPROVED",
        decisionNote,
        decidedAt: new Date(),
      },
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Mark leave request as approved
  |--------------------------------------------------------------------------
  */

  const updatedLeave = await prisma.leaveRequest.update({
    where: {
      id,
    },

    data: {
      status: "APPROVED",
      currentRefersTo: null,
    },

    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          userCode: true,
        },
      },

      approvals: {
        include: {
          approver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },

        orderBy: {
          approvalLevel: "asc",
        },
      },
    },
  });

  return updatedLeave;
};


/*
|--------------------------------------------------------------------------
| REJECT LEAVE
|--------------------------------------------------------------------------
*/
const rejectLeave = async (
  leaveId,
  user,
  decisionNote = null
) => {
  const id = Number(leaveId);
  const approverId = Number(user.id);

  if (!id || !approverId) {
    throw new Error("Invalid leave ID or approver ID.");
  }

  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: {
      id,
    },

    include: {
      approvals: {
        orderBy: {
          approvalLevel: "asc",
        },
      },
    },
  });

  if (!leaveRequest) {
    const error = new Error("Leave request not found.");
    error.statusCode = 404;
    throw error;
  }

  if (leaveRequest.status !== "PENDING") {
    const error = new Error(
      `Leave request is already ${leaveRequest.status.toLowerCase()}.`
    );

    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Find existing approval
  |--------------------------------------------------------------------------
  */

  let approval = await prisma.leaveApproval.findFirst({
    where: {
      leaveRequestId: id,
      refersTo: approverId,
      status: "PENDING",
    },

    orderBy: {
      approvalLevel: "asc",
    },
  });

  /*
  |--------------------------------------------------------------------------
  | Create approval if none exists
  |--------------------------------------------------------------------------
  */

  if (!approval) {
    approval = await prisma.leaveApproval.create({
      data: {
        leaveRequestId: id,
        refersTo: approverId,
        approvalLevel: leaveRequest.currentApprovalLevel || 1,
        status: "REJECTED",
        action: "REJECTED",
        decisionNote,
        decidedAt: new Date(),
      },
    });
  } else {
    /*
    |--------------------------------------------------------------------------
    | Update existing approval
    |--------------------------------------------------------------------------
    */

    approval = await prisma.leaveApproval.update({
      where: {
        id: approval.id,
      },

      data: {
        status: "REJECTED",
        action: "REJECTED",
        decisionNote,
        decidedAt: new Date(),
      },
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Mark leave request as rejected
  |--------------------------------------------------------------------------
  */

  const updatedLeave = await prisma.leaveRequest.update({
    where: {
      id,
    },

    data: {
      status: "REJECTED",
      currentRefersTo: null,
    },

    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          userCode: true,
        },
      },

      approvals: {
        include: {
          approver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },

        orderBy: {
          approvalLevel: "asc",
        },
      },
    },
  });

  return updatedLeave;
};


/*
|--------------------------------------------------------------------------
| CANCEL LEAVE
|--------------------------------------------------------------------------
*/
const cancelLeave = async (leaveId, user) => {
  const id = Number(leaveId);
  const userId = Number(user.id);

  if (!id || !userId) {
    throw new Error("Invalid leave ID or user ID.");
  }

  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: {
      id,
    },
  });

  if (!leaveRequest) {
    const error = new Error("Leave request not found.");
    error.statusCode = 404;
    throw error;
  }

  if (leaveRequest.userId !== userId) {
    const error = new Error(
      "You can only cancel your own leave request."
    );

    error.statusCode = 403;
    throw error;
  }

  if (leaveRequest.status !== "PENDING") {
    const error = new Error(
      "Only pending leave requests can be cancelled."
    );

    error.statusCode = 400;
    throw error;
  }

  return prisma.leaveRequest.update({
    where: {
      id,
    },

    data: {
      status: "CANCELLED",
      currentRefersTo: null,
    },

    include: {
      approvals: true,
      user: true,
    },
  });
};


/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  createLeave,
  getLeaveRequests,
  getLeaveRequest,
  approveLeave,
  rejectLeave,
  cancelLeave,
};