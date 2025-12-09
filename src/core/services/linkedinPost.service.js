// src/modules/LinkedIn/linkedinPost.service.js
import axios from "axios";

/* -----------------------------------------------------------
   STEP 1 — Register Upload (Get Upload URL + Asset URN)
----------------------------------------------------------- */
async function registerUpload(accessToken, authorURN, mediaType) {
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
async function uploadMediaToLinkedIn(uploadUrl, mediaUrl) {
  const mediaRes = await axios.get(mediaUrl, {
    responseType: "arraybuffer",
  });

  const fileData = mediaRes.data;
  const mimeType = mediaRes.headers["content-type"];

  await axios.put(uploadUrl, fileData, {
    headers: {
      "Content-Type": mimeType,
    },
  });

  return mimeType;
}

/* -----------------------------------------------------------
   STEP 3 — Create LinkedIn UGC Post
----------------------------------------------------------- */
async function publishLinkedInPost({
  accessToken,
  caption,
  authorURN,
  mediaUrl,
  mediaType,
}) {
  // TEXT ONLY
  if (!mediaUrl || !mediaType) {
    const postRes = await axios.post(
      "https://api.linkedin.com/v2/ugcPosts",
      {
        author: authorURN,
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
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );

    return {
      postId: postRes.headers["x-linkedin-id"],
      asset: null,
    };
  }

  // MEDIA MODE
  const { uploadUrl, assetURN } = await registerUpload(
    accessToken,
    authorURN,
    mediaType
  );

  await uploadMediaToLinkedIn(uploadUrl, mediaUrl);

  const mediaCategory = mediaType.startsWith("image") ? "IMAGE" : "VIDEO";

  const postRes = await axios.post(
    "https://api.linkedin.com/v2/ugcPosts",
    {
      author: authorURN,
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
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
    }
  );

  return {
    postId: postRes.headers["x-linkedin-id"],
    asset: assetURN,
  };
}

export default {
  publishLinkedInPost,
};
