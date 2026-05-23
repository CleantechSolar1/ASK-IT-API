const User = require("../models/user");
const SubAdmin = require("../models/subAdmin");
const { successResponse, errorResponse } = require("../middlewares/responseHandler");

/**
 * GET /users
 * Returns all users belonging to the same organization as the requester.
 * Accessible by admin / subadmin only.
 */
const getUsersByOrg = async (req, res) => {
  try {
    const { organizationId } = req.user;

    if (!organizationId) {
      return errorResponse(res, "Organization context missing from token", 400);
    }

    const users = await User.find({ organizationId })
      .select("-password -microsoftId")
      .sort({ createdAt: -1 });

    // Enrich each user with whether they are a subadmin
    const subAdmins = await SubAdmin.find().select("email");
    const subAdminEmails = new Set(subAdmins.map((s) => s.email.toLowerCase()));

    const enriched = users.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: subAdminEmails.has(u.email.toLowerCase()) ? "subadmin" : u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
    }));

    return successResponse(res, enriched);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

/**
 * PATCH /users/:id/toggle-status
 * Toggles the isActive flag for a user.
 * Accessible by admin / subadmin only.
 * Admins cannot deactivate themselves.
 */
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const requesterId = req.user.id;

    if (id === requesterId) {
      return errorResponse(res, "You cannot deactivate your own account.", 400);
    }

    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    // Ensure the target user belongs to the same organization
    if (user.organizationId.toString() !== req.user.organizationId) {
      return errorResponse(res, "Access denied. User is outside your organization.", 403);
    }

    user.isActive = !user.isActive;
    await user.save();

    const status = user.isActive ? "activated" : "deactivated";
    return successResponse(
      res,
      { _id: user._id, isActive: user.isActive },
      `User ${status} successfully`,
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = { getUsersByOrg, toggleUserStatus };
