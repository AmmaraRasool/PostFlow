import mongoose from "mongoose";

const LinkedinPostSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  mediaUrl: { type: String },
  scheduleAt: { type: Date, required: true },
  status: { type: String, enum: ["scheduled","posting","posted","failed"], default: "scheduled" },
  result: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  postedAt: Date
});

export default mongoose.model("LinkedinPost", LinkedinPostSchema);
