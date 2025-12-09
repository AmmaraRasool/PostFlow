import cron from "node-cron";
import Post from "../../models/post.model.js";
import User from "../../models/user.model.js";
import linkedinService from "../../core/services/linkedinPost.service.js";

cron.schedule("* * * * *", async () => {
  console.log("🔄 LinkedIn Cron Running...");

  const now = new Date();

  const posts = await Post.find({
    status: "scheduled",
    platforms: "linkedin",
    scheduledTime: { $lte: now },
  });

  for (const post of posts) {
    try {
      const user = await User.findById(post.userId);
      if (!user || !user.linkedinAccessToken) {
        console.log("❌ No LinkedIn access token found for user");
        continue;
      }

      // Upload first media only for LinkedIn
      const media = post.media[0];

      const result = await linkedinService.publishLinkedInPost({
        accessToken: user.linkedinAccessToken,
        caption: post.caption,
        authorURN: `urn:li:person:${user.linkedinId}`,
        mediaUrl: media?.url || null,
        mediaType: media ? media.type : null,
      });

      post.status = "posted";
      post.publishedAt = new Date();
      post.platformPostId = result.postId;
      await post.save();

      console.log(`✅ LinkedIn post published: ${result.postId}`);
    } catch (err) {
      console.log("❌ LinkedIn cron error:", err.response?.data || err);
      post.status = "failed";
      await post.save();
    }
  }
});
