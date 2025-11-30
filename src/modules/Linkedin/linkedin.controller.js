import axios from "axios";
import { asyncHandler } from "../../core/utils/async-handler.js";
import User from "../../models/user.model.js";
import LinkedinPost from "../../models/linkedinPost.model.js";
import { autoPublishLinkedInPosts } from "../../core/services/linkedinPost.service.js";

export const connectLinkedIn = asyncHandler(async (req, res) => {
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

  const scope = encodeURIComponent("r_liteprofile r_emailaddress w_member_social");

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}`;

  res.redirect(authUrl);
});

export const linkedinCallback = asyncHandler(async (req, res) => {
  const { code } = req.query;

  const tokenUrl = "https://www.linkedin.com/oauth/v2/accessToken";

  const response = await axios.post(
    tokenUrl,
    null,
    {
      params: {
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      },
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );

  const { access_token, expires_in } = response.data;

  const profile = await axios.get("https://api.linkedin.com/v2/me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  await User.findByIdAndUpdate(req.user._id, {
    linkedinAccessToken: access_token,
    linkedinExpiresAt: Date.now() + expires_in * 1000,
    linkedinId: profile.data.id,
  });

  res.redirect(process.env.CLIENT_URL + "/linkedin/success");
});

export const schedulePost = asyncHandler(async (req, res) => {
  const { text, imageUrl, scheduledAt } = req.body;

  await LinkedinPost.create({
    user: req.user._id,
    text,
    imageUrl,
    scheduledAt,
    status: "scheduled",
  });

  res.json({ success: true, message: "Post scheduled successfully!" });
});

export const runLinkedInAutoPost = asyncHandler(async (req, res) => {
  await autoPublishLinkedInPosts();
  res.json({ success: true, message: "Cron executed manually!" });
});
