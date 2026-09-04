const { prisma } = require("../../../../database/prisma");
const mailTransporter = require("../auth/mail.service");

// Helper to categorize applicants by role and designation
const extractRequesterCategory = (user) => {
  const designationName = String(
    user?.designation?.designationName ||
      user?.designationName ||
      (typeof user?.designation === "string" ? user.designation : "") ||
      ""
  )
    .trim()
    .toLowerCase();

  // HR is identified ONLY from designation.
  // Examples:
  // HR
  // HR Manager
  // Senior HR Manager
  // HR Executive
  // Human Resources Manager
  // Human Resources Officer
  const isHR =
    designationName.includes("hr") ||
    designationName.includes("human resources");

  const isTeamLead = designationName.includes("team lead");

  const isProjectManager =
    designationName.includes("project manager") ||
    designationName.includes("manager");

  return {
    isHR,
    isTeamLead,
    isProjectManager,
    isSpecialApplicant:
      isHR || isTeamLead || isProjectManager
  };
};

// Helper to determine if a user can approve or reject a leave request
const canUserApproveLeave = (leaveRequest, user) => {
  if (!user || !leaveRequest) return false;

  const roleKey = String(user.role || user.roleName || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  if (roleKey === "SUPER_ADMIN" || roleKey === "ADMIN") {
    return true;
  }

  const email = String(user.email || "").trim().toLowerCase();
  const departmentName = String(
    user.department?.departmentName || user.departmentName || ""
  ).trim().toLowerCase();
  const designationName = String(
    user.designation?.designationName ||
    user.designationName ||
    (typeof user.designation === "string" ? user.designation : "") ||
    ""
  ).trim().toLowerCase();

  const isHRUser =
    email === "hr@company.com" ||
    departmentName === "human resources" ||
    departmentName === "hr" ||
    designationName.includes("hr");

  if (isHRUser) {
    return true;
  }

  if (
    leaveRequest.currentRefersTo === user.id ||
    leaveRequest.reportingToId === user.id
  ) {
    return true;
  }

  const permissions = new Set(
    (user.permissions || []).map((p) =>
      String(p).trim().toUpperCase().replace(/[\s-]+/g, "_")
    )
  );

  return (
    permissions.has("APPROVE_LEAVE") ||
    permissions.has("REJECT_LEAVE") ||
    permissions.has("MANAGE_LEAVES")
  );
};

const getLeaveApprovers = async (userId) => {
  const currentUser = await prisma.user.findUnique({
    where: {
      id: Number(userId)
    },
    select: {
      id: true,
      departmentId: true
    }
  });

  if (!currentUser) {
    throw new Error("User not found.");
  }

  if (!currentUser.departmentId) {
    return [];
  }

  return prisma.user.findMany({
    where: {
      departmentId: currentUser.departmentId,
      id: {
        not: currentUser.id
      },
      employmentStatus: "ACTIVE",
      designation: {
        OR: [
          {
            designationName: {
              contains: "Team Lead"
            }
          },
          {
            designationName: {
              contains: "Project Manager"
            }
          }
        ]
      }
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      designation: {
        select: {
          id: true,
          designationName: true
        }
      }
    },
    orderBy: [
      {
        firstName: "asc"
      },
      {
        lastName: "asc"
      }
    ]
  });
};

const cancelLeave = async (leaveId, user) => {
  const id = Number(leaveId);
  const userId = Number(user.id);

  if (!id || !userId) {
    throw new Error("Invalid leave ID or user ID.");
  }

  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: {
      id
    }
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
      id
    },
    data: {
      status: "CANCELLED",
      currentRefersTo: null
    },
    include: {
      approvals: true,
      user: true
    }
  });
};

const getBackupEmployees = async (userId) => {
  const currentUser = await prisma.user.findUnique({
    where: {
      id: Number(userId)
    },
    select: {
      id: true,
      departmentId: true
    }
  });

  if (!currentUser) {
    throw new Error("User not found.");
  }

  if (!currentUser.departmentId) {
    return [];
  }

  return prisma.user.findMany({
    where: {
      departmentId: currentUser.departmentId,
      id: {
        not: currentUser.id
      },
      employmentStatus: "ACTIVE",
      NOT: {
        designation: {
          OR: [
            {
              designationName: {
                contains: "Team Lead"
              }
            },
            {
              designationName: {
                contains: "Project Manager"
              }
            }
          ]
        }
      }
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      designation: {
        select: {
          id: true,
          designationName: true
        }
      }
    },
    orderBy: [
      {
        firstName: "asc"
      },
      {
        lastName: "asc"
      }
    ]
  });
};

const getHRUsers = async (departmentId = null) => {
  const where = {
    employmentStatus: "ACTIVE",
    OR: [
      {
        email: "hr@company.com"
      },
      {
        role: {
          roleName: {
            in: ["Admin", "HR"]
          }
        }
      }
    ]
  };

  if (departmentId) {
    where.AND = [
      {
        OR: [
          {
            departmentId: Number(departmentId)
          },
          {
            email: "hr@company.com"
          }
        ]
      }
    ];
  }

  return prisma.user.findMany({
    where,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      departmentId: true,
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
    },
    orderBy: [
      {
        firstName: "asc"
      },
      {
        lastName: "asc"
      }
    ]
  });
};

const createLeave = async (
  userId,
  {
    type,
    startDate,
    endDate,
    totalDays,
    reason,
    reportingToId,
    backupEmployeeId
  }
) => {
  userId = Number(userId);

  if (!userId) {
    throw new Error("Invalid user.");
  }

  const requester = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      userCode: true,
      departmentId: true,
      designationId: true,
      department: {
        select: {
          id: true,
          departmentName: true
        }
      },
      designation: {
        select: {
          id: true,
          designationName: true
        }
      },
      role: {
        select: {
          id: true,
          roleName: true
        }
      }
    }
  });

  if (!requester) {
    throw new Error("Authenticated user not found.");
  }

  const { isHR, isTeamLead, isProjectManager, isSpecialApplicant } =
    extractRequesterCategory(requester);

  let targetReportingToId = null;
  let targetApproverId = null;
  let targetBackupEmployeeId = null;
  let reportingTo = null;
  let backupEmployee = null;
  let recipientEmails = [];
  let routingNotice = "";

  if (isHR) {
    // -----------------------------------------------------------
    // Case 1: HR Leave Request -> Directly to Admin
    // -----------------------------------------------------------
    const adminApprover = await prisma.user.findFirst({
  where: {
    role: {
      roleName: {
        in: ["Admin", "ADMIN"]
      }
    },
    id: {
      not: requester.id
    },
    employmentStatus: "ACTIVE"
  },
  select: {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    designation: {
      select: {
        id: true,
        designationName: true
      }
    },
    role: {
      select: {
        id: true,
        roleName: true
      }
    }
  },
  orderBy: {
    id: "asc"
  }
});

    if (adminApprover) {
      reportingTo = adminApprover;
      targetReportingToId = adminApprover.id;
      targetApproverId = adminApprover.id;
      recipientEmails = [adminApprover.email];
    }

    routingNotice = "This leave request was submitted by an HR team member and has been routed directly to the Administrator for review and approval.";
  } else if (isTeamLead || isProjectManager) {
    // -----------------------------------------------------------
    // Case 2: Team Lead / Project Manager Leave -> Directly to HR (hr@company.com)
    // -----------------------------------------------------------
    let hrApprover = await prisma.user.findFirst({
      where: {
        email: "hr@company.com",
        employmentStatus: "ACTIVE"
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        designation: {
          select: {
            id: true,
            designationName: true
          }
        },
        role: {
          select: {
            id: true,
            roleName: true
          }
        }
      }
    });

    if (!hrApprover) {
      hrApprover = await prisma.user.findFirst({
        where: {
          OR: [
            {
              department: {
                departmentName: {
                  in: ["Human Resources", "HR"]
                }
              }
            },
            {
              designation: {
                designationName: {
                  contains: "HR"
                }
              }
            }
          ],
          employmentStatus: "ACTIVE",
          id: {
            not: requester.id
          }
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          designation: {
            select: {
              id: true,
              designationName: true
            }
          },
          role: {
            select: {
              id: true,
              roleName: true
            }
          }
        }
      });
    }

    if (hrApprover) {
      reportingTo = hrApprover;
      targetReportingToId = hrApprover.id;
      targetApproverId = hrApprover.id;
      recipientEmails = [hrApprover.email];
    } else {
      recipientEmails = ["hr@company.com"];
    }

    const managementRole = isProjectManager ? "Project Manager" : "Team Lead";
    routingNotice = `This leave request was submitted by a ${managementRole} and has been routed directly to HR (hr@company.com) for review and approval.`;
  } else {
    // -----------------------------------------------------------
    // Case 3: Regular Employee -> Standard reportingTo & optional backup
    // -----------------------------------------------------------
    if (!reportingToId) {
      throw new Error("Reporting To is required.");
    }

    reportingTo = await prisma.user.findUnique({
      where: {
        id: Number(reportingToId)
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        departmentId: true,
        employmentStatus: true,
        designation: {
          select: {
            id: true,
            designationName: true
          }
        },
        role: {
          select: {
            id: true,
            roleName: true
          }
        }
      }
    });

    if (!reportingTo) {
      throw new Error("Selected Reporting To user was not found.");
    }

    if (
      requester.departmentId &&
      reportingTo.departmentId !== requester.departmentId
    ) {
      throw new Error(
        "Reporting To must belong to the same department."
      );
    }

    if (reportingTo.employmentStatus !== "ACTIVE") {
      throw new Error(
        "Selected Reporting To user is not active."
      );
    }

    const designationName =
      reportingTo.designation?.designationName || "";

    const isValidApprover =
      designationName.toLowerCase().includes("team lead") ||
      designationName.toLowerCase().includes("project manager");

    if (!isValidApprover) {
      throw new Error(
        "Reporting To must be a Team Lead or Project Manager."
      );
    }

    targetReportingToId = reportingTo.id;
    targetApproverId = reportingTo.id;

    if (backupEmployeeId) {
      backupEmployee = await prisma.user.findUnique({
        where: {
          id: Number(backupEmployeeId)
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          departmentId: true,
          employmentStatus: true,
          designation: {
            select: {
              id: true,
              designationName: true
            }
          }
        }
      });

      if (!backupEmployee) {
        throw new Error("Selected backup employee was not found.");
      }

      if (
        requester.departmentId &&
        backupEmployee.departmentId !== requester.departmentId
      ) {
        throw new Error(
          "Backup employee must belong to the same department."
        );
      }

      if (backupEmployee.id === requester.id) {
        throw new Error(
          "You cannot select yourself as backup employee."
        );
      }

      if (backupEmployee.employmentStatus !== "ACTIVE") {
        throw new Error(
          "Selected backup employee is not active."
        );
      }

      const backupDesignation =
        backupEmployee.designation?.designationName || "";

      const isManager =
        backupDesignation.toLowerCase().includes("team lead") ||
        backupDesignation.toLowerCase().includes("project manager");

      if (isManager) {
        throw new Error(
          "Team Lead or Project Manager cannot be selected as backup employee."
        );
      }

      targetBackupEmployeeId = backupEmployee.id;
    }

    const hrUsers = await getHRUsers(requester.departmentId);
    const fallbackHrEmail = (
      process.env.HR_EMAIL || "hr@company.com"
    )
      .trim()
      .toLowerCase();

    recipientEmails = [
      reportingTo.email,
      ...hrUsers.map((hr) => hr.email),
      fallbackHrEmail
    ];
  }

  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      userId,
      reportingToId: targetReportingToId,
      backupEmployeeId: targetBackupEmployeeId,
      type,
      startDate: new Date(`${startDate}T00:00:00`),
      endDate: new Date(`${endDate}T00:00:00`),
      totalDays: Number(totalDays),
      reason: reason || null,
      status: "PENDING",
      currentApprovalLevel: 1,
      currentRefersTo: targetApproverId
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          userCode: true,
          department: {
            select: {
              id: true,
              departmentName: true
            }
          }
        }
      },
      reportingTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          designation: {
            select: {
              id: true,
              designationName: true
            }
          },
          role: {
            select: {
              id: true,
              roleName: true
            }
          }
        }
      },
      backupEmployee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });

  const uniqueRecipients = Array.from(
    new Set(
      recipientEmails
        .filter(Boolean)
        .map((email) => String(email).trim().toLowerCase())
    )
  );

  if (uniqueRecipients.length > 0) {
    try {
      await mailTransporter.sendMail({
        from: process.env.SMTP_USER,
        to: uniqueRecipients.join(","),
        subject: `New Leave Request #${leaveRequest.id} - ${requester.firstName} ${requester.lastName}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:24px;color:#222">
            <h2>New Leave Request Submitted</h2>

            <p>A new leave request has been submitted and is awaiting review.</p>

            ${routingNotice ? `<p style="padding:10px 14px;background:#f3f4f6;border-left:4px solid #4f46e5;margin:16px 0;"><strong>Routing Note:</strong> ${routingNotice}</p>` : ""}

            <hr>

            <h3>Employee Details</h3>

            <p>
              <strong>Name:</strong>
              ${requester.firstName} ${requester.lastName}
            </p>

            <p>
              <strong>User Code:</strong>
              ${requester.userCode || "N/A"}
            </p>

            <p>
              <strong>Department:</strong>
              ${requester.department?.departmentName || "N/A"}
            </p>

            <p>
              <strong>Designation:</strong>
              ${requester.designation?.designationName || "N/A"}
            </p>

            <h3>Leave Details</h3>

            <p>
              <strong>Leave Request ID:</strong>
              #${leaveRequest.id}
            </p>

            <p>
              <strong>Leave Type:</strong>
              ${leaveRequest.type}
            </p>

            <p>
              <strong>Start Date:</strong>
              ${startDate}
            </p>

            <p>
              <strong>End Date:</strong>
              ${endDate}
            </p>

            <p>
              <strong>Total Days:</strong>
              ${leaveRequest.totalDays}
            </p>

            <p>
              <strong>Reason:</strong>
              ${leaveRequest.reason || "No reason provided"}
            </p>

            <p>
              <strong>Status:</strong>
              PENDING
            </p>

            ${
              reportingTo
                ? `
            <h3>Assigned Reviewer / Approver</h3>
            <p>
              ${reportingTo.firstName} ${reportingTo.lastName}
              (${reportingTo.designation?.designationName || reportingTo.role?.roleName || "Approver"})
            </p>`
                : ""
            }

            ${
              backupEmployee
                ? `
            <h3>Backup Employee</h3>
            <p>
              ${backupEmployee.firstName} ${backupEmployee.lastName}
            </p>`
                : ""
            }

            <hr>

            <p>
              Please review this leave request in the Attendance Management System.
            </p>
          </div>
        `
      });

      console.log(
        `Leave request email sent to: ${uniqueRecipients.join(", ")}`
      );
    } catch (emailError) {
      console.error(
        "Leave request email failed:",
        emailError
      );
    }
  }

  if (backupEmployee?.email) {
    try {
      await mailTransporter.sendMail({
        from: process.env.SMTP_USER,
        to: backupEmployee.email,
        subject: `Backup Assignment for Leave Request #${leaveRequest.id}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#222">
            <h2>Backup Assignment</h2>

            <p>
              You have been selected as backup by
              <strong>
                ${requester.firstName} ${requester.lastName}
              </strong>.
            </p>

            <p>
              <strong>Leave Request ID:</strong>
              #${leaveRequest.id}
            </p>

            <p>
              <strong>Leave Type:</strong>
              ${leaveRequest.type}
            </p>

            <p>
              <strong>Start Date:</strong>
              ${startDate}
            </p>

            <p>
              <strong>End Date:</strong>
              ${endDate}
            </p>
          </div>
        `
      });

      console.log(
        `Backup leave email sent to: ${backupEmployee.email}`
      );
    } catch (emailError) {
      console.error(
        "Backup leave email failed:",
        emailError
      );
    }
  }

  return leaveRequest;
};

const getLeaveRequests = async (user) => {
  return prisma.leaveRequest.findMany({
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
      reportingTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          designation: {
            select: {
              id: true,
              designationName: true
            }
          },
          role: {
            select: {
              id: true,
              roleName: true
            }
          }
        }
      },
      backupEmployee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
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
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
};

const getLeaveRequest = async (id) => {
  return prisma.leaveRequest.findUnique({
    where: {
      id: Number(id)
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          userCode: true,
          department: true,
          role: true,
          designation: true
        }
      },
      reportingTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          designation: true
        }
      },
      backupEmployee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
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
      }
    }
  });
};

const leaveDatesInclusive = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const cursor = new Date(
    Date.UTC(
      start.getUTCFullYear(),
      start.getUTCMonth(),
      start.getUTCDate()
    )
  );

  const finalDate = new Date(
    Date.UTC(
      end.getUTCFullYear(),
      end.getUTCMonth(),
      end.getUTCDate()
    )
  );

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
    parts.map((part) => [
      part.type,
      part.value
    ])
  );

  return `${values.year}-${values.month}-${values.day}`;
};

const persistApprovedLeaveAttendance = async (
  client,
  leaveRequest
) => {
  const today = pakistanDateKey();

  const dates = leaveDatesInclusive(
    leaveRequest.startDate,
    leaveRequest.endDate
  ).filter(
    (attendanceDate) =>
      attendanceDate.toISOString().slice(0, 10) >= today
  );

  const calculatedAt = new Date();

  const remarks = `Approved ${String(leaveRequest.type)
    .toLowerCase()
    .replaceAll("_", " ")} leave request #${leaveRequest.id}`;

  for (const attendanceDate of dates) {
    const summary = {
      departmentId:
        leaveRequest.user.departmentId,
      designationId:
        leaveRequest.user.designationId,
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
  return prisma.$transaction(
    async (tx) => {
      const leaveRequest =
        await tx.leaveRequest.findFirst({
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

      return persistApprovedLeaveAttendance(
        tx,
        leaveRequest
      );
    },
    {
      timeout: 60000
    }
  );
};

const approveLeave = async (
  leaveId,
  user,
  decisionNote = null
) => {
  const id = Number(leaveId);
  const approverId = Number(user.id);

  if (!id || !approverId) {
    throw new Error(
      "Invalid leave ID or approver ID."
    );
  }

  const updatedLeave =
    await prisma.$transaction(
      async (tx) => {
        const leaveRequest =
          await tx.leaveRequest.findUnique({
            where: {
              id
            },
            include: {
              approvals: {
                orderBy: {
                  approvalLevel: "asc"
                }
              }
            }
          });

        if (!leaveRequest) {
          const error = new Error(
            "Leave request not found."
          );
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

        if (!canUserApproveLeave(leaveRequest, user)) {
          const error = new Error(
            "You are not authorized to approve this leave request."
          );
          error.statusCode = 403;
          throw error;
        }

        const pendingApproval =
          await tx.leaveApproval.findFirst({
            where: {
              leaveRequestId: id,
              refersTo: approverId,
              status: "PENDING"
            },
            orderBy: {
              approvalLevel: "asc"
            }
          });

        const approvalData = {
          status: "APPROVED",
          action: "APPROVED",
          decisionNote,
          decidedAt: new Date()
        };

        if (pendingApproval) {
          await tx.leaveApproval.update({
            where: {
              id: pendingApproval.id
            },
            data: approvalData
          });
        } else {
          await tx.leaveApproval.create({
            data: {
              leaveRequestId: id,
              refersTo: approverId,
              approvalLevel:
                leaveRequest.currentApprovalLevel ||
                1,
              ...approvalData
            }
          });
        }

        const updated =
          await tx.leaveRequest.update({
            where: {
              id
            },
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
                orderBy: {
                  approvalLevel: "asc"
                }
              }
            }
          });

        await persistApprovedLeaveAttendance(
          tx,
          updated
        );

        return updated;
      },
      {
        timeout: 60000
      }
    );

  return updatedLeave;
};

const rejectLeave = async (
  leaveId,
  user,
  decisionNote = null
) => {
  const id = Number(leaveId);
  const approverId = Number(user.id);

  if (!id || !approverId) {
    throw new Error(
      "Invalid leave ID or approver ID."
    );
  }

  const leaveRequest =
    await prisma.leaveRequest.findUnique({
      where: {
        id
      },
      include: {
        approvals: {
          orderBy: {
            approvalLevel: "asc"
          }
        }
      }
    });

  if (!leaveRequest) {
    const error = new Error(
      "Leave request not found."
    );
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

  if (!canUserApproveLeave(leaveRequest, user)) {
    const error = new Error(
      "You are not authorized to reject this leave request."
    );
    error.statusCode = 403;
    throw error;
  }

  let approval =
    await prisma.leaveApproval.findFirst({
      where: {
        leaveRequestId: id,
        refersTo: approverId,
        status: "PENDING"
      },
      orderBy: {
        approvalLevel: "asc"
      }
    });

  if (!approval) {
    approval =
      await prisma.leaveApproval.create({
        data: {
          leaveRequestId: id,
          refersTo: approverId,
          approvalLevel:
            leaveRequest.currentApprovalLevel ||
            1,
          status: "REJECTED",
          action: "REJECTED",
          decisionNote,
          decidedAt: new Date()
        }
      });
  } else {
    approval =
      await prisma.leaveApproval.update({
        where: {
          id: approval.id
        },
        data: {
          status: "REJECTED",
          action: "REJECTED",
          decisionNote,
          decidedAt: new Date()
        }
      });
  }

  return prisma.leaveRequest.update({
    where: {
      id
    },
    data: {
      status: "REJECTED",
      currentRefersTo: null
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      reportingTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      backupEmployee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      approvals: {
        include: {
          approver: true
        },
        orderBy: {
          approvalLevel: "asc"
        }
      }
    }
  });
};

const getMyLeaves = async (userId) => {
  const id = Number(userId);

  if (!id) {
    throw new Error("Invalid user ID.");
  }

  return prisma.leaveRequest.findMany({
    where: {
      userId: id
    },
    include: {
      reportingTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          designation: {
            select: {
              id: true,
              designationName: true
            }
          },
          role: {
            select: {
              id: true,
              roleName: true
            }
          }
        }
      },
      backupEmployee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          designation: {
            select: {
              id: true,
              designationName: true
            }
          }
        }
      },
      currentApprover: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          designation: {
            select: {
              id: true,
              designationName: true
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
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
};

const getTeamLeaves = async (departmentId) => {
  return prisma.leaveRequest.findMany({
    where: {
      user: {
        departmentId: Number(departmentId)
      }
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          userCode: true,
          department: {
            select: {
              id: true,
              departmentName: true
            }
          },
          designation: {
            select: {
              id: true,
              designationName: true
            }
          }
        }
      },
      reportingTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          designation: {
            select: {
              id: true,
              designationName: true
            }
          }
        }
      },
      backupEmployee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      approvals: {
        include: {
          approver: true
        },
        orderBy: {
          approvalLevel: "asc"
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
};

module.exports = {
  getLeaveApprovers,
  getBackupEmployees,
  getHRUsers,
  createLeave,
  getLeaveRequests,
  getLeaveRequest,
  getMyLeaves,
  getTeamLeaves,
  syncApprovedLeaveAttendance,
  approveLeave,
  rejectLeave,
  cancelLeave
};