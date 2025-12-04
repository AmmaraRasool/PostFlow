// src/modules/Facebook/facebookAutoPost.cron.js
import cron from "node-cron";
import { autoPublishFacebookPosts } from "../../core/services/facebookPost.service.js";

cron.schedule("*/1 * * * *", async () => {
  console.log("⏳ Running Facebook Auto Post Cron...");
  try {
    await autoPublishFacebookPosts();
  } catch (err) {
    console.error("Error in Facebook auto post cron:", err);
  }
});

console.log("Facebook AutoPost Cron Loaded");
