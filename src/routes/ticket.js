const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth");
const adminMiddleware = require("../middlewares/checkRole");

const {
  createTicket,
  getTicketById,
  getMyTickets,
  getAllTickets,
  addTicketComment,
  updateTicketStatus,
  delegateTicket,
  exportTicketsCSV,
  getAttachment,
} = require("../controllers/ticket");

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", authMiddleware, upload.array("attachments", 5), createTicket);
router.get("/attachment/:driveItemId", authMiddleware, getAttachment);

router.get("/my", authMiddleware, getMyTickets);

router.get("/admin/export", authMiddleware, adminMiddleware(), exportTicketsCSV);
router.get("/admin", authMiddleware, adminMiddleware(), getAllTickets);
router.post("/admin/:id/comments", authMiddleware, adminMiddleware(), addTicketComment);

router.patch(
  "/admin/:id/status",
  authMiddleware,
  adminMiddleware(),
  updateTicketStatus,
);

router.patch(
  "/admin/:id/delegate",
  authMiddleware,
  adminMiddleware(),
  delegateTicket,
);

router.get("/:id", authMiddleware, getTicketById);

module.exports = router;
