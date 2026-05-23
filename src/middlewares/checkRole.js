const { errorResponse } = require("./responseHandler");

/**
 * Middleware: allows access only to admin or subadmin roles.
 * Note: subadmins have their JWT role elevated to "admin" via resolveRole
 * at login time, so checking for "admin" covers both cases.
 */
const checkRole = (...allowedRoles) => {
  // Support both checkRole() with no args (defaults to admin) and checkRole("admin", "subadmin")
  const roles = allowedRoles.length > 0 ? allowedRoles : ["admin"];

  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, "Access denied. Insufficient permissions.", 403);
    }
    next();
  };
};

module.exports = checkRole;
