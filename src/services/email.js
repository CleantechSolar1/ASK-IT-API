const axios = require("axios");
require("dotenv").config();
const { getAccessToken } = require("./microsoftGraph");

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
