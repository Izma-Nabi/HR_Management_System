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

  const permissions = computed(() => authUser.value?.permissions || []);
  const permissionSet = computed(() =>
    new Set(permissions.value.map(normalizePermission))
  );
  const role = computed(() => authUser.value?.role || null);

  const hasPermission = (permission) => {
    return permissionSet.value.has(normalizePermission(permission));
  };

  const hasAnyPermission = (...requiredPermissions) => {
    return requiredPermissions.some((permission) => hasPermission(permission));
  };

  return {
    authUser,
    role,
    permissions,
    hasPermission,
    hasAnyPermission,
    hydrateAuthUser
  };
};
