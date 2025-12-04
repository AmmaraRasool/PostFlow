// src/core/services/linkedinPost.service.js
import axios from "axios";
import User from "../../models/user.model.js";
import LinkedinPost from "../../models/linkedinPost.model.js";

export const autoPublishLinkedInPosts = async () => {
  const posts = await LinkedinPost.find({
    status: "scheduled",
    scheduledAt: { $lte: new Date() },
  }).populate("user");

  for (let post of posts) {
    try {
      const user = post.user;

      if (!user.linkedinAccessToken) {
        continue;
      }

      let mediaUrn = null;

      // Upload image if exists
      if (post.imageUrl) {
        const register = await axios.post(
          "https://api.linkedin.com/rest/assets?action=registerUpload",
          {
            registerUploadRequest: {
              owner: `urn:li:person:${user.linkedinId}`,
              recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
              serviceRelationships: [
                {
                  identifier: "urn:li:userGeneratedContent",
                  relationshipType: "OWNER",
                },
              ],
            },
          },
          {
            headers: {
              Authorization: `Bearer ${user.linkedinAccessToken}`,
              "Content-Type": "application/json",
              "X-Restli-Protocol-Version": "2.0.0",
            },
          }
        );

        const uploadUrl =
          register.data.value.uploadMechanism[
            "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
          ].uploadUrl;

        mediaUrn = register.data.value.asset;

        const image = await axios.get(post.imageUrl, {
          responseType: "arraybuffer",
        });

        await axios.put(uploadUrl, image.data, {
          headers: { "Content-Type": "image/jpeg" },
        });
      }

      // Create LinkedIn Post
      await axios.post(
        "https://api.linkedin.com/rest/posts",
        {
          author: `urn:li:person:${user.linkedinId}`,
          commentary: post.text,
          visibility: "PUBLIC",
          distribution: { feedDistribution: "MAIN_FEED" },
          content: mediaUrn
            ? { media: { title: "Image", id: mediaUrn } }
            : null,
        },
        {
          headers: {
            Authorization: `Bearer ${user.linkedinAccessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
          },
        }
      );

      post.status = "posted";
      await post.save();
    } catch (err) {
      console.log("LinkedIn autopost error:", err.response?.data || err);
      post.status = "failed";
      await post.save();
    }
  }
};
