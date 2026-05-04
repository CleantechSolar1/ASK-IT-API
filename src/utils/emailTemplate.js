/**
 * Branded HTML email templates for AskIT Help Desk.
 * All templates share the same colour palette and layout.
 */

/* ─── Shared Layout ──────────────────────────────────────────────────────── */

const wrapper = (bodyContent) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AskIT Help Desk</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4f8; color: #1a202c; }
    .container { max-width: 620px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 28px 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
    .header p { color: #bfdbfe; font-size: 13px; margin-top: 4px; }
    .body { padding: 32px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; letter-spacing: 0.3px; }
    .badge-high     { background: #fee2e2; color: #b91c1c; }
    .badge-critical { background: #fce7f3; color: #9d174d; }
    .badge-medium   { background: #fef9c3; color: #854d0e; }
    .badge-low      { background: #dcfce7; color: #166534; }
    .badge-received    { background: #dbeafe; color: #1e40af; }
    .badge-inprogress  { background: #fef9c3; color: #854d0e; }
    .badge-completed   { background: #dcfce7; color: #166534; }
    .info-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    .info-table td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .info-table td:first-child { width: 38%; color: #64748b; font-weight: 600; }
    .desc-box { background: #f8fafc; border-left: 4px solid #2563eb; border-radius: 6px; padding: 14px 16px; margin-top: 20px; font-size: 14px; line-height: 1.6; color: #334155; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; padding: 20px 32px; font-size: 12px; color: #94a3b8; }
    .footer a { color: #2563eb; text-decoration: none; }
    .cta { display: inline-block; margin-top: 24px; padding: 12px 28px; background: linear-gradient(135deg, #1e3a8a, #2563eb); color: #ffffff !important; border-radius: 8px; font-weight: 600; font-size: 14px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎫 AskIT Help Desk</h1>
      <p>CleanTech Solar — IT Support</p>
    </div>
    <div class="body">
      ${bodyContent}
    </div>
    <div class="footer">
      <p>This is an automated message from <strong>AskIT Help Desk</strong>. Please do not reply directly to this email.</p>
      <p style="margin-top:6px;">© ${new Date().getFullYear()} CleanTech Solar. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

const priorityBadge = (priority = "") => {
  const map = { high: "badge-high", critical: "badge-critical", medium: "badge-medium", low: "badge-low" };
  const cls = map[priority.toLowerCase()] || "badge-low";
  return `<span class="badge ${cls}">${priority}</span>`;
};

const statusBadge = (status = "") => {
  const map = { "received": "badge-received", "in progress": "badge-inprogress", "completed": "badge-completed" };
  const cls = map[status.toLowerCase()] || "badge-received";
  return `<span class="badge ${cls}">${status}</span>`;
};

/* ─── Template 1: New Ticket — User Confirmation ─────────────────────────── */

const ticketCreatedTemplate = (ticket) =>
  wrapper(`
    <h2 style="font-size:18px; color:#1e3a8a; margin-bottom:4px;">New Support Ticket Created</h2>
    <p style="color:#64748b; font-size:13px;">Your request has been received and our team will get back to you shortly.</p>

    <table class="info-table">
      <tr><td>Ticket ID</td><td><strong>${ticket.ticketId}</strong></td></tr>
      <tr><td>Category</td><td>${ticket.category || "—"}</td></tr>
      ${ticket.subCategory ? `<tr><td>Sub-Category</td><td>${ticket.subCategory}</td></tr>` : ""}
      <tr><td>Priority</td><td>${priorityBadge(ticket.priority)}</td></tr>
      <tr><td>Status</td><td>${statusBadge(ticket.status)}</td></tr>
      <tr><td>Submitted</td><td>${new Date(ticket.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td></tr>
    </table>

    <div class="desc-box">
      <strong>Description:</strong><br/>${ticket.description || "No description provided."}
    </div>

    <p style="margin-top:24px; font-size:14px; color:#475569;">
      You will receive an update once the status of your ticket changes. Thank you for your patience.
    </p>
  `);

/* ─── Template 2: Admin / Specialist Notification ─────────────────────────── */

const adminNotificationTemplate = (ticket) =>
  wrapper(`
    <h2 style="font-size:18px; color:#1e3a8a; margin-bottom:4px;">⚠️ New Ticket Assigned to You</h2>
    <p style="color:#64748b; font-size:13px;">A new support ticket has been raised and routed to you based on category and priority.</p>

    <table class="info-table">
      <tr><td>Ticket ID</td><td><strong>${ticket.ticketId}</strong></td></tr>
      <tr><td>Raised By</td><td>${ticket.userEmail || "—"}</td></tr>
      <tr><td>Category</td><td>${ticket.category || "—"}</td></tr>
      ${ticket.subCategory ? `<tr><td>Sub-Category</td><td>${ticket.subCategory}</td></tr>` : ""}
      <tr><td>Priority</td><td>${priorityBadge(ticket.priority)}</td></tr>
      <tr><td>Status</td><td>${statusBadge(ticket.status)}</td></tr>
      <tr><td>Created</td><td>${new Date(ticket.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td></tr>
    </table>

    <div class="desc-box">
      <strong>Issue Description:</strong><br/>${ticket.description || "No description provided."}
    </div>

    <p style="margin-top:24px; font-size:14px; color:#475569;">
      Please log in to the <strong>AskIT Admin Dashboard</strong> to review and update the ticket status.
    </p>
  `);

/* ─── Template 3: Status Update — User Notification ─────────────────────── */

const ticketStatusUpdatedTemplate = (ticket) =>
  wrapper(`
    <h2 style="font-size:18px; color:#1e3a8a; margin-bottom:4px;">Ticket Status Updated</h2>
    <p style="color:#64748b; font-size:13px;">There has been an update to your support ticket.</p>

    <table class="info-table">
      <tr><td>Ticket ID</td><td><strong>${ticket.ticketId}</strong></td></tr>
      <tr><td>Category</td><td>${ticket.category || "—"}</td></tr>
      ${ticket.subCategory ? `<tr><td>Sub-Category</td><td>${ticket.subCategory}</td></tr>` : ""}
      <tr><td>Priority</td><td>${priorityBadge(ticket.priority)}</td></tr>
      <tr><td>New Status</td><td>${statusBadge(ticket.status)}</td></tr>
      <tr><td>Updated</td><td>${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td></tr>
    </table>

    <p style="margin-top:24px; font-size:14px; color:#475569;">
      Our team is actively working on your request. You will be notified again when the status changes.
      Thank you for your patience.
    </p>
  `);

module.exports = {
  ticketCreatedTemplate,
  adminNotificationTemplate,
  ticketStatusUpdatedTemplate,
};
