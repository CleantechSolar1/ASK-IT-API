const jwt = require("jsonwebtoken");
const { errorResponse } = require("./responseHandler");

const authMiddleware = (req, res, next) => {
  try {
    console.log("Headers: ", req.headers);
    console.log("Cookies: ", req.cookies);
    let token = req.cookies.token; ß

    console.log("++++ token +++++", token)

    // Fallback to Authorization header if no cookie (e.g. for API testing)
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return errorResponse(res, "Authorization token missing", 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    return errorResponse(res, "Invalid token", 401);
  }
};

module.exports = authMiddleware;
