// src/models/user.model.js
import mongoose from "mongoose";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    userName: { type: String, required: true },
    userEmail: { type: String, required: true, unique: true, lowercase: true },
    userPassword: { type: String, required: true },
    userRole: { type: String, enum: ["admin", "user"], default: "user" },

    // Email verification
    userIsVerified: { type: Boolean, default: false },
    userVerificationToken: { type: String, default: null },
    userVerificationTokenExpiry: { type: Date, default: null },

    // Reset password
    userPasswordResetToken: { type: String, default: null },
    userPasswordExpirationDate: { type: Date, default: null },

    // Refresh Token
    userRefreshToken: { type: String, default: null },

    // LinkedIn OAuth fields
    linkedinId: { type: String, default: null },
    linkedinAccessToken: { type: String, default: null },
    linkedinRefreshToken: { type: String, default: null },
    linkedinExpiresAt: { type: Date, default: null },
    linkedinProfile: {
      firstName: String,
      lastName: String,
      profilePicture: String,
      headline: String,
    },

    // === Facebook fields (added) ===
    // Store the Page ID the user connected (optional per-user)
    facebookPageId: { type: String, default: null },
    // Store the Page Access Token (long-lived) for posting
    facebookPageAccessToken: { type: String, default: null },

    // Optionally store multiple pages (array) if you want later
    facebookPages: [
      {
        pageId: String,
        pageName: String,
        accessToken: String,
      },
    ],
    // =================================
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("userPassword")) return next();
  this.userPassword = await bcrypt.hash(this.userPassword, 10);
  next();
});

// Compare password
userSchema.methods.isPasswordCorrect = async function (password) {
  return bcrypt.compare(password, this.userPassword);
};

// Generate temporary token
userSchema.methods.generateTemporaryToken = function () {
  const unHashedToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(unHashedToken).digest("hex");
  const tokenExpiry = Date.now() + 30 * 60 * 1000;
  return { unHashedToken, hashedToken, tokenExpiry };
};

// Access token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });
};

// Refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

// Hash token
userSchema.methods.hashToken = function (token) {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// FINAL FIXED EXPORT
export default mongoose.models.User || mongoose.model("User", userSchema);
