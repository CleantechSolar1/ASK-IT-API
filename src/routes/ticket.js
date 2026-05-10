const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth");
const adminMiddleware = require("../middlewares/checkRole");

const {
  createTicket,
  getMyTickets,
  getAllTickets,
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

router.get("/admin/export", authMiddleware, adminMiddleware, exportTicketsCSV);
router.get("/admin", authMiddleware, adminMiddleware, getAllTickets);

router.patch(
  "/admin/:id/status",
  authMiddleware,
  adminMiddleware,
  updateTicketStatus,
);

router.patch(
  "/admin/:id/delegate",
  authMiddleware,
  adminMiddleware,
  delegateTicket,
);

module.exports = router;
