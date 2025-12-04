// src/core/services/facebookPost.service.js
import axios from "axios";
import Post from "../../models/post.model.js";
import User from "../../models/user.model.js";

/**
 * Auto publish Facebook posts:
 * - Finds scheduled posts that include 'facebook' in platforms,
 *   autoPost true, status scheduled, scheduledTime <= now
 * - For each post finds pageId + accessToken from (in order):
 *    1) per-post override (post.socialAccountId or post.accessToken)
 *    2) user's saved facebookPageId / facebookPageAccessToken
 *    3) process.env fallback FB_PAGE_ID / FB_PAGE_ACCESS_TOKEN
 *
 * - Supports image posts (first media item) or text-only posts.
 */
export const autoPublishFacebookPosts = async () => {
  const posts = await Post.find({
    status: "scheduled",
    autoPost: true,
    platforms: { $in: ["facebook", "Facebook"] },
    scheduledTime: { $lte: new Date() },
  }).populate("userId");

  for (let post of posts) {
    try {
      const user = post.userId;

      // Resolve pageId & token
      const perPostPageId = post.socialAccountId || null; // optional override
      const perPostToken = post.accessToken || null; // optional override (from post doc)

      const userPageId = user?.facebookPageId || null;
      const userPageToken = user?.facebookPageAccessToken || null;

      const pageId = perPostPageId || userPageId || process.env.FB_PAGE_ID;
      const pageToken = perPostToken || userPageToken || process.env.FB_PAGE_ACCESS_TOKEN;

      if (!pageId || !pageToken) {
        console.log("Facebook autopost skipped: missing pageId or pageToken for post:", post._id);
        post.status = "failed";
        await post.save();
        continue;
      }

      // Build message and image
      const message = post.caption || post.text || "";
      // Use first media item (if exists)
      const mediaItem = Array.isArray(post.media) && post.media.length ? post.media[0] : null;
      const imageUrl = mediaItem?.url || null;

      let res;
      if (imageUrl) {
        // Post image to Page (photos endpoint)
        res = await axios.post(
          `https://graph.facebook.com/v17.0/${pageId}/photos`,
          null,
          {
            params: {
              url: imageUrl,
              caption: message,
              access_token: pageToken,
            },
          }
        );

        // Facebook returns id of photo post (post id)
        const fbId = res.data?.id;
        if (fbId) {
          // Save platformPostIds map
          post.platformPostIds = post.platformPostIds || {};
          post.platformPostIds.set("facebook", fbId.toString());
        }
      } else {
        // Text-only post
        res = await axios.post(
          `https://graph.facebook.com/v17.0/${pageId}/feed`,
          null,
          {
            params: {
              message,
              access_token: pageToken,
            },
          }
        );

        const fbId = res.data?.id;
        if (fbId) {
          post.platformPostIds = post.platformPostIds || {};
          post.platformPostIds.set("facebook", fbId.toString());
        }
      }

      post.status = "posted";
      post.publishedAt = new Date();
      await post.save();
      console.log("Facebook autopost success for post:", post._id, "fbResponse:", res.data);
    } catch (err) {
      console.error("Facebook autopost error for post:", post._id, err.response?.data || err.message || err);
      post.status = "failed";
      await post.save();
    }
  }
};
