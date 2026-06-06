export function isAdminRole(globalRole) {
  return typeof globalRole === "string" && globalRole.toLowerCase().includes("admin");
}

export function getDefaultRouteForUser(user) {
  return isAdminRole(user?.global_role) ? "/admin" : "/proveedor";
}
