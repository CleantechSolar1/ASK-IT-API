const {
  createTicketService,
  getUserTicketsService,
  getAllTicketsService,
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

    const { startDate, endDate } = req.query;
    const tickets = await getTicketsByDateRangeService(
      organizationId,
      startDate,
      endDate,
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

const createTicket = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      return errorResponse(
        res,
        "Session invalid. Please log in again.",
        401,
      );
    }
    const ticket = await createTicketService(
      req.body,
      req.user.id,
      organizationId,
    );

    return successResponse(res, ticket, "Ticket created successfully", 201);
  } catch (error) {
    return errorResponse(res, error.message);
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
    );

    return successResponse(res, ticket, "Ticket delegated successfully");
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = {
  createTicket,
  getMyTickets,
  getAllTickets,
  updateTicketStatus,
  delegateTicket,
  exportTicketsCSV,
};
