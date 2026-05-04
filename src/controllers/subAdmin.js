const SubAdmin = require("../models/subAdmin");
const { successResponse, errorResponse } = require("../middlewares/responseHandler");

const MAX_SUB_ADMINS = 6;

/**
 * POST /sub-admins
 * Add a new sub-admin email (admin-only). Max 6 allowed.
 */
const addSubAdmin = async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return errorResponse(res, "Email is required", 400);
    }

    // Enforce max limit
    const count = await SubAdmin.countDocuments();
    if (count >= MAX_SUB_ADMINS) {
      return errorResponse(
        res,
        `Maximum of ${MAX_SUB_ADMINS} sub-admins allowed. Remove one before adding another.`,
        400,
      );
    }

    // Check duplicate
    const existing = await SubAdmin.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return errorResponse(res, "This email is already a sub-admin.", 409);
    }

    const subAdmin = await SubAdmin.create({
      email: email.toLowerCase().trim(),
      name: name || undefined,
      addedBy: req.user.id,
    });

    return successResponse(res, subAdmin, "Sub-admin added successfully", 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

/**
 * GET /sub-admins
 * List all sub-admins (admin-only).
 */
const listSubAdmins = async (req, res) => {
  try {
    const subAdmins = await SubAdmin.find()
      .populate("addedBy", "name email")
      .sort({ createdAt: -1 });

    return successResponse(res, subAdmins);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

/**
 * DELETE /sub-admins/:id
 * Remove a sub-admin by document ID (admin-only).
 */
const removeSubAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const subAdmin = await SubAdmin.findByIdAndDelete(id);
    if (!subAdmin) {
      return errorResponse(res, "Sub-admin not found", 404);
    }

    return successResponse(res, { id }, "Sub-admin removed successfully");
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = { addSubAdmin, listSubAdmins, removeSubAdmin };
