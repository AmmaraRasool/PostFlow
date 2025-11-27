import cron from "node-cron";
import { autoPublishLinkedInPosts } from "../core/services/linkedinPost.service.js";

console.log("⏳ LinkedIn auto-post cron initialized");

cron.schedule("*/1 * * * *", async () => {
  console.log("⏳ Running LinkedIn auto-post cron...");
  await autoPublishLinkedInPosts();
});
