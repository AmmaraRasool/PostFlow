import { asyncHandler } from "../../core/utils/async-handler.js";
import { autoPublishFacebookPosts } from "../../core/services/facebookPost.service.js";
import { ApiResponse } from "../../core/utils/api-response.js";

export const runFacebookAutoPost = asyncHandler(async (req, res) => {
    await autoPublishFacebookPosts();
    return res.status(200).json(new ApiResponse(200, null, "Facebook auto-post job executed"));
});
