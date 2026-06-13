const mongoose = require("mongoose");

const ticketCommentSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    authorEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    authorRole: {
      type: String,
      enum: ["admin", "subadmin"],
      required: true,
    },
  },
  { timestamps: true },
);

const ticketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
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

    attachments: [
      {
        name: String,
        driveItemId: String,
        mimeType: String,
      },
    ],

    comments: {
      type: [ticketCommentSchema],
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Ticket", ticketSchema);
