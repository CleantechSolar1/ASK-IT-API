const EmailRouting = require("../models/emailRouting");
const { DEFAULT_RECIPIENTS } = require("../utils/emailRouting");
const { getCategoriesService, normalizeCategoryName } = require("./issueCategory");

const PRIORITIES = ["low", "medium", "high"];
const DEFAULT_ROUTES = new Map(
  Object.entries(DEFAULT_RECIPIENTS).map(([category, recipients]) => [
    category.toLowerCase(),
    { category, recipients },
  ]),
);
const EMAIL_PATTERN = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i;

const getCategoryKey = (category) =>
  typeof category === "string"
    ? normalizeCategoryName(category).trim().toLowerCase()
    : "";

const getRoutingCategories = async () => {
  const categories = new Map(
    [...DEFAULT_ROUTES].map(([key, route]) => [key, route.category]),
  );
  for (const { name } of await getCategoriesService()) {
    const key = getCategoryKey(name);
    if (key && !categories.has(key)) categories.set(key, name.trim());
  }
  return categories;
};

const getRecipient = (key, priority, savedRecipients) => {
  if (Object.hasOwn(savedRecipients ?? {}, priority)) return savedRecipients[priority];
  return DEFAULT_ROUTES.get(key)?.recipients[priority] ?? null;
};

const toRoutingRule = (key, category, savedRecipients) => ({
  key,
  category,
  recipients: Object.fromEntries(
    PRIORITIES.map((priority) => [priority, getRecipient(key, priority, savedRecipients)]),
  ),
});

const listEmailRouting = async () => {
  const categories = await getRoutingCategories();
  const rules = await EmailRouting.find({ _id: { $in: [...categories.keys()] } }).lean();
  const savedByKey = new Map(rules.map(({ _id, recipients }) => [_id, recipients]));
  return [...categories]
    .map(([key, category]) => toRoutingRule(key, category, savedByKey.get(key)))
    .sort((first, second) => first.category.localeCompare(second.category));
};

const updateEmailRouting = async (category, recipients) => {
  const entries = recipients && typeof recipients === "object" && !Array.isArray(recipients)
    ? Object.entries(recipients)
    : [];
  if (!entries.length || entries.some(([priority]) => !PRIORITIES.includes(priority))) {
    return { status: 400, message: "Provide a recipient for Low, Medium, or High priority." };
  }

  const changes = {};
  for (const [priority, value] of entries) {
    const email = typeof value === "string" ? value.trim() : value;
    if (email !== null && email !== "" && (
      typeof email !== "string" || email.length > 254 || email.indexOf("@") > 64 ||
      !EMAIL_PATTERN.test(email)
    )) {
      return { status: 400, message: `Enter one valid email address for ${priority} priority.` };
    }
    // A saved null means IT Support only. An absent priority uses its initial recipient.
    changes[`recipients.${priority}`] = email || null;
  }

  const key = getCategoryKey(category);
  const categories = await getRoutingCategories();
  if (!categories.has(key)) {
    return { status: 404, message: "Ticket category not found." };
  }

  const rule = await EmailRouting.findOneAndUpdate(
    { _id: key },
    { $set: changes },
    { upsert: true, returnDocument: "after", runValidators: true },
  ).lean();
  return { rule: toRoutingRule(key, categories.get(key), rule.recipients) };
};

const getRoutingEmail = async (category, priority) => {
  const key = getCategoryKey(category);
  const normalized = typeof priority === "string" ? priority.trim().toLowerCase() : "";
  const routingPriority = normalized === "critical" ? "high" : normalized;
  if (!key || !PRIORITIES.includes(routingPriority)) return null;

  const rule = await EmailRouting.findById(key).lean();
  return getRecipient(key, routingPriority, rule?.recipients);
};

module.exports = { listEmailRouting, updateEmailRouting, getRoutingEmail };
