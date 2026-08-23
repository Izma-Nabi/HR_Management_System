export const useAuthUser = () => {
  const authUser = useState("auth.user", () => null);

  const hydrateAuthUser = () => {
    if (!process.client || authUser.value) {
      return;
    }

    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return;
    }

    try {
      authUser.value = JSON.parse(storedUser);
    } catch {
      localStorage.removeItem("user");
    }
  };

  hydrateAuthUser();

  const normalizePermission = (permission) => {
    return String(permission || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
  };

  const normalizeRole = (roleName) => {
    return String(roleName || "").trim().toUpperCase().replace(/\s+/g, "_");
  };

  const storedPermissions = computed(() => authUser.value?.permissions || []);
  const role = computed(() => {
    const storedRole = authUser.value?.role;

    return storedRole?.roleName || storedRole || authUser.value?.roleName || null;
  });
  const roleKey = computed(() => normalizeRole(role.value));
  const designationKey = computed(() =>
    String(
      authUser.value?.designation?.designationName ||
      authUser.value?.designation ||
      ""
    ).trim().toLowerCase()
  );
  const isSuperAdmin = computed(() => roleKey.value === "SUPER_ADMIN");
  const isAdmin = computed(() => roleKey.value === "ADMIN");
  const isHr = computed(() =>
    ["HR", "HUMAN_RESOURCES"].includes(roleKey.value) ||
    designationKey.value === "hr" ||
    designationKey.value.startsWith("hr ") ||
    designationKey.value.includes("human resources")
  );
  const isTeamLead = computed(() =>
    ["TEAM_LEAD", "PROJECT_MANAGER"].includes(roleKey.value) ||
    designationKey.value.includes("team lead") ||
    designationKey.value.includes("project manager")
  );
  const permissions = computed(() => {
    const effective = new Set(storedPermissions.value.map(normalizePermission));

    if (isTeamLead.value) {
      [
        "CREATE_LEAVE",
        "VIEW_OWN_LEAVES",
        "CANCEL_LEAVE",
        "VIEW_OWN_ATTENDANCE",
        "VIEW_TEAM_LEAVES",
        "LIST_LEAVE_REQUESTS",
        "ACCEPT_LEAVE_REQUEST",
        "REJECT_LEAVE_REQUEST"
      ].forEach((permission) => effective.add(permission));
    }

    if (isHr.value) {
      [
        "CREATE_LEAVE",
        "VIEW_OWN_LEAVES",
        "CANCEL_LEAVE",
        "VIEW_OWN_ATTENDANCE",
        "VIEW_ALL_LEAVES",
        "LIST_LEAVE_REQUESTS",
        "ACCEPT_LEAVE_REQUEST",
        "REJECT_LEAVE_REQUEST"
      ].forEach((permission) => effective.add(permission));
    }

    return Array.from(effective).sort();
  });
  const permissionSet = computed(() => new Set(permissions.value));

  const hasPermission = (permission) => {
    return isSuperAdmin.value || permissionSet.value.has(normalizePermission(permission));
  };

  const hasAnyPermission = (...requiredPermissions) => {
    return requiredPermissions.some((permission) => hasPermission(permission));
  };

  const isLeaveReviewer = computed(() =>
    isSuperAdmin.value ||
    isAdmin.value ||
    isHr.value ||
    isTeamLead.value ||
    hasAnyPermission(
      "LIST_LEAVE_REQUESTS",
      "VIEW_ALL_LEAVES",
      "VIEW_TEAM_LEAVES"
    )
  );

  return {
    authUser,
    role,
    roleKey,
    designationKey,
    isSuperAdmin,
    isAdmin,
    isHr,
    isTeamLead,
    isLeaveReviewer,
    permissions,
    hasPermission,
    hasAnyPermission,
    hydrateAuthUser
  };
};
