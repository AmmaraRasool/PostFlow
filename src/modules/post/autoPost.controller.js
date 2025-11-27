import { asyncHandler } from "../../core/utils/async-handler.js";
import { ApiResponse } from "../../core/utils/api-response.js";
import { autoPublishLinkedInPosts } from "../../core/services/linkedinPost.service.js";
// import { runLinkedInAutoPost } from "../../modules/post/autoPost.controller.js";

export const runLinkedInAutoPost = asyncHandler(async (req, res) => {
    await autoPublishLinkedInPosts();
    return res
        .status(200)
        .json(new ApiResponse(200, null, "LinkedIn auto-post job executed"));
});

