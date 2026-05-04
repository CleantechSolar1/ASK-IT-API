const {
  signupService,
  loginService,
  microsoftAuthService,
  teamsSSOService,
} = require("../services/auth");
const {
  successResponse,
  errorResponse,
} = require("../middlewares/responseHandler");

// Helper to set cookie
const setTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // true in prod (requires HTTPS)
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // 'none' for cross-site in prod
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });
};

const signup = async (req, res) => {
  try {
    const data = await signupService(req.body);
    setTokenCookie(res, data.token);
    return successResponse(res, { user: data.user }, "User registered successfully", 200);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

const login = async (req, res) => {
  try {
    const data = await loginService(req.body);
    setTokenCookie(res, data.token);
    return successResponse(res, { user: data.user }, "Login successful");
  } catch (error) {
    return errorResponse(res, error.message, 401);
  }
};

const microsoftLogin = async (req, res) => {
  try {
    const clientId = process.env.MS_CLIENT_ID;
    const tenantId = process.env.MS_TENANT_ID || "common";
    const redirectUri =
      process.env.MS_REDIRECT_URI ||
      "http://localhost:5000/auth/microsoft/callback";

    const scope = "User.Read Organization.Read.All openid profile email";

    const loginUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&response_mode=query&scope=${encodeURIComponent(scope)}`;

    res.redirect(loginUrl);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

const microsoftCallback = async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      const frontendBaseUrl =
        process.env.FRONTEND_URL || "http://localhost:8080";
      return res.redirect(
        `${frontendBaseUrl}/auth/microsoft/callback?error=Authorization+code+not+provided`,
      );
    }

    const data = await microsoftAuthService(code);
    const { token, user } = data;

    const encodedUser = encodeURIComponent(JSON.stringify(user));
    const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:8080";

    setTokenCookie(res, token);
    const frontendUrl = `${frontendBaseUrl}/auth/microsoft/callback?user=${encodedUser}`;
    return res.redirect(frontendUrl);
  } catch (error) {
    const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:8080";
    return res.redirect(
      `${frontendBaseUrl}/auth/microsoft/callback?error=${encodeURIComponent(error.message)}`,
    );
  }
};

const teamsSSO = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return errorResponse(res, "Teams token not provided", 400);
    }

    const data = await teamsSSOService(token);
    setTokenCookie(res, data.token);
    return successResponse(res, { user: data.user }, "Teams SSO successful");
  } catch (error) {
    return errorResponse(res, error.message, 401);
  }
};

const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  return successResponse(res, null, "Logged out successfully");
};

const getMe = async (req, res) => {
  try {
    // req.user is populated by authMiddleware
    // We just need to return the user info. 
    // Ideally fetch fresh from DB, but token data is fine for basic check.
    const User = require("../models/user");
    const user = await User.findById(req.user.id).populate("organizationId", "name");
    
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }
    
    const { resolveRole } = require("../services/auth"); // Assuming this is exported or we can just use req.user.role if it's already resolved in middleware
    
    return successResponse(res, {
      user: {
        email: user.email,
        name: user.name,
        organizationId: user.organizationId._id,
        organizationName: user.organizationId.name,
        role: req.user.role, // from token
      }
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = {
  signup,
  login,
  microsoftLogin,
  microsoftCallback,
  teamsSSO,
  logout,
  getMe,
};
