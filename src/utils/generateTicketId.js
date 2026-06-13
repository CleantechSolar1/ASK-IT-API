const Counter = require("../models/counter");
const Ticket = require("../models/ticket");

const COUNTER_ID = "ticketId";
const TICKET_ID_PREFIX = "TCK-CSE";
const TICKET_ID_PATTERN = /^TCK-CSE-(\d+)$/;

const getCurrentMaxTicketSequence = async () => {
  const tickets = await Ticket.find({
    ticketId: { $regex: TICKET_ID_PATTERN },
  })
    .select("ticketId")
    .lean();

  return tickets.reduce((max, ticket) => {
    const match = ticket.ticketId && ticket.ticketId.match(TICKET_ID_PATTERN);
    if (!match) return max;
    return Math.max(max, Number(match[1]));
  }, 0);
};

const ensureCounterInitialized = async () => {
  const existingCounter = await Counter.exists({ _id: COUNTER_ID });
  if (existingCounter) return;

  const currentMaxSequence = await getCurrentMaxTicketSequence();

  try {
    await Counter.create({
      _id: COUNTER_ID,
      seq: currentMaxSequence,
    });
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }
  }
};

const generateTicketId = async () => {
  await ensureCounterInitialized();

  const counter = await Counter.findOneAndUpdate(
    { _id: COUNTER_ID },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );

  return `${TICKET_ID_PREFIX}-${String(counter.seq).padStart(3, "0")}`;
};

module.exports = generateTicketId;
