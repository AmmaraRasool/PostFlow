import express from "express";
import { generateAICaption } from "../ai/ai.controller.js";

import { isLoggedIn } from "../../core/middleware/isLoggedin.js"

const router = express.Router();

// POST /api/ai/generate
router.post("/generate", isLoggedIn, generateAICaption);

export default router;
