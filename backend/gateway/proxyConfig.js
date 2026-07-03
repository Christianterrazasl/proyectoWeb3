function rewriteAdminCompaniesPath(path) {
  return `/api/companies${path}`;
}

function rewriteAdminServicesPath(path) {
  return `/api/services${path}`;
}

module.exports = {
  rewriteAdminCompaniesPath,
  rewriteAdminServicesPath,
};
