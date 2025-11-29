import express from "express";
import { connectLinkedIn, linkedinCallback, schedulePost, runLinkedInAutoPost } from "./linkedin.controller.js";
import { isLoggedIn } from "../../core/middleware/isLoggedin.js";

const router = express.Router();

router.get("/connect", isLoggedIn, connectLinkedIn);
router.get("/callback", isLoggedIn, linkedinCallback);
router.post("/schedule", isLoggedIn, schedulePost);

// manual trigger for debugging
router.get("/run-auto-post", runLinkedInAutoPost);

export default router;
