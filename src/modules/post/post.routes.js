import express from "express";
import multer from "multer";
const upload = multer({ storage: multer.memoryStorage() });
// import { manualAutoPostTest } from "./autoPost.controller.js";

import {
  createPost,
  getUserPosts,
  getSinglePost,
  updatePost,
  publishPost,
  deletePost
} from "./post.controller.js";
import { isLoggedIn } from "../../core/middleware/isLoggedin.js";

const router = express.Router();

router.post("/create-post", isLoggedIn, upload.array("media", 5), createPost);
router.get("/my-posts", isLoggedIn, getUserPosts);
router.get("/post/:postId", isLoggedIn, getSinglePost);
router.put("/post/:postId", isLoggedIn, updatePost);
router.delete("/post/:postId", isLoggedIn, deletePost);
// ✅ Publish post route
router.patch("/:postId/publish", isLoggedIn, publishPost);

// router.get("/auto-test", manualAutoPostTest);

export default router;
