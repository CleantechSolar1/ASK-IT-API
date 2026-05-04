const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    userEmail: {
      type: String,
    },

    assignedToEmail: {
      type: String,
    },

    assignedToName: {
      type: String,
    },

    category: {
      type: String,
    },

    subCategory: {
      type: String,
    },

    country: {
      type: String,
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
    },

    description: {
      type: String,
    },

    status: {
      type: String,
      enum: ["Received", "In Progress", "Pending", "Completed"],
      default: "Received",
    },

    department: {
      type: String,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Ticket", ticketSchema);
