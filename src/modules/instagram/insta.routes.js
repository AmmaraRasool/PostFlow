import express from "express";
import {
  redirectToInstagramAuth,
  instagramCallback,
  getUserPages,
  getInstagramBusinessId,
  createMedia,
  publishMedia,
  publishInstagramPost
} from "./instagramController.js";

const instagramRoutes = express.Router();

// Step 1: User clicks "Connect Instagram"
instagramRoutes.get("/auth", redirectToInstagramAuth);

// Step 2: Meta redirects user back here
instagramRoutes.get("/callback", instagramCallback);

// Step 3: Fetch Facebook pages
instagramRoutes.get("/pages", getUserPages);

// Step 4: Get Instagram Business ID of selected page
instagramRoutes.get("/page/:pageId/instagram", getInstagramBusinessId);

// Step 5: Upload media
instagramRoutes.post("/media", createMedia);

// Step 6: Publish media
instagramRoutes.post("/media/publish", publishMedia);



instagramRoutes.post("/post/test", async (req, res) => {
  const { instaUserId, access_token, media_url, caption } = req.body;

  if (!instaUserId || !access_token || !media_url)
    return res.status(400).json({ error: "Missing fields" });

  try {
    const postId = await publishInstagramPost(
      instaUserId,
      access_token,
      media_url,
      caption
    );

    res.json({ success: true, postId });
  } catch (err) {
    res.status(500).json({ error: "Failed to post" });
  }
});


export default instagramRoutes;