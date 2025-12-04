import express from "express";
import { facebookAuthRedirect, facebookCallback, facebookManualPost } from "./facebook.controller.js";
import { isLoggedIn  } from "../../core/middleware/isLoggedin.js"; 

const router = express.Router();

router.get("/auth", isLoggedIn , facebookAuthRedirect);
router.get("/callback", isLoggedIn , facebookCallback);
router.post("/post", isLoggedIn , facebookManualPost);

export default router;
