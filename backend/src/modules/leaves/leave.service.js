const { prisma } = require("../../../../database/prisma");
const mailTransporter = require("../auth/mail.service");
const { ApiError } = require("../../utils/apiResponse");
const { ROLE_KEYS, toRoleKey } = require("../../utils/roles");

const normalizeKey = (value) =>
  String(value || "").trim().toUpperCase().replace(/[\s-]+/g, "_");

const permissionSet = (user) =>
  new Set((user?.permissions || []).map(normalizeKey));

const hasAnyPermission = (user, ...permissions) => {
  const available = permissionSet(user);
  return permissions.some((permission) => available.has(normalizeKey(permission)));
};

const designationName = (user) =>
  String(user?.designation?.designationName || user?.designation || "").toLowerCase();

const isHrActor = (user) => {
  const roleKey = toRoleKey(user?.role || user?.roleName);
  const normalizedRole = normalizeKey(user?.roleName || user?.role);

  return [ROLE_KEYS.SUPER_ADMIN, ROLE_KEYS.ADMIN, ROLE_KEYS.HR].includes(roleKey)
    || normalizedRole === "HUMAN_RESOURCES"
    || normalizedRole.startsWith("HR_")
    || normalizedRole.endsWith("_HR");
};

const isTeamLeadActor = (user) => {
  const roleKey = toRoleKey(user?.role || user?.roleName);
  const designation = designationName(user);

  return roleKey === ROLE_KEYS.TEAM_LEAD
    || designation.includes("team lead")
    || designation.includes("project manager");
};

const isSuperAdminActor = (user) =>
  toRoleKey(user?.role || user?.roleName) === ROLE_KEYS.SUPER_ADMIN;

const reviewerScopeWhere = (user) => {
  if (
    isHrActor(user)
    || hasAnyPermission(user, "VIEW_ALL_LEAVES")
  ) {
    return {};
  }

  if (
    isTeamLeadActor(user)
    || hasAnyPermission(user, "VIEW_TEAM_LEAVES")
  ) {
    const departmentId = Number(user?.departmentId || user?.department?.id);

    if (!departmentId) {
      throw new ApiError(403, "A Team Lead must be assigned to a department");
    }

    return {
      user: {
        departmentId
      }
    };
  }

  throw new ApiError(403, "You are not allowed to list employee leave requests");
};

const workflowStage = (leaveRequest) => {
  if (leaveRequest.status !== "PENDING") {
    return "COMPLETED";
  }

  return Number(leaveRequest.currentApprovalLevel) === 2
    ? "TEAM_LEAD_REVIEW"
    : "HR_REVIEW";
};

const actorCanReviewStage = (leaveRequest, user) => {
  if (!leaveRequest || leaveRequest.status !== "PENDING") {
    return false;
  }

  if (Number(leaveRequest.userId) === Number(user?.id)) {
    return false;
  }

  const stage = workflowStage(leaveRequest);

  if (stage === "HR_REVIEW") {
    return isHrActor(user);
  }

  const reviewerDepartmentId = Number(user?.departmentId || user?.department?.id);
  const requesterDepartmentId = Number(
    leaveRequest.user?.departmentId || leaveRequest.user?.department?.id
  );

  return isTeamLeadActor(user)
    && Number(leaveRequest.reportingToId) === Number(user?.id)
    && reviewerDepartmentId > 0
    && reviewerDepartmentId === requesterDepartmentId;
};

const withWorkflowMetadata = (leaveRequest, user) => {
  if (!leaveRequest) {
    return null;
  }

  const canReview = actorCanReviewStage(leaveRequest, user);
  const canAccept = isSuperAdminActor(user)
    || hasAnyPermission(user, "ACCEPT_LEAVE_REQUEST", "APPROVE_LEAVE");
  const canReject = isSuperAdminActor(user)
    || hasAnyPermission(user, "REJECT_LEAVE_REQUEST", "REJECT_LEAVE");

  return {
    ...leaveRequest,
    workflowStage: workflowStage(leaveRequest),
    allowedActions: {
      accept: canReview && canAccept,
      reject: canReview && canReject
    }
  };
};

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const portalLeavesUrl = () => {
  const baseUrl = String(process.env.FRONTEND_URL || "http://localhost:3000")
    .trim()
    .replace(/\/$/, "");

  return `${baseUrl}/dashboard/leaves`;
};

const sendMailSafely = async (options, context) => {
  try {
    await mailTransporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      ...options
    });
  } catch (error) {
    console.error(`${context} email failed:`, error);
  }
};

const sendTeamLeadReviewEmail = async (leaveRequest) => {
  if (!leaveRequest.reportingTo?.email) {
    return;
  }

  const employeeName = `${leaveRequest.user?.firstName || ""} ${leaveRequest.user?.lastName || ""}`.trim();

  await sendMailSafely({
    to: leaveRequest.reportingTo.email,
    subject: `HR accepted leave request #${leaveRequest.id} - Team Lead review required`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#222">
        <h2>Team Lead Review Required</h2>
        <p>HR accepted the leave request from <strong>${escapeHtml(employeeName)}</strong>.</p>
        <p>Please log in to the portal to accept or reject request <strong>#${leaveRequest.id}</strong>.</p>
        <p><a href="${escapeHtml(portalLeavesUrl())}">Open Leave Requests</a></p>
      </div>
    `
  }, "Team Lead review");
};

const sendEmployeeDecisionEmail = async (leaveRequest, accepted, decisionNote) => {
  if (!leaveRequest.user?.email) {
    return;
  }

  const decision = accepted ? "accepted" : "rejected";
  const employeeName = `${leaveRequest.user.firstName || ""} ${leaveRequest.user.lastName || ""}`.trim();

  await sendMailSafely({
    to: leaveRequest.user.email,
    subject: `Your leave request #${leaveRequest.id} was ${decision}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#222">
        <h2>Leave Request ${accepted ? "Accepted" : "Rejected"}</h2>
        <p>Hello ${escapeHtml(employeeName)},</p>
        <p>Your leave request <strong>#${leaveRequest.id}</strong> was ${decision}.</p>
        ${decisionNote ? `<p><strong>Decision note:</strong> ${escapeHtml(decisionNote)}</p>` : ""}
        <p><a href="${escapeHtml(portalLeavesUrl())}">View Leave Request</a></p>
      </div>
    `
  }, `Employee leave ${decision}`);
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
      OR: [
        {
          role: {
            roleName: {
              in: ["Team Lead", "TEAM_LEAD", "TEAM LEAD", "Project Manager"]
            }
          }
        },
        {
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
          },
        }
      ]
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
        OR: [
          {
            role: {
              roleName: {
                in: ["Team Lead", "TEAM_LEAD", "TEAM LEAD", "Project Manager"]
              }
            }
          },
          {
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

const getHRUsers = async () => {
  const where = {
    employmentStatus: "ACTIVE",
    OR: [
      {
        email: "hr@company.com"
      },
      {
        role: {
          roleName: {
            in: [
              "Admin",
              "ADMIN",
              "HR",
              "Human Resources",
              "HUMAN_RESOURCES"
            ]
          }
        }
      }
    ]
  };

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
  reportingToId = Number(reportingToId);

  if (!userId) {
    throw new Error("Invalid user.");
  }

  if (!reportingToId) {
    throw new Error("Reporting To is required.");
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
      department: {
        select: {
          id: true,
          departmentName: true
        }
      }
    }
  });

  if (!requester) {
    throw new Error("Authenticated user not found.");
  }

  const reportingTo = await prisma.user.findUnique({
    where: {
      id: reportingToId
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
    toRoleKey(reportingTo.role) === ROLE_KEYS.TEAM_LEAD ||
    designationName.toLowerCase().includes("team lead") ||
    designationName.toLowerCase().includes("project manager");

  if (!isValidApprover) {
    throw new Error(
      "Reporting To must be a Team Lead or Project Manager."
    );
  }

  let backupEmployee = null;

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
        },
        role: {
          select: {
            id: true,
            roleName: true
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
      toRoleKey(backupEmployee.role) === ROLE_KEYS.TEAM_LEAD ||
      backupDesignation.toLowerCase().includes("team lead") ||
      backupDesignation.toLowerCase().includes("project manager");

    if (isManager) {
      throw new Error(
        "Team Lead or Project Manager cannot be selected as backup employee."
      );
    }
  }

  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      userId,
      reportingToId,
      backupEmployeeId: backupEmployee
        ? backupEmployee.id
        : null,
      type,
      startDate: new Date(`${startDate}T00:00:00`),
      endDate: new Date(`${endDate}T00:00:00`),
      totalDays: Number(totalDays),
      reason: reason || null,
      status: "PENDING",
      currentApprovalLevel: 1,
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

  const hrUsers = await getHRUsers();

  const fallbackHrEmail = (
    process.env.HR_EMAIL || "hr@company.com"
  )
    .trim()
    .toLowerCase();

  const fullLeaveRecipients = [
    reportingTo.email,
    ...hrUsers.map((hr) => hr.email),
    fallbackHrEmail
  ]
    .filter(Boolean)
    .map((email) => email.trim().toLowerCase())
    .filter(
      (email, index, arr) =>
        arr.indexOf(email) === index
    );

  if (fullLeaveRecipients.length > 0) {
    try {
      await mailTransporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: fullLeaveRecipients.join(","),
        subject: `New Leave Request #${leaveRequest.id}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:24px;color:#222">
            <h2>New Leave Request</h2>

            <p>A new leave request has been submitted.</p>

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

            <h3>Reporting To</h3>

            <p>
              ${reportingTo.firstName}
              ${reportingTo.lastName}
              (${reportingTo.designation?.designationName || "Approver"})
            </p>

            <h3>Backup Employee</h3>

            <p>
              ${
                backupEmployee
                  ? `${backupEmployee.firstName} ${backupEmployee.lastName}`
                  : "No backup employee selected."
              }
            </p>

            <hr>

            <p>
              HR must review this request first. The Team Lead will be able to decide
              after HR accepts it. Please log in to the Attendance Management System.
            </p>

            <p>
              <a href="${escapeHtml(portalLeavesUrl())}">Open Leave Requests</a>
            </p>
          </div>
        `
      });

      console.log(
        `Leave request email sent to: ${fullLeaveRecipients.join(", ")}`
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
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
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
  const requests = await prisma.leaveRequest.findMany({
    where: reviewerScopeWhere(user),
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          userCode: true,
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

  return requests.map((request) => withWorkflowMetadata(request, user));
};

const getLeaveRequest = async (id, user) => {
  const request = await prisma.leaveRequest.findFirst({
    where: {
      id: Number(id),
      ...reviewerScopeWhere(user)
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

  return withWorkflowMetadata(request, user);
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
    throw new ApiError(400, "Invalid leave ID or approver ID");
  }

  const updatedLeave = await prisma.$transaction(async (tx) => {
    const leaveRequest = await tx.leaveRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            departmentId: true,
            designationId: true
          }
        }
      }
    });

    if (!leaveRequest) {
      throw new ApiError(404, "Leave request not found");
    }

    if (leaveRequest.status !== "PENDING") {
      throw new ApiError(
        409,
        `Leave request is already ${leaveRequest.status.toLowerCase()}`
      );
    }

    if (!actorCanReviewStage(leaveRequest, user)) {
      const stageLabel = workflowStage(leaveRequest) === "HR_REVIEW"
        ? "HR"
        : "the selected Team Lead";
      throw new ApiError(403, `This request must be reviewed by ${stageLabel}`);
    }

    const approvalLevel = Number(leaveRequest.currentApprovalLevel) === 2 ? 2 : 1;
    const isFinalApproval = approvalLevel === 2;
    const requestUpdate = isFinalApproval
      ? {
          status: "APPROVED",
          currentRefersTo: null
        }
      : {
          currentApprovalLevel: 2,
          currentRefersTo: leaveRequest.reportingToId
        };

    if (!isFinalApproval && !leaveRequest.reportingToId) {
      throw new ApiError(409, "The leave request has no Team Lead assigned");
    }

    const updateResult = await tx.leaveRequest.updateMany({
      where: {
        id,
        status: "PENDING",
        currentApprovalLevel: approvalLevel,
        ...(isFinalApproval ? { currentRefersTo: approverId } : {})
      },
      data: requestUpdate
    });

    if (updateResult.count !== 1) {
      throw new ApiError(409, "This leave request was already reviewed by another user");
    }

    await tx.leaveApproval.create({
      data: {
        leaveRequestId: id,
        refersTo: approverId,
        approvalLevel,
        status: "APPROVED",
        action: "APPROVED",
        decisionNote,
        decidedAt: new Date()
      }
    });

    const updated = await tx.leaveRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            userCode: true,
            departmentId: true,
            designationId: true,
            department: true
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

    if (isFinalApproval) {
      await persistApprovedLeaveAttendance(tx, updated);
    }

    return updated;
  }, {
    timeout: 60000
  });

  if (updatedLeave.status === "APPROVED") {
    await sendEmployeeDecisionEmail(updatedLeave, true, decisionNote);
  } else {
    await sendTeamLeadReviewEmail(updatedLeave);
  }

  return withWorkflowMetadata(updatedLeave, user);
};

const rejectLeave = async (
  leaveId,
  user,
  decisionNote = null
) => {
  const id = Number(leaveId);
  const approverId = Number(user.id);

  if (!id || !approverId) {
    throw new ApiError(400, "Invalid leave ID or approver ID");
  }

  const updatedLeave = await prisma.$transaction(async (tx) => {
    const leaveRequest = await tx.leaveRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            departmentId: true
          }
        }
      }
    });

    if (!leaveRequest) {
      throw new ApiError(404, "Leave request not found");
    }

    if (leaveRequest.status !== "PENDING") {
      throw new ApiError(
        409,
        `Leave request is already ${leaveRequest.status.toLowerCase()}`
      );
    }

    if (!actorCanReviewStage(leaveRequest, user)) {
      const stageLabel = workflowStage(leaveRequest) === "HR_REVIEW"
        ? "HR"
        : "the selected Team Lead";
      throw new ApiError(403, `This request must be reviewed by ${stageLabel}`);
    }

    const approvalLevel = Number(leaveRequest.currentApprovalLevel) === 2 ? 2 : 1;
    const updateResult = await tx.leaveRequest.updateMany({
      where: {
        id,
        status: "PENDING",
        currentApprovalLevel: approvalLevel,
        ...(approvalLevel === 2 ? { currentRefersTo: approverId } : {})
      },
      data: {
        status: "REJECTED",
        currentRefersTo: null
      }
    });

    if (updateResult.count !== 1) {
      throw new ApiError(409, "This leave request was already reviewed by another user");
    }

    await tx.leaveApproval.create({
      data: {
        leaveRequestId: id,
        refersTo: approverId,
        approvalLevel,
        status: "REJECTED",
        action: "REJECTED",
        decisionNote,
        decidedAt: new Date()
      }
    });

    return tx.leaveRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            departmentId: true,
            department: true
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
  });

  await sendEmployeeDecisionEmail(updatedLeave, false, decisionNote);

  return withWorkflowMetadata(updatedLeave, user);
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

module.exports = {
  getLeaveApprovers,
  getBackupEmployees,
  getHRUsers,
  createLeave,
  getLeaveRequests,
  getLeaveRequest,
  getMyLeaves,
  syncApprovedLeaveAttendance,
  approveLeave,
  rejectLeave,
  cancelLeave
};
