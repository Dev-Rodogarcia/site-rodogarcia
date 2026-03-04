function buildStaffLoginRedirect(pathname, search = '') {
  const next = encodeURIComponent(`${pathname}${search || ''}`);
  return `/auth/entrar.html?area=staff&next=${next}`;
}

function requireDeveloperPageSession(params) {
  const {
    req,
    res,
    pathname,
    search,
    getAuthContext,
    redirectResponse
  } = params;

  const authContext = getAuthContext(req);
  if (authContext) {
    return authContext;
  }

  const destination = buildStaffLoginRedirect(pathname, search);
  redirectResponse(res, 302, destination);
  return null;
}

function requireDeveloperApiSession(params) {
  const { req, res, requireAuth } = params;
  return requireAuth(req, res);
}

module.exports = {
  buildStaffLoginRedirect,
  requireDeveloperPageSession,
  requireDeveloperApiSession
};
