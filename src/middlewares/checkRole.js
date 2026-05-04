const { errorResponse } = require("./responseHandler");

const checkRole = (req, res, next) => {
  if (req.user.role !== "admin") {
    return errorResponse(res, "Access denied. Admin only.", 403);
  }

  next();
};

module.exports = checkRole;
