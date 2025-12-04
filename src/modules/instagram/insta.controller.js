import axios from "axios";

// Load env variables
const {
  FB_APP_ID,
  FB_APP_SECRET,
  FB_REDIRECT_URI
} = process.env;

/* --------------------------------------------------
   STEP 1 — REDIRECT USER TO INSTAGRAM AUTH (FB OAuth)
-----------------------------------------------------*/

const SCOPES = 'public_profile,instagram_basic,pages_show_list'; 

export const redirectToInstagramAuth = async (req, res) => {
  try {
 const authUrl = `https://www.facebook.com/v20.0/dialog/oauth?` +
      `client_id=${FB_APP_ID}` +
      `&redirect_uri=${FB_REDIRECT_URI}` + 
      `&scope=${SCOPES}` + // Must use the updated SCOPES here
      `&response_type=code`;
    return res.redirect(authUrl);
  } catch (error) {
    console.error("Auth Redirect Error:", error);
    res.status(500).json({ error: "Failed to redirect" });
  }
};

/* --------------------------------------------------
   STEP 2 — HANDLE CALLBACK (EXCHANGE CODE → TOKEN)
-----------------------------------------------------*/
export const instagramCallback = async (req, res) => {
  const { code } = req.query;

  if (!code) return res.status(400).json({ error: "Missing code" });

  try {
    // Get short-lived token
    const shortTokenRes = await axios.get(
      `https://graph.facebook.com/v20.0/oauth/access_token`,
      {
        params: {
          client_id: FB_APP_ID,
          client_secret: FB_APP_SECRET,
          redirect_uri: FB_REDIRECT_URI,
          code,
        },
      }
    );

    const shortLivedToken = shortTokenRes.data.access_token;

    // Exchange for long-lived token
    const longTokenRes = await axios.get(
      `https://graph.facebook.com/v20.0/oauth/access_token`,
      {
        params: {
          grant_type: "fb_exchange_token",
          client_id: FB_APP_ID,
          client_secret: FB_APP_SECRET,
          fb_exchange_token: shortLivedToken,
        },
      }
    );

    const longLivedToken = longTokenRes.data.access_token;

    return res.json({
      success: true,
      accessToken: longLivedToken,
    });
  } catch (error) {
    console.error("Callback Error:", error.response?.data || error);
    res.status(500).json({ error: "Callback failed" });
  }
};

/* --------------------------------------------------
   STEP 3 — GET USER FACEBOOK PAGES
-----------------------------------------------------*/
export const getUserPages = async (req, res) => {
  const { access_token } = req.query;

  try {
    const response = await axios.get(
      "https://graph.facebook.com/v20.0/me/accounts",
      { params: { access_token } }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Pages Error:", error.response?.data || error);
    res.status(500).json({ error: "Failed to fetch pages" });
  }
};


/* --------------------------------------------------
  STEP 4 — GET INSTAGRAM BUSINESS ACCOUNT ID
  (Requires: The Page ID from Step 3)
-----------------------------------------------------*/
export const getInstagramBusinessId = async (req, res) => {
  const { pageId } = req.params;
  const { access_token } = req.query;

  if (!pageId || !access_token) return res.status(400).json({ error: "Missing Page ID or access token." });

  try {
    // The query targets the specific Facebook Page and requests the 'instagram_business_account' field
    const response = await axios.get(
      `https://graph.facebook.com/v20.0/${pageId}`,
      {
        params: {
          // This field is crucial for getting the linked Instagram ID
          fields: "instagram_business_account", 
          access_token,
        },
      }
    );

    const instagramBusinessAccount = response.data.instagram_business_account;
    
    if (!instagramBusinessAccount) {
        return res.status(404).json({
            error: "No Instagram Business Account found linked to this Facebook Page.",
            details: "Ensure the Instagram account is a Professional account and is correctly linked to the Facebook Page."
        });
    }

    // This is the ID your publishing functions will use.
    res.json({
        message: "Successfully retrieved Instagram Business ID.",
        instagramUserId: instagramBusinessAccount.id
    });

  } catch (error) {
    console.error("IG Business ID Error:", error.response?.data || error);
    res.status(500).json({ error: "Failed to fetch IG business ID" });
  }
};



/* --------------------------------------------------
   STEP 5 — CREATE MEDIA CONTAINER (UPLOAD)
-----------------------------------------------------*/
export const createMedia = async (req, res) => {
  const { ig_user_id, image_url, caption, access_token } = req.body;

  if (!ig_user_id || !image_url)
    return res.status(400).json({ error: "Missing required fields" });

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v20.0/${ig_user_id}/media`,
      {},
      {
        params: {
          image_url,
          caption,
          access_token,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Media Create Error:", error.response?.data || error);
    res.status(500).json({ error: "Failed to create media" });
  }
};

/* --------------------------------------------------
   STEP 6 — PUBLISH MEDIA
-----------------------------------------------------*/
export const publishMedia = async (req, res) => {
  const { ig_user_id, creation_id, access_token } = req.body;

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v20.0/${ig_user_id}/media_publish`,
      {},
      {
        params: {
          creation_id,
          access_token,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Publish Error:", error.response?.data || error);
    res.status(500).json({ error: "Failed to publish media" });
  }
};




/* --------------------------------------------------
   EXTRA — FULL POST IN ONE REQUEST (Optional Shortcut)
-----------------------------------------------------*/

export async function publishInstagramPost(
  instaUserId,
  accessToken,
  mediaUrl,
  caption,
  isVideo = false
) {
  console.log("--------- IG POST PROCESS START ---------");

  const mediaParamKey = isVideo ? "video_url" : "image_url";
  const mediaType = isVideo ? "VIDEO" : "IMAGE";

  try {
    // STEP 1: CREATE MEDIA CONTAINER
    const createResponse = await axios.post(
      `https://graph.facebook.com/v20.0/${instaUserId}/media`,
      {},
      {
        params: {
          [mediaParamKey]: mediaUrl,
          caption,
          access_token: accessToken,
          ...(isVideo && { media_type: mediaType }),
        },
      }
    );

    const creationId = createResponse.data.id;
    console.log("Creation ID:", creationId);

    // STEP 2: PUBLISH MEDIA
    const publishResponse = await axios.post(
      `https://graph.facebook.com/v20.0/${instaUserId}/media_publish`,
      {},
      {
        params: {
          creation_id: creationId,
          access_token: accessToken,
        },
      }
    );

    console.log("Published Successfully:", publishResponse.data);
    return publishResponse.data.id;
  } catch (error) {
    console.error("Post Error:", error.response?.data || error);
    throw error;
  }
}