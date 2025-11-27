import axios from "axios";
import Post from "../../models/post.model.js";

export const autoPublishFacebookPosts = async () => {
    const now = new Date();

    // Get all scheduled posts for Facebook that should be published now
    const postsToPublish = await Post.find({
        status: "scheduled",
        platforms: "facebook",
        scheduledTime: { $lte: now },
    });

    for (let post of postsToPublish) {
        try {
            const pageId = post.socialAccountId; // Facebook Page ID
            const token = post.accessToken;     // Access token for the page

            if (!token || !pageId) continue;

            // Post media if exists
            if (post.media && post.media.length > 0) {
                for (let media of post.media) {
                    if (media.type === "image") {
                        await axios.post(`https://graph.facebook.com/${pageId}/photos`, {
                            url: media.url,
                            caption: post.caption,
                            published: true,
                            access_token: token,
                        });
                    } else if (media.type === "video") {
                        await axios.post(`https://graph.facebook.com/${pageId}/videos`, {
                            file_url: media.url,
                            description: post.caption,
                            published: true,
                            access_token: token,
                        });
                    }
                }
            } else {
                // Text post
                await axios.post(`https://graph.facebook.com/${pageId}/feed`, {
                    message: post.caption,
                    access_token: token,
                });
            }

            // Mark as published
            post.status = "published";
            post.publishedAt = now;
            await post.save();

            console.log(`✅ Post ${post._id} auto-published to Facebook`);

        } catch (err) {
            console.error(`❌ Error publishing post ${post._id}:`, err.response?.data || err.message);
        }
    }
};
