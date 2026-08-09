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

  const permissions = computed(() => authUser.value?.permissions || []);
  const permissionSet = computed(() =>
    new Set(permissions.value.map(normalizePermission))
  );
  const role = computed(() => {
    const storedRole = authUser.value?.role;

    return storedRole?.roleName || storedRole || authUser.value?.roleName || null;
  });
  const roleKey = computed(() => normalizeRole(role.value));
  const isSuperAdmin = computed(() => roleKey.value === "SUPER_ADMIN");

  const hasPermission = (permission) => {
    return isSuperAdmin.value || permissionSet.value.has(normalizePermission(permission));
  };

  const hasAnyPermission = (...requiredPermissions) => {
    return requiredPermissions.some((permission) => hasPermission(permission));
  };

  return {
    authUser,
    role,
    roleKey,
    isSuperAdmin,
    permissions,
    hasPermission,
    hasAnyPermission,
    hydrateAuthUser
  };
};
