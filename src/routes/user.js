const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth");
const checkRole = require("../middlewares/checkRole");
const { getUsersByOrg, toggleUserStatus } = require("../controllers/user");

// Both admin and subadmin (who carry role="admin" in JWT) can access these routes
router.get("/", authMiddleware, checkRole(), getUsersByOrg);
router.patch("/:id/toggle-status", authMiddleware, checkRole(), toggleUserStatus);

module.exports = router;
