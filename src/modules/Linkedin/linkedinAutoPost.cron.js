import cron from "node-cron";
import { autoPublishLinkedInPosts } from "../../core/services/linkedinPost.service.js";

cron.schedule("*/1 * * * *", async () => {
  console.log("⏳ Running LinkedIn Auto Post Cron...");
  await autoPublishLinkedInPosts();
});
