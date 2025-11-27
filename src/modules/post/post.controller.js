import { ApiError } from "../../core/utils/api-error.js";
import { ApiResponse } from "../../core/utils/api-response.js";
import { asyncHandler } from "../../core/utils/async-handler.js";
import Post from "../../models/post.model.js";
import S3UploadHelper from "../../shared/helpers/s3Upload.js";

// CREATE POST
export const createPost = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, "User not authenticated");

const { caption, platforms, socialAccountId, scheduledTime, autoPost, accessToken } = req.body;
    console.log(req.files);

    if (!caption || !platforms || !socialAccountId || !scheduledTime) {
        throw new ApiError(400, "All fields are required");
    }

    let platformsArray;
    try {
        platformsArray = JSON.parse(platforms);
    } catch {
        throw new ApiError(400, "Platforms must be valid JSON array");
    }
    // Validate scheduledTime
    const scheduledDate = new Date(scheduledTime + " GMT+0500");
    if (isNaN(scheduledDate.getTime())) {
        throw new ApiError(400, "Invalid scheduledTime format");
    }
    if (scheduledDate < new Date()) {
        throw new ApiError(400, "Scheduled time cannot be in the past");
    }


    //  upload files to S3
    const uploadedMedia = await S3UploadHelper.uploadMultipleFiles(req.files, "posts");

    const mediaArray = uploadedMedia.map(file => ({
        url: `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${file.key}`,
        key: file.key,
        type: file.mimetype?.startsWith("image") ? "image" : "video"
    }));

    const newPost = await Post.create({
    userId,
    caption,
    media: mediaArray,
    platforms: platformsArray,
    socialAccountId,
    accessToken: accessToken || null, // save token
    scheduledTime: scheduledDate,
    status: "scheduled",
    autoPost: autoPost || false
});

    return res
        .status(201)
        .json(new ApiResponse(201, newPost, "Post created successfully"));
});

// GET ALL POSTS (User Specific)
export const getUserPosts = asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
        throw new ApiError(401, "User not authenticated");
    }

    const posts = await Post.find({ userId }).sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, posts, "User posts fetched"));
});

// GET SINGLE POST
export const getSinglePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user?.id;

    const post = await Post.findOne({ _id: postId, userId });

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, post, "Post fetched successfully"));
});

// UPDATE POST
export const updatePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user?.id;

    // 1. Find the post and check ownership
    let post = await Post.findOne({ _id: postId, userId });
    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    // 2. Allowed fields only
    const allowedUpdates = ["caption", "platforms", "scheduledTime"];
    const updateData = {};
    allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });

    // 3. Validate scheduledTime
    if (updateData.scheduledTime) {
        const scheduledDate = new Date(updateData.scheduledTime);
        if (isNaN(scheduledDate.getTime())) {
            throw new ApiError(400, "Invalid scheduledTime format");
        }
        if (scheduledDate < new Date()) {
            throw new ApiError(400, "Scheduled time cannot be in the past");
        }
    }

    // 4. Handle media updates
    // keepMedia: array of old media keys that user wants to keep
    const keepMediaKeys = req.body.keepMedia || [];
    let finalMedia = post.media.filter(m => keepMediaKeys.includes(m.key));

    // Upload new media if any
    if (req.files && req.files.length > 0) {
        const uploadedMedia = await S3UploadHelper.uploadMultipleFiles(req.files, "posts");
        const newMediaArray = uploadedMedia.map(file => ({
            url: `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${file.key}`,
            key: file.key,
            type: file.mimetype?.startsWith("image") ? "image" : "video"
        }));
        finalMedia = [...finalMedia, ...newMediaArray];
    }

    // Add media to updateData
    updateData.media = finalMedia;

    // 5. Update post
    post = await Post.findByIdAndUpdate(postId, updateData, { new: true });

    return res
        .status(200)
        .json(new ApiResponse(200, post, "Post updated successfully"));
});

// PUBLISH POST
export const publishPost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user?.id;

    const post = await Post.findOne({ _id: postId, userId });

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    if (post.status === "published") {
        throw new ApiError(400, "Post is already published");
    }

    post.status = "published";
    post.publishedAt = new Date();

    await post.save();

    return res
        .status(200)
        .json(new ApiResponse(200, post, "Post published successfully"));
});

// DELETE POST
export const deletePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user?.id;

    const post = await Post.findOne({ _id: postId, userId });

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    await Post.findByIdAndDelete(postId);

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Post deleted successfully"));
});
