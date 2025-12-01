import axios from "axios";
import dotenv from "dotenv";

dotenv.config(); 

const {
  LINKEDIN_CLIENT_ID,
  LINKEDIN_CLIENT_SECRET,
  LINKEDIN_REDIRECT_URI,
} = process.env;

/* -----------------------------------------------------------
    STEP 1: Initiate Authorization Flow (Use in Browser/Postman)
----------------------------------------------------------- */
/* -----------------------------------------------------------
    STEP 1: Initiate Authorization Flow (CORRECTED SCOPES)
----------------------------------------------------------- */
export const linkedinAuthRedirect = (req, res) => {
  if (!LINKEDIN_CLIENT_ID || !LINKEDIN_REDIRECT_URI) {
    return res.status(500).json({ error: "LinkedIn environment variables are not set." });
  }

  // CORRECTED SCOPE: Use 'profile' instead of 'r_liteprofile'
  const SCOPE_STRING = "profile%20w_member_social%20openid%20email"; 
  
  const redirectURL =
    "https://www.linkedin.com/oauth/v2/authorization?" +
    `response_type=code&client_id=${LINKEDIN_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(LINKEDIN_REDIRECT_URI)}` +
    `&scope=${SCOPE_STRING}`; // Use the corrected string

  return res.json({
    message: "Open this URL in your web browser to authorize:",
    auth_url: redirectURL,
  });
};

/* -----------------------------------------------------------
    STEP 2 & 3: Callback to Exchange Code for Token and URN
----------------------------------------------------------- */
export const linkedinCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      // LinkedIn returns 'error' or 'error_description' on failure
      return res.status(400).json({ 
        error: "Missing authorization code or LinkedIn denied access.",
        details: req.query.error_description || req.query.error
      });
    }

    // 2. Exchange code for access token
    const tokenRes = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      null, 
      {
        params: {
          grant_type: "authorization_code",
          code,
          redirect_uri: LINKEDIN_REDIRECT_URI,
          client_id: LINKEDIN_CLIENT_ID,
          client_secret: LINKEDIN_CLIENT_SECRET,
        },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const accessToken = tokenRes.data.access_token;

    // 3. Fetch User Info (ID) to get the required 'author' URN
    const profileRes = await axios.get(
      "https://api.linkedin.com/v2/userinfo", 
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const memberId = profileRes.data.sub;
    const memberURN = `urn:li:person:${memberId}`; 

    // Success response for Postman with all required posting data
    return res.status(200).json({
      success: true,
      message: "Authorization successful. Use the token and URN below for posting.",
      access_token: accessToken,
      member_urn: memberURN,
      expires_in: tokenRes.data.expires_in,
    });

  } catch (err) {
    console.error("LinkedIn Callback Error:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      error: "Failed to process authorization code.",
      details: err.response?.data || err.message,
    });
  }
};

/* -----------------------------------------------------------
    STEP 4: Create Post on LinkedIn
----------------------------------------------------------- */
export const linkedinPost = async (req, res) => {
  try {
    // Requires access_token, text, and author URN in the request body
    const { access_token, text, author } = req.body; 

    if (!access_token || !text || !author)
      return res.status(400).json({
        success: false,
        error: "Missing required fields: access_token, text, or author (member URN)",
      });

    // The UGC Post API Request
    const postRes = await axios.post(
      "https://api.linkedin.com/v2/ugcPosts",
      {
        author: author, // e.g., "urn:li:person:X-Y-Z"
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text },
            shareMediaCategory: "NONE", // For text-only posts
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      },
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );

    return res.status(201).json({
      success: true,
      message: "Post published successfully!",
      postId: postRes.headers['x-linkedin-id'] 
    });
  } catch (err) {
    console.error("LinkedIn Post Error:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      error: "Failed to publish post to LinkedIn.",
      details: err.response?.data || err.message,
    });
  }
};


/* -----------------------------------------------------------
   STEP 1 — Register Upload (Get Upload URL + Asset URN)
----------------------------------------------------------- */
async function requestUploadUrl(accessToken, authorURN, mediaType) {
  const recipe = mediaType.startsWith("image")
    ? "urn:li:digitalmediaRecipe:feedshare-image"
    : "urn:li:digitalmediaRecipe:feedshare-video";

  const res = await axios.post(
    "https://api.linkedin.com/v2/assets?action=registerUpload",
    {
      registerUploadRequest: {
        recipes: [recipe],
        owner: authorURN,
        serviceRelationships: [
          {
            relationshipType: "OWNER",
            identifier: "urn:li:userGeneratedContent",
          },
        ],
      },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
    }
  );

  const uploadUrl =
    res.data.value.uploadMechanism[
      "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
    ].uploadUrl;

  const assetURN = res.data.value.asset;

  return { uploadUrl, assetURN };
}

/* -----------------------------------------------------------
   STEP 2 — Upload Media to LinkedIn
----------------------------------------------------------- */
async function uploadMedia(uploadUrl, mediaUrl, accessToken) {
  const mediaRes = await axios.get(mediaUrl, {
    responseType: "arraybuffer",
  });

  const fileData = mediaRes.data;
  const mimeType = mediaRes.headers["content-type"];

  await axios.put(uploadUrl, fileData, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": mimeType,
    },
  });

  return mimeType;
}

/* -----------------------------------------------------------
   STEP 3 — Create UGC Post with Media
----------------------------------------------------------- */

export const linkedinautoPost = async (req, res) => {
  try {
    const { access_token, caption, author, mediaUrl, mediaType } = req.body;

    if (!access_token || !caption || !author) {
      return res.status(400).json({
        success: false,
        error:
          "Required fields missing: access_token, caption, author (URN).",
      });
    }

    // If NO media → publish text post only
    if (!mediaUrl || !mediaType) {
      const postRes = await axios.post(
        "https://api.linkedin.com/v2/ugcPosts",
        {
          author,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: { text: caption },
              shareMediaCategory: "NONE",
            },
          },
          visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
          },
        }
      );

      return res.status(200).json({
        success: true,
        message: "Text post published successfully.",
        postId: postRes.headers["x-linkedin-id"],
      });
    }

    /* -------------------------------
       MEDIA MODE (Image or Video)
    ------------------------------- */

    // STEP 1: Get upload URL + asset URN
    const { uploadUrl, assetURN } = await requestUploadUrl(
      access_token,
      author,
      mediaType
    );

    // STEP 2: Upload file
    await uploadMedia(uploadUrl, mediaUrl, access_token);

    // STEP 3: Publish UGC Post
    const mediaCategory = mediaType.startsWith("image")
      ? "IMAGE"
      : "VIDEO";

    const postRes = await axios.post(
      "https://api.linkedin.com/v2/ugcPosts",
      {
        author,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: caption },
            shareMediaCategory: mediaCategory,
            media: [
              {
                status: "READY",
                media: assetURN,
              },
            ],
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Media post published successfully!",
      asset: assetURN,
      postId: postRes.headers["x-linkedin-id"],
    });
  } catch (err) {
    console.log("LinkedIn Media Post Error:", err.response?.data || err);
    return res.status(500).json({
      success: false,
      error: "Failed to publish LinkedIn post",
      details: err.response?.data || err.message,
    });
  }
};