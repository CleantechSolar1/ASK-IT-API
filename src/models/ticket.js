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

const ticketActionBySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    action: {
      type: String,
      enum: ["commented", "status_updated", "delegated"],
    },
    at: {
      type: Date,
    },
  },
  { _id: false },
);

const ticketActionLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ["commented", "status_updated", "delegated"],
      required: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actorName: {
      type: String,
      required: true,
      trim: true,
    },
    actorEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    fromStatus: {
      type: String,
    },
    toStatus: {
      type: String,
    },
    delegatedFromEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    delegatedFromName: {
      type: String,
      trim: true,
    },
    delegatedToEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    delegatedToName: {
      type: String,
      trim: true,
    },
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
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
      enum: ["Low", "Medium", "High", "Alletech"],
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

    lastActionBy: {
      type: ticketActionBySchema,
      default: null,
    },

    actionLogs: {
      type: [ticketActionLogSchema],
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Ticket", ticketSchema);
