const axios = require("axios");
require("dotenv").config();

/**
 * Send a transactional email via Brevo REST API v3.
 * Uses axios directly — no SDK version compatibility issues.
 *
 * @param {string|string[]} to          - Recipient email(s)
 * @param {string}          subject     - Email subject
 * @param {string}          html        - HTML body
 * @param {string}          [senderName] - Display name for the sender
 */
const sendEmail = async (to, subject, html, senderName = "AskIT Support") => {
  const recipients = Array.isArray(to)
    ? to.map((email) => ({ email }))
    : [{ email: to }];

  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: senderName,
          email: process.env.EMAIL_FROM || "itsupport@cleantechsolar.com",
        },
        to: recipients,
        subject,
        htmlContent: html,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );

    console.log(
      `[Brevo] Email sent to ${Array.isArray(to) ? to.join(", ") : to} | MsgId: ${response.data?.messageId || "N/A"}`,
    );
    return response.data;
  } catch (error) {
    const errMsg = error.response?.data?.message || error.message;
    console.error("[Brevo] Email error:", errMsg);
    throw new Error(errMsg);
  }
};

module.exports = { sendEmail };
