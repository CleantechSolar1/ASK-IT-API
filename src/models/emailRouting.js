const mongoose = require("mongoose");

const emailRoutingSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    recipients: {
      low: String,
      medium: String,
      high: String,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("EmailRouting", emailRoutingSchema);
