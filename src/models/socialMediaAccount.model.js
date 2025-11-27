import mongoose from "mongoose";

const socialAccountSchema = new mongoose.Schema(
  {
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

    // Page or Business Account info
    accountId: {
      type: String, // Facebook Page ID / Instagram Business ID / LinkedIn Page ID
      required: true,
    },

    accountName: {
      type: String, // Page or Business name
      required: true,
    },

    profileImage: {
      type: String, // URL
    },

    // OAuth tokens
    accessToken: {
      type: String,
      required: true,
    },

    refreshToken: {
      type: String,
    },

    tokenExpiresAt: {
      type: Date, // when token expires
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const SocialAccount = mongoose.model(
  "SocialAccount",
  socialAccountSchema
);
