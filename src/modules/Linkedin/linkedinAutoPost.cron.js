import cron from "node-cron";
import { autoPublishLinkedInPosts } from "../../core/services/linkedinPost.service.js";

// Run every minute
cron.schedule("*/1 * * * *", async () => {
  console.log("⏳ Running unified Post Auto Cron...");
  try {
    // LinkedIn autopost
    await autoPublishLinkedInPosts();

    // TODO: call autoPublishFacebookPosts();
    // TODO: call autoPublishInstagramPosts();

  } catch (err) {
    console.error("Error in post auto cron:", err);
  }
});
