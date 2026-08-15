const { prisma } = require("../../../../database/prisma");
const leaveRepository = require("./leave.repository");
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

const getMyLeaves = async (userId) => {
  return leaveRepository.getMyLeaves(userId);
};

const getTeamLeaves = async (departmentId) => {
  return leaveRepository.getTeamLeaves(departmentId);
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

const leaveDatesInclusive = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const cursor = new Date(Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate()
  ));
  const finalDate = new Date(Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    end.getUTCDate()
  ));
  const dates = [];

  while (cursor <= finalDate) {
    dates.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
};

const pakistanDateKey = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
};

const persistApprovedLeaveAttendance = async (client, leaveRequest) => {
  const dates = leaveDatesInclusive(
    leaveRequest.startDate,
    leaveRequest.endDate
  ).filter(
    (attendanceDate) =>
      attendanceDate.toISOString().slice(0, 10) >= pakistanDateKey()
  );
  const calculatedAt = new Date();
  const remarks = `Approved ${String(leaveRequest.type)
    .toLowerCase()
    .replaceAll("_", " ")} leave request #${leaveRequest.id}`;

  for (const attendanceDate of dates) {
    const summary = {
      departmentId: leaveRequest.user.departmentId,
      designationId: leaveRequest.user.designationId,
      firstCheckIn: null,
      lastCheckOut: null,
      workingMinutes: 0,
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      overtimeMinutes: 0,
      expectedMinutes: 0,
      attendanceStatus: "ON_LEAVE",
      remarks,
      calculatedAt
    };

    await client.attendanceSummary.upsert({
      where: {
        userId_attendanceDate: {
          userId: leaveRequest.userId,
          attendanceDate
        }
      },
      update: summary,
      create: {
        userId: leaveRequest.userId,
        attendanceDate,
        ...summary
      }
    });
  }

  return dates.length;
};

const syncApprovedLeaveAttendance = async (leaveId) => {
  return prisma.$transaction(async (tx) => {
    const leaveRequest = await tx.leaveRequest.findFirst({
      where: {
        id: Number(leaveId),
        status: "APPROVED"
      },
      include: {
        user: {
          select: {
            departmentId: true,
            designationId: true
          }
        }
      }
    });

    if (!leaveRequest) {
      return 0;
    }

    return persistApprovedLeaveAttendance(tx, leaveRequest);
  }, {
    timeout: 30000
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

  return prisma.$transaction(async (tx) => {
    const leaveRequest = await tx.leaveRequest.findUnique({
      where: { id },
      include: {
        approvals: {
          orderBy: { approvalLevel: "asc" }
        }
      }
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

    const pendingApproval = await tx.leaveApproval.findFirst({
      where: {
        leaveRequestId: id,
        refersTo: approverId,
        status: "PENDING"
      },
      orderBy: { approvalLevel: "asc" }
    });
    const approvalData = {
      status: "APPROVED",
      action: "APPROVED",
      decisionNote,
      decidedAt: new Date()
    };

    if (pendingApproval) {
      await tx.leaveApproval.update({
        where: { id: pendingApproval.id },
        data: approvalData
      });
    } else {
      await tx.leaveApproval.create({
        data: {
          leaveRequestId: id,
          refersTo: approverId,
          approvalLevel: leaveRequest.currentApprovalLevel || 1,
          ...approvalData
        }
      });
    }

    const updatedLeave = await tx.leaveRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        currentRefersTo: null
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            userCode: true,
            departmentId: true,
            designationId: true
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
          orderBy: { approvalLevel: "asc" }
        }
      }
    });

    await persistApprovedLeaveAttendance(tx, updatedLeave);

    return updatedLeave;
  }, {
    timeout: 30000
  });
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
  getMyLeaves,
  getTeamLeaves,
  getLeaveRequests,
  getLeaveRequest,
  syncApprovedLeaveAttendance,
  approveLeave,
  rejectLeave,
  cancelLeave,
};
