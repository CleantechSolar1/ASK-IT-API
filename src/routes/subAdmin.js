const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth");
const checkRole = require("../middlewares/checkRole");
const { addSubAdmin, listSubAdmins, removeSubAdmin } = require("../controllers/subAdmin");

// All routes require a valid JWT and admin role
router.post("/", authMiddleware, checkRole, addSubAdmin);
router.get("/", authMiddleware, checkRole, listSubAdmins);
router.delete("/:id", authMiddleware, checkRole, removeSubAdmin);

module.exports = router;
