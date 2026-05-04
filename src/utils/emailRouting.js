/**
 * Email routing matrix based on ticket Category + Priority.
 * Source: AskIT routing table (cleantechsolar.com).
 *
 * Structure:
 *   ROUTING_MAP[category][priority] = recipientEmail
 *
 * Categories (case-insensitive match applied in getRoutingEmail):
 *   	Hardware Issue | Salesforce | SharePoint | Business Central | Application | VPN | System Issue
 *
 * Priorities: High | Medium | Low
 */

const ROUTING_MAP = {
  "hardware issue": {
    high: "satish.malusare@cleantechsolar.com",
    medium: "niraj.raut@cleantechsolar.com",
    low: "jasper.chan@cleantechsolar.com",
  },
  salesforce: {
    high: "sameer.mishra@cleantechsolar.com",
    medium: "nutchaphon.p@cleantechsolar.com",
    low: "nutchaphon.p@cleantechsolar.com",
  },
  sharepoint: {
    high: "satish.malusare@cleantechsolar.com",
    medium: "niraj.raut@cleantechsolar.com",
    low: "jasper.chan@cleantechsolar.com",
  },
  "business central": {
    high: "sameer.mishra@cleantechsolar.com",
    medium: "nutchaphon.p@cleantechsolar.com",
    low: "nutchaphon.p@cleantechsolar.com",
  },
  application: {
    high: "satish.malusare@cleantechsolar.com",
    medium: "niraj.raut@cleantechsolar.com",
    low: "jasper.chan@cleantechsolar.com",
  },
  vpn: {
    high: "satish.malusare@cleantechsolar.com",
    medium: "niraj.raut@cleantechsolar.com",
    low: "jasper.chan@cleantechsolar.com",
  },
  "system issue": {
    high: "satish.malusare@cleantechsolar.com",
    medium: "niraj.raut@cleantechsolar.com",
    low: "jasper.chan@cleantechsolar.com",
  },
  "power bi": {
    high: "sameer.mishra@cleantechsolar.com",
    medium: "nutchaphon.p@cleantechsolar.com",
    low: "nutchaphon.p@cleantechsolar.com",
  },
};

/**
 * Returns the routing email for a given category and priority.
 * @param {string} category  - Ticket category (case-insensitive)
 * @param {string} priority  - Ticket priority: High | Medium | Low | Critical
 * @returns {string|null}    - Email address, or null if no match found
 */
const getRoutingEmail = (category, priority) => {
  if (!category || !priority) return null;

  const cat = category.toLowerCase().trim();
  // Critical is treated as High for routing purposes
  const pri =
    priority.toLowerCase() === "critical"
      ? "high"
      : priority.toLowerCase().trim();

  const categoryMap = ROUTING_MAP[cat];
  if (!categoryMap) {
    console.warn(`[emailRouting] No routing found for category: "${category}"`);
    return null;
  }

  const email = categoryMap[pri];
  if (!email) {
    console.warn(
      `[emailRouting] No routing found for category: "${category}", priority: "${priority}"`,
    );
    return null;
  }

  return email;
};

module.exports = { getRoutingEmail, ROUTING_MAP };
