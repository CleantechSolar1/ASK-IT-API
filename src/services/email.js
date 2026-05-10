const axios = require("axios");
require("dotenv").config();

let graphAccessToken = null;
let tokenExpiresAt = 0;

/**
 * Gets a Microsoft Graph access token using client credentials flow.
 */
const getAccessToken = async () => {
  if (graphAccessToken && Date.now() < tokenExpiresAt) {
    return graphAccessToken;
  }

  const tenantId = process.env.MS_TENANT_ID;
  const clientId = process.env.MS_CLIENT_ID;
  const clientSecret = process.env.MS_CLIENT_SECRET;

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const params = new URLSearchParams({
    client_id: clientId,
    scope: "https://graph.microsoft.com/.default",
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  try {
    const response = await axios.post(tokenUrl, params.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    graphAccessToken = response.data.access_token;
    // expire token slightly before it actually expires (expires_in is in seconds)
    tokenExpiresAt = Date.now() + (response.data.expires_in - 300) * 1000;
    return graphAccessToken;
  } catch (error) {
    console.error("Error fetching MS Graph access token:", error?.response?.data || error.message);
    throw new Error("Failed to authenticate with Microsoft Graph");
  }
};

/**
 * Send a transactional email via Microsoft Graph API.
 * Sends email directly from the designated support mailbox.
 *
 * @param {string|string[]} to          - Recipient email(s)
 * @param {string}          subject     - Email subject
 * @param {string}          html        - HTML body
 * @param {string}          [senderName] - Display name for the sender (Note: MS Graph mostly uses the configured mailbox name)
 */
const sendEmail = async (to, subject, html, senderName = "AskIT Support") => {
  const recipients = Array.isArray(to)
    ? to.map((email) => ({ emailAddress: { address: email } }))
    : [{ emailAddress: { address: to } }];

  const senderEmail = process.env.ITSUPPORT_EMAIL || "itsupport@cleantechsolar.com";

  try {
    const token = await getAccessToken();
    const endpoint = `https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`;

    const messagePayload = {
      message: {
        subject: subject,
        body: {
          contentType: "HTML",
          content: html,
        },
        toRecipients: recipients,
      },
      saveToSentItems: "true",
    };

    const response = await axios.post(endpoint, messagePayload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log(
      `[MS Graph] Email sent to ${Array.isArray(to) ? to.join(", ") : to}`
    );
    return response.data;
  } catch (error) {
    const errMsg = error.response?.data?.error?.message || error.message;
    console.error("[MS Graph] Email error:", errMsg);
    throw new Error(errMsg);
  }
};

module.exports = { sendEmail };
