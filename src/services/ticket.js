const Ticket = require("../models/ticket");
const generateTicketId = require("../utils/generateTicketId");
const { sendEmail } = require("../services/email");
const { getRoutingEmail } = require("../utils/emailRouting");
const mongoose = require("mongoose");
const {
  ticketCreatedTemplate,
  adminNotificationTemplate,
  ticketStatusUpdatedTemplate,
} = require("../utils/emailTemplate");
const { sendTeamsTicketNotification } = require("./teamsNotification");
const User = require("../models/user");
const SubAdmin = require("../models/subAdmin");

// Always-notify admin inbox
const ITSUPPORT_EMAIL =
  process.env.ITSUPPORT_EMAIL || "itsupport@cleantechsolar.com";

const getTicketActor = async (actorId) => {
  if (!actorId) return null;

  const actor = await User.findById(actorId).select("name email");
  if (!actor) {
    throw new Error("Action user not found");
  }

  return {
    userId: actor._id,
    name: actor.name,
    email: actor.email,
  };
};

const recordTicketAction = (ticket, actor, action, details = {}) => {
  const actionAt = new Date();

  ticket.lastActionBy = {
    userId: actor.userId,
    name: actor.name,
    email: actor.email,
    action,
    at: actionAt,
  };

  ticket.actionLogs.push({
    action,
    actorId: actor.userId,
    actorName: actor.name,
    actorEmail: actor.email,
    ...details,
    createdAt: actionAt,
    updatedAt: actionAt,
  });
};

const createTicketService = async (payload, userId, organizationId, files = null) => {
  const ticketId = await generateTicketId();

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

  const ticketData = {
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
  };

  // Upload attachments to OneDrive
  if (files && files.length > 0) {
    const { getAccessToken } = require("./microsoftGraph");
    const axios = require("axios");
    try {
      const token = await getAccessToken();
      const senderEmail = process.env.ITSUPPORT_EMAIL || "itsupport@cleantechsolar.com";
      const attachments = [];

      for (const file of files) {
        try {
          const endpoint = `https://graph.microsoft.com/v1.0/users/${senderEmail}/drive/root:/ticket-attachments/${ticketId}/${encodeURIComponent(file.originalname)}:/content`;
          const uploadRes = await axios.put(endpoint, file.buffer, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": file.mimetype,
            },
          });
          attachments.push({
            name: file.originalname,
            driveItemId: uploadRes.data.id,
            mimeType: file.mimetype,
          });
        } catch (err) {
          console.error(`Failed to upload ${file.originalname}:`, err.response?.data || err.message);
        }
      }
      ticketData.attachments = attachments;
    } catch (tokenErr) {
      console.error("Failed to get token for OneDrive upload:", tokenErr.message);
    }
  }

  const ticket = await Ticket.create(ticketData);

  // Notify Teams channel via Power Automate without blocking ticket creation.
  await sendTeamsTicketNotification(ticket);

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

  // ── Email 3: Acknowledge the user who created the ticket ────────────
  if (ticket.userEmail) {
    try {
      const userHtml = ticketCreatedTemplate(ticket);
      await sendEmail(
        ticket.userEmail,
        `[AskIT] Ticket Received ${ticket.ticketId} — ${ticket.category}`,
        userHtml,
      );
    } catch (error) {
      console.error("[Ticket] User acknowledgment email failed:", error.message);
    }
  }

  return ticket;
};

const getTicketByIdService = async (ticketId, requester) => {
  if (!mongoose.isValidObjectId(ticketId)) {
    throw new Error("Ticket not found");
  }

  const query = {
    _id: ticketId,
    organizationId: requester.organizationId,
  };

  if (requester.role !== "admin") {
    query.userId = requester.id;
  }

  const ticketQuery = Ticket.findOne(query).populate("userId", "name email");
  if (requester.role !== "admin") {
    ticketQuery.select("-actionLogs");
  }

  const ticket = await ticketQuery;

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  return ticket;
};

const getUserTicketsService = async (userId, organizationId) => {
  const tickets = await Ticket.find({ userId, organizationId })
    .select("-actionLogs")
    .sort({
      createdAt: -1,
    });

  return tickets;
};

const addTicketCommentService = async (
  ticketId,
  organizationId,
  authorId,
  message,
) => {
  const trimmedMessage = typeof message === "string" ? message.trim() : "";

  if (!trimmedMessage) {
    throw new Error("Comment is required");
  }

  if (!mongoose.isValidObjectId(ticketId)) {
    throw new Error("Ticket not found");
  }

  const ticket = await Ticket.findOne({
    _id: ticketId,
    organizationId,
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  const author = await User.findById(authorId).select("name email role");
  if (!author) {
    throw new Error("Comment author not found");
  }

  const subAdmin = await SubAdmin.findOne({
    email: author.email.toLowerCase(),
  });

  const comment = ticket.comments.create({
    message: trimmedMessage,
    authorId: author._id,
    authorName: author.name,
    authorEmail: author.email,
    authorRole: subAdmin ? "subadmin" : "admin",
  });

  ticket.comments.push(comment);
  recordTicketAction(
    ticket,
    {
      userId: author._id,
      name: author.name,
      email: author.email,
    },
    "commented",
    { commentId: comment._id },
  );

  await ticket.save();

  return ticket.populate("userId", "name email");
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
  filters = {},
) => {
  const mongoose = require("mongoose");
  const query = {
    organizationId: new mongoose.Types.ObjectId(organizationId),
  };

  // Date range
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

  // Multi-select status filter
  // "Open" is a virtual value meaning any status that is NOT "Completed"
  if (filters.status && filters.status.length > 0) {
    const hasOpen = filters.status.includes("Open");
    const explicitStatuses = filters.status.filter((s) => s !== "Open");

    if (hasOpen && explicitStatuses.length > 0) {
      // Open OR explicit statuses
      query.$or = [
        { status: { $ne: "Completed" } },
        { status: { $in: explicitStatuses } },
      ];
    } else if (hasOpen) {
      query.status = { $ne: "Completed" };
    } else {
      query.status = { $in: explicitStatuses };
    }
  }

  // Multi-select priority filter
  if (filters.priority && filters.priority.length > 0) {
    query.priority = { $in: filters.priority };
  }

  // Multi-select department filter
  if (filters.department && filters.department.length > 0) {
    query.department = { $in: filters.department };
  }

  // Multi-select assignedTo filter
  if (filters.assignedTo && filters.assignedTo.length > 0) {
    query.assignedToEmail = { $in: filters.assignedTo };
  }

  const tickets = await Ticket.find(query)
    .populate("userId", "name email")
    .sort({ createdAt: -1 });

  return tickets;
};

const updateTicketStatusService = async (
  ticketId,
  status,
  organizationId,
  actorId,
) => {
  const ticket = await Ticket.findOne({
    _id: ticketId,
    organizationId,
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  const previousStatus = ticket.status;
  const actor = await getTicketActor(actorId);

  ticket.status = status;
  recordTicketAction(ticket, actor, "status_updated", {
    fromStatus: previousStatus,
    toStatus: status,
  });
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

const delegateTicketService = async (
  ticketId,
  newEmail,
  organizationId,
  actorId,
) => {
  const ticket = await Ticket.findOne({
    _id: ticketId,
    organizationId,
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  const previousAssigneeEmail = ticket.assignedToEmail;
  const previousAssigneeName = ticket.assignedToName;
  const actor = await getTicketActor(actorId);
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
  recordTicketAction(ticket, actor, "delegated", {
    delegatedFromEmail: previousAssigneeEmail,
    delegatedFromName: previousAssigneeName,
    delegatedToEmail: newEmail,
    delegatedToName: assignedToName,
  });
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
  getTicketByIdService,
  getUserTicketsService,
  getAllTicketsService,
  addTicketCommentService,
  updateTicketStatusService,
  delegateTicketService,
  getTicketsByDateRangeService,
};
