import mongoose from "mongoose";

const aiCaptionHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" }, // optional
  type: { type: String, enum: ["caption","hashtags","emoji","rewrite"], default: "caption" },
  prompt: { type: String, required: true },
  generatedCaption: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("AICaptionHistory", aiCaptionHistorySchema);


// userId → who generated it

// postId → optional, attach to a post

// type → caption / hashtags / emoji / rewrite

// prompt → what user typed

// generatedCaption → actual AI result