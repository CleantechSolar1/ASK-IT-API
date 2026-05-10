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
    console.error(
      "Error fetching MS Graph access token:",
      error?.response?.data || error.message
    );
    throw new Error("Failed to authenticate with Microsoft Graph");
  }
};

module.exports = { getAccessToken };
