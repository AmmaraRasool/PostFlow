// src/modules/Facebook/facebook.controller.js
import axios from "axios";
import dotenv from "dotenv";
import User from "../../models/user.model.js";

dotenv.config();

const {
  FB_APP_ID,
  FB_APP_SECRET,
  FB_REDIRECT_URI, // e.g. http://localhost:8000/api/facebook/callback
} = process.env;

/**
 * Step 1: Redirect user to Facebook login for pages permissions
 */
export const facebookAuthRedirect = (req, res) => {
  if (!FB_APP_ID || !FB_REDIRECT_URI) {
    return res.status(500).json({ error: "Facebook app env not configured." });
  }

  const scope = [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_metadata",
    "pages_manage_posts",

  ].join(",");

  const redirectUrl = `https://www.facebook.com/v17.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(
    FB_REDIRECT_URI
  )}&scope=${encodeURIComponent(scope)}&response_type=code`;

  return res.json({
    message: "Open this URL to authorize Facebook Pages access",
    auth_url: redirectUrl,
  });
};

/**
 * Step 2: Callback - exchange code for user token, exchange for long-lived token,
 * then call /me/accounts to get page access token(s), and store for the user.
 *
 * This endpoint expects authenticated user (req.user) — adjust if your flow differs.
 */
export const facebookCallback = async (req, res) => {
  try {
    const { code } = req.query;
    const userId = req.user?._id; // requires your auth middleware to add req.user

    if (!code) return res.status(400).json({ error: "Missing code" });
    if (!userId) return res.status(401).json({ error: "User must be logged in" });

    // 1. Exchange code -> short-lived user token
    const tokenRes = await axios.get("https://graph.facebook.com/v17.0/oauth/access_token", {
      params: {
        client_id: FB_APP_ID,
        redirect_uri: FB_REDIRECT_URI,
        client_secret: FB_APP_SECRET,
        code,
      },
    });

    const shortLivedUserToken = tokenRes.data.access_token;

    // 2. Exchange short-lived user token -> long-lived user token
    const exchangeRes = await axios.get("https://graph.facebook.com/v17.0/oauth/access_token", {
      params: {
        grant_type: "fb_exchange_token",
        client_id: FB_APP_ID,
        client_secret: FB_APP_SECRET,
        fb_exchange_token: shortLivedUserToken,
      },
    });

    const longLivedUserToken = exchangeRes.data.access_token;

    // 3. Get pages the user manages (and their page tokens)
    const pagesRes = await axios.get("https://graph.facebook.com/v17.0/me/accounts", {
      params: { access_token: longLivedUserToken },
    });

    const pages = pagesRes.data?.data || [];

    if (!pages.length) {
      return res.status(400).json({ error: "No Pages found on this account" });
    }

    // For simplicity we save the first page. You can extend to choose a page on client side.
    const primaryPage = pages[0];
    const pageId = primaryPage.id;
    const pageAccessToken = primaryPage.access_token;

    // Save to user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.facebookPageId = pageId;
    user.facebookPageAccessToken = pageAccessToken;

    // Optionally save list of pages
    user.facebookPages = pages.map((p) => ({
      pageId: p.id,
      pageName: p.name,
      accessToken: p.access_token,
    }));

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Facebook Page connected and token saved.",
      pageId,
    });
  } catch (err) {
    console.error("Facebook callback error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Facebook callback failed", details: err.response?.data || err.message });
  }
};

/**
 * Manual test post endpoint (optional) — post immediately using either provided pageId/token or saved user page.
 * Body: { message, imageUrl, pageId?, accessToken? }
 */
export const facebookManualPost = async (req, res) => {
  try {
    const { message, imageUrl, pageId: bodyPageId, accessToken: bodyToken } = req.body;
    const userId = req.user?._id;

    if (!message) return res.status(400).json({ error: "message is required" });

    // priority: body overrides -> user's saved -> env fallback
    const user = userId ? await User.findById(userId) : null;
    const pageId = bodyPageId || user?.facebookPageId || process.env.FB_PAGE_ID;
    const token = bodyToken || user?.facebookPageAccessToken || process.env.FB_PAGE_ACCESS_TOKEN;

    if (!pageId || !token) return res.status(400).json({ error: "Missing pageId or accessToken" });

    let response;
    if (imageUrl) {
      response = await axios.post(`https://graph.facebook.com/v17.0/${pageId}/photos`, null, {
        params: { url: imageUrl, caption: message, access_token: token },
      });
    } else {
      response = await axios.post(`https://graph.facebook.com/v17.0/${pageId}/feed`, null, {
        params: { message, access_token: token },
      });
    }

    return res.status(200).json({ success: true, data: response.data });
  } catch (err) {
    console.error("Facebook manual post error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Facebook manual post failed", details: err.response?.data || err.message });
  }
};
