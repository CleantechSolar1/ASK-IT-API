const {
  createTicketService,
  getTicketByIdService,
  getUserTicketsService,
  getAllTicketsService,
  addTicketCommentService,
  updateTicketStatusService,
  delegateTicketService,
  getTicketsByDateRangeService,
} = require("../services/ticket");

const {
  successResponse,
  errorResponse,
} = require("../middlewares/responseHandler");

const exportTicketsCSV = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      return errorResponse(res, "Session invalid. Please log in again.", 401);
    }

    const { startDate, endDate, status, priority, department, assignedTo } = req.query;

    // Parse comma-separated multiselect values from the query string
    const filters = {
      status: status ? status.split(",").map((s) => s.trim()).filter(Boolean) : [],
      priority: priority ? priority.split(",").map((p) => p.trim()).filter(Boolean) : [],
      department: department ? department.split(",").map((d) => d.trim()).filter(Boolean) : [],
      assignedTo: assignedTo ? assignedTo.split(",").map((a) => a.trim()).filter(Boolean) : [],
    };

    const tickets = await getTicketsByDateRangeService(
      organizationId,
      startDate,
      endDate,
      filters,
    );

    // Define CSV headers
    const headers = [
      "Ticket ID",
      "Created At",
      "Raised By",
      "User Email",
      "Category",
      "Sub Category",
      "Priority",
      "Department",
      "Country",
      "Status",
      "Last Action By",
      "Last Action At",
      "Assigned To",
      "Assigned To Email",
      "Description",
    ];

    // Map tickets to CSV rows
    const rows = tickets.map((t) => [
      t.ticketId,
      t.createdAt ? new Date(t.createdAt).toLocaleString() : "",
      t.userId?.name || "Unknown",
      t.userEmail || "",
      t.category || "",
      t.subCategory || "",
      t.priority || "",
      t.department || "",
      t.country || "",
      t.status || "",
      t.lastActionBy?.name || "",
      t.lastActionBy?.at ? new Date(t.lastActionBy.at).toLocaleString() : "",
      t.assignedToName || "",
      t.assignedToEmail || "",
      t.description || "",
    ]);

    // Build CSV string with proper escaping
    const escapeCSV = (str) => {
      if (str === null || str === undefined) return '""';
      const stringified = String(str);
      // Escape double quotes by doubling them and wrap in double quotes
      return `"${stringified.replace(/"/g, '""')}"`;
    };

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((r) => r.map(escapeCSV).join(",")),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=tickets_export_${new Date().toISOString().split("T")[0]}.csv`,
    );

    return res.status(200).send(csvContent);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const axios = require("axios");
const { getAccessToken } = require("../services/microsoftGraph");

const createTicket = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      return errorResponse(res, "Session invalid. Please log in again.", 401);
    }

    // Prepare files for OneDrive if any exist
    const uploadedAttachments = [];
    if (req.files && req.files.length > 0) {
      try {
        const token = await getAccessToken();
        const senderEmail = process.env.ITSUPPORT_EMAIL || "itsupport@cleantechsolar.com";
        // Create a unique folder for this request, assuming ticketId isn't fully generated yet
        // Wait, ticketId is generated inside createTicketService!
        // We should let the service handle the upload, or pass the files to the service.
        // Let's pass the files to the service!
      } catch(e) {
        // Will refactor this to pass files to service instead
      }
    }

    const ticket = await createTicketService(
      req.body,
      req.user.id,
      organizationId,
      req.files, // Pass files to service
      req.user.role,
    );

    return successResponse(res, ticket, "Ticket created successfully", 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const getAttachment = async (req, res) => {
  try {
    const { driveItemId } = req.params;
    const token = await getAccessToken();
    const senderEmail = process.env.ITSUPPORT_EMAIL || "itsupport@cleantechsolar.com";

    // Microsoft Graph endpoint to get file content stream
    const endpoint = `https://graph.microsoft.com/v1.0/users/${senderEmail}/drive/items/${driveItemId}/content`;

    const response = await axios({
      method: 'GET',
      url: endpoint,
      headers: {
        Authorization: `Bearer ${token}`
      },
      responseType: 'stream'
    });

    // Pipe the stream from Microsoft Graph directly to the client
    response.data.pipe(res);
  } catch (error) {
    console.error("[Graph] Attachment fetch error:", error.message);
    res.status(404).send("Image not found or access denied");
  }
};

const getTicketById = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      return errorResponse(res, "Session invalid. Please log in again.", 401);
    }

    const ticket = await getTicketByIdService(req.params.id, req.user);

    return successResponse(res, ticket);
  } catch (error) {
    const statusCode = error.message === "Ticket not found" ? 404 : 500;
    return errorResponse(res, error.message, statusCode);
  }
};

const getMyTickets = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      return errorResponse(
        res,
        "Session invalid. Please log in again.",
        401,
      );
    }
    const tickets = await getUserTicketsService(req.user.id, organizationId);

    return successResponse(res, tickets);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const addTicketComment = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      return errorResponse(res, "Session invalid. Please log in again.", 401);
    }

    const ticket = await addTicketCommentService(
      req.params.id,
      organizationId,
      req.user.id,
      req.body.comment || req.body.message,
    );

    return successResponse(res, ticket, "Comment added successfully", 201);
  } catch (error) {
    const statusCode =
      error.message === "Ticket not found"
        ? 404
        : error.message === "Comment is required"
          ? 400
          : 500;
    return errorResponse(res, error.message, statusCode);
  }
};

const getAllTickets = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      return errorResponse(
        res,
        "Session invalid. Please log in again.",
        401,
      );
    }
    const tickets = await getAllTicketsService(organizationId);

    return successResponse(res, tickets);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const updateTicketStatus = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      return errorResponse(
        res,
        "Session invalid. Please log in again.",
        401,
      );
    }
    const ticket = await updateTicketStatusService(
      req.params.id,
      req.body.status,
      organizationId,
      req.user.id,
    );

    return successResponse(res, ticket, "Ticket status updated");
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const delegateTicket = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      return errorResponse(
        res,
        "Session invalid. Please log in again.",
        401,
      );
    }
    const { email } = req.body;
    if (!email) {
       return errorResponse(res, "Email is required to delegate ticket.", 400);
    }
    const ticket = await delegateTicketService(
      req.params.id,
      email,
      organizationId,
      req.user.id,
    );

    return successResponse(res, ticket, "Ticket delegated successfully");
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = {
  createTicket,
  getTicketById,
  getMyTickets,
  getAllTickets,
  addTicketComment,
  updateTicketStatus,
  delegateTicket,
  exportTicketsCSV,
  getAttachment,
};
