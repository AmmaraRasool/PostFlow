import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema(
  {
    // Reference to the User who is an admin
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    // Admin privileges
    privileges: {
      canDeletePost: { type: Boolean, default: true },
      canViewAllPosts: { type: Boolean, default: true },
      canManageUsers: { type: Boolean, default: false },
      canManageMedia: { type: Boolean, default: false }
    },

    // Admin actions log
    actionsLog: [
      {
        postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
        action: { type: String, enum: ["deleted", "warned", "edited"] },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

const Admin = mongoose.model("Admin", AdminSchema);

export default Admin;
