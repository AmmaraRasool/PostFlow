const mongoose = require("mongoose");

const MediaSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    enum: ["image", "video"],
    required: true,
  },
  size: {
    type: Number, // in KB or MB (store as number, e.g., 1024 for 1MB)
    required: true,
  },
  width: {
    type: Number, // in pixels
  },
  height: {
    type: Number, // in pixels
  }
}, {
  timestamps: true // automatically adds createdAt & updatedAt
});

module.exports = mongoose.model("Media", MediaSchema);
