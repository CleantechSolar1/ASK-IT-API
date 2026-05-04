const Ticket = require("../models/ticket");
const generateTicketId = require("../utils/generateTicketId");
const { sendEmail } = require("../services/email");
const { getRoutingEmail } = require("../utils/emailRouting");
const {
  ticketCreatedTemplate,
  adminNotificationTemplate,
  ticketStatusUpdatedTemplate,
} = require("../utils/emailTemplate");
const User = require("../models/user");
const SubAdmin = require("../models/subAdmin");

// Always-notify admin inbox
const ITSUPPORT_EMAIL =
  process.env.ITSUPPORT_EMAIL || "itsupport@cleantechsolar.com";

const createTicketService = async (payload, userId, organizationId) => {
  const ticketId = generateTicketId();

  const specialistEmail = getRoutingEmail(payload.category, payload.priority);

  let assignedToName = "Unassigned";
  if (specialistEmail) {
    const adminUser = await User.findOne({
      email: specialistEmail.toLowerCase(),
    });
    if (adminUser) {
      assignedToName = adminUser.name;
    } else {
      const subAdmin = await SubAdmin.findOne({
        email: specialistEmail.toLowerCase(),
      });
      if (subAdmin && subAdmin.name) assignedToName = subAdmin.name;
    }
  }

  const ticket = await Ticket.create({
    ticketId,
    userId,
    organizationId,
    userEmail: payload.userEmail,
    category: payload.category,
    subCategory: payload.subCategory || undefined,
    priority: payload.priority,
    description: payload.description,
    department: payload.department,
    country: payload.country,
    assignedToEmail: specialistEmail || ITSUPPORT_EMAIL,
    assignedToName: assignedToName,
  });

  // ── Email 1: Notify itsupport@cleantechsolar.com (always) ──────────────
  try {
    const itsupportHtml = adminNotificationTemplate(ticket);
    await sendEmail(
      ITSUPPORT_EMAIL,
      `[AskIT] New Ticket ${ticket.ticketId} — ${ticket.category} (${ticket.priority})`,
      itsupportHtml,
    );
  } catch (error) {
    console.error("[Ticket] itsupport email failed:", error.message);
  }

  // ── Email 2: Route to specialist based on category + priority ───────────
  try {
    const specialistEmail = getRoutingEmail(ticket.category, ticket.priority);
    if (specialistEmail && specialistEmail !== ITSUPPORT_EMAIL) {
      const specialistHtml = adminNotificationTemplate(ticket);
      await sendEmail(
        specialistEmail,
        `[AskIT] New Ticket ${ticket.ticketId} — ${ticket.category} (${ticket.priority})`,
        specialistHtml,
      );
    }
  } catch (error) {
    console.error("[Ticket] Specialist routing email failed:", error.message);
  }

  return ticket;
};

const getUserTicketsService = async (userId, organizationId) => {
  const tickets = await Ticket.find({ userId, organizationId }).sort({
    createdAt: -1,
  });

  return tickets;
};

const getAllTicketsService = async (organizationId) => {
  const tickets = await Ticket.find({ organizationId })
    .populate("userId", "name email")
    .sort({ createdAt: -1 });

  return tickets;
};

const getTicketsByDateRangeService = async (
  organizationId,
  startDate,
  endDate,
) => {
  const mongoose = require("mongoose");
  const query = {
    organizationId: new mongoose.Types.ObjectId(organizationId),
  };

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      // If it's just a date (like YYYY-MM-DD), set to end of day
      if (endDate.length <= 10) {
        end.setHours(23, 59, 59, 999);
      }
      query.createdAt.$lte = end;
    }
  }

  const tickets = await Ticket.find(query)
    .populate("userId", "name email")
    .sort({ createdAt: -1 });

  return tickets;
};

const updateTicketStatusService = async (ticketId, status, organizationId) => {
  const ticket = await Ticket.findOne({
    _id: ticketId,
    organizationId,
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  ticket.status = status;
  await ticket.save();

  // Notify the user who raised the ticket
  if (ticket.userEmail) {
    try {
      const html = ticketStatusUpdatedTemplate(ticket);
      await sendEmail(
        ticket.userEmail,
        `[AskIT] Ticket ${ticket.ticketId} Status Updated → ${ticket.status}`,
        html,
      );
    } catch (error) {
      console.error("[Ticket] Status update email failed:", error.message);
    }
  }

  return ticket.populate("userId", "name email");
};

const delegateTicketService = async (ticketId, newEmail, organizationId) => {
  const ticket = await Ticket.findOne({
    _id: ticketId,
    organizationId,
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  let assignedToName = "Unknown";
  const adminUser = await User.findOne({ email: newEmail.toLowerCase() });
  if (adminUser) {
    assignedToName = adminUser.name;
  } else {
    const subAdmin = await SubAdmin.findOne({ email: newEmail.toLowerCase() });
    if (subAdmin && subAdmin.name) assignedToName = subAdmin.name;
  }

  ticket.assignedToEmail = newEmail;
  ticket.assignedToName = assignedToName;
  await ticket.save();

  // Send notification to the new assignee
  try {
    const html = adminNotificationTemplate(ticket);
    await sendEmail(
      newEmail,
      `[AskIT] Ticket Delegated to You: ${ticket.ticketId}`,
      html,
    );
  } catch (error) {
    console.error("[Ticket] Delegation email failed:", error.message);
  }

  return ticket.populate("userId", "name email");
};

module.exports = {
  createTicketService,
  getUserTicketsService,
  getAllTicketsService,
  updateTicketStatusService,
  delegateTicketService,
  getTicketsByDateRangeService,
};
