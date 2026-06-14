const axios = require("axios");

let powerAutomateAccessToken = null;
let powerAutomateTokenExpiresAt = 0;

const buildTicketPayload = (ticket) => ({
  ticketId: ticket.ticketId,
  userEmail: ticket.userEmail,
  assignedToName: ticket.assignedToName,
  category: ticket.category,
  subCategory: ticket.subCategory,
  country: ticket.country,
  priority: ticket.priority,
  description: ticket.description,
  status: ticket.status,
  department: ticket.department,
});

const getPowerAutomateAccessToken = async () => {
  if (powerAutomateAccessToken && Date.now() < powerAutomateTokenExpiresAt) {
    return powerAutomateAccessToken;
  }

  const tenantId = process.env.MS_TENANT_ID;
  const clientId = process.env.MS_CLIENT_ID;
  const clientSecret = process.env.MS_CLIENT_SECRET;
  const scope =
    process.env.POWER_AUTOMATE_SCOPE ||
    "https://service.flow.microsoft.com/.default";

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error("Microsoft OAuth credentials are not configured");
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
    scope,
  });

  const response = await axios.post(tokenUrl, params.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  powerAutomateAccessToken = response.data.access_token;
  powerAutomateTokenExpiresAt =
    Date.now() + (response.data.expires_in - 300) * 1000;

  return powerAutomateAccessToken;
};

const sendTeamsTicketNotification = async (ticket) => {
  const endpoint = process.env.POWER_AUTOMATE_URL;

  if (!endpoint) {
    console.warn("[Teams] POWER_AUTOMATE_URL is not configured.");
    return;
  }

  try {
    const endpointUrl = new URL(endpoint);
    const headers = {};

    if (!endpointUrl.searchParams.has("sig")) {
      const accessToken = await getPowerAutomateAccessToken();
      headers.Authorization = `Bearer ${accessToken}`;
    }

    await axios.post(endpoint, buildTicketPayload(ticket), {
      headers,
      timeout: 10000,
    });
    console.log(`[Teams] Ticket notification sent: ${ticket.ticketId}`);
  } catch (error) {
    console.error(
      "[Teams] Ticket notification failed:",
      error.response?.data || error.message,
    );
  }
};

module.exports = {
  sendTeamsTicketNotification,
};
