import express from "express";
import { connectLinkedIn, linkedinCallback, schedulePost, runLinkedInAutoPost } from "./linkedin.controller.js";
import { isLoggedIn } from "../../core/middleware/isLoggedin.js";

const router = express.Router();

router.get("/connect", isLoggedIn, connectLinkedIn);
router.get("/callback", linkedinCallback);
router.post("/schedule", isLoggedIn, schedulePost);
router.get("/run-auto-post", runLinkedInAutoPost); // manual test

export default router;
