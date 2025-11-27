import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    platform: {
      type: String,
      enum: ["facebook", "instagram", "linkedin"],
      required: true,
    },

    // Engagement metrics
    impressions: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    comments: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },

    // Posting result
    publishStatus: {
      type: String,
      enum: ["scheduled", "posted", "failed"],
      default: "scheduled",
    },

    errorMessage: {
      type: String,
      default: null,
    },

    postedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const Analytics = mongoose.model("Analytics", analyticsSchema);
