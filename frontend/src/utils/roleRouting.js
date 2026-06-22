// Las utilidades de rol aceptan /me crudo, estado normalizado o user suelto.
// Así login y guards comparten la misma resolución sin duplicar ifs.

export function getUserGlobalRole(source) {
  const role =
    source?.global_role ??
    source?.user?.global_role ??
    source?.raw?.user?.global_role ??
    null;

  return typeof role === "string" ? role : null;
}

export function isAdminRole(source) {
  const role = getUserGlobalRole(source);
  return role === "admin";
}

export function getDefaultRouteForUser(source) {
  // Una sola fuente de verdad evita que login y guards diverjan al redirigir.
  return isAdminRole(source) ? "/admin" : "/proveedor";
}
