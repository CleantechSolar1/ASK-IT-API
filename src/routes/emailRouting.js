const express = require("express");
const authMiddleware = require("../middlewares/auth");
const checkRole = require("../middlewares/checkRole");
const { successResponse, errorResponse } = require("../middlewares/responseHandler");
const { listEmailRouting, updateEmailRouting } = require("../services/emailRouting");

const router = express.Router();

router.use(authMiddleware, checkRole());

router.get("/", async (req, res) => {
  try {
    return successResponse(res, await listEmailRouting());
  } catch (error) {
    console.error("[Email routing] List failed:", error.message);
    return errorResponse(res, "Could not load email routing.");
  }
});

router.patch("/", async (req, res) => {
  try {
    const { rule, status, message } = await updateEmailRouting(
      req.body?.category,
      req.body?.recipients,
    );
    if (status) return errorResponse(res, message, status);
    return successResponse(res, rule, "Email routing saved.");
  } catch (error) {
    console.error("[Email routing] Update failed:", error.message);
    return errorResponse(res, "Could not save email routing.");
  }
});

module.exports = router;
