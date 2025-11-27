import cron from "node-cron";
import { autoPublishFacebookPosts } from "../core/services/facebookPost.service.js";

// Runs every minute
cron.schedule("* * * * *", async () => {
    console.log("⏳ Running Facebook auto-post cron...");
    await autoPublishFacebookPosts();
});
