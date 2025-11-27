import axios from "axios";
import LinkedinPost from "../../models/LinkedinPost.model.js";

export const autoPublishLinkedInPosts = async () => {
  const now = new Date();
  const postsToPublish = await LinkedinPost.find({
    status: "scheduled",
    scheduleAt: { $lte: now }
  }).limit(20).populate("userId");

  for (let post of postsToPublish) {
    try {
      const user = post.userId;
      if (!user?.linkedinAccessToken) {
        post.status = "failed";
        post.result = { error: "LinkedIn not connected" };
        await post.save();
        continue;
      }

      const body = {
        author: `urn:li:person:${user._id}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: post.text },
            shareMediaCategory: post.mediaUrl ? "IMAGE" : "NONE",
            media: post.mediaUrl
              ? [{ status: "READY", description: { text: post.text }, media: post.mediaUrl, title: { text: "Image" } }]
              : []
          }
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" }
      };

      const resp = await axios.post(
        "https://api.linkedin.com/v2/ugcPosts",
        body,
        {
          headers: {
            Authorization: `Bearer ${user.linkedinAccessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0"
          }
        }
      );

      post.status = "posted";
      post.postedAt = new Date();
      post.result = resp.data;
      await post.save();

      console.log(`✅ Post ${post._id} auto-published`);
    } catch (err) {
      post.status = "failed";
      post.result = { error: err.response?.data || err.message };
      await post.save();
      console.error(`❌ Error posting ${post._id}`, err.message);
    }
  }
};
