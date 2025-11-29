import mongoose from "mongoose";

const LinkedinPostSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  imageUrl: { type: String },
  scheduledAt: { type: Date, required: true },
  status: { type: String, enum: ["scheduled", "posting", "posted", "failed"], default: "scheduled" },
  result: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  postedAt: Date
});

export default mongoose.models.LinkedinPost || mongoose.model("LinkedinPost", LinkedinPostSchema);
