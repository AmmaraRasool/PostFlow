import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema({
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    scheduledTime: {
        type: Date,
        required: true,
    },
    platform: {
        type: String,
        enum: ["linkedin", "facebook", "instagram", "tiktok", "twitter"],
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending",
    },
}, {
    timestamps: true,
});

const Schedule = mongoose.model("Schedule", scheduleSchema);

export default Schedule;
