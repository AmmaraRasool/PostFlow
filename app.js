import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { errorHandler } from "./src/core/middleware/errorHandler.js";

// AUTH
import authRouter from "./src/modules/auth/auth.route.js";

// AI
import aiRoutes from "./src/modules/ai/ai.route.js";

// POST
import postRouter from "./src/modules/post/post.routes.js";

// USER
import userRouter from "./src/modules/user/user.route.js";

// ADMIN
import adminRouter from "./src/modules/admin/admin.route.js";

// LINKEDIN OAUTH
import linkedinRoutes from "./src/modules/Linkedin/linkedin.routes.js";
import "./src/modules/Linkedin/linkedinAutoPost.cron.js";


const app = express();

dotenv.config();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("My site is running successfully!");
});

// Auth
app.use("/api/v1/auth", authRouter);

// Users
app.use("/api/v1/users", userRouter);

// Admin
app.use("/api/v1/admin", adminRouter);

// Posts
app.use("/api/v1/post", postRouter);

// AI
app.use("/api/v1/ai", aiRoutes);

// LINKEDIN CONNECT + AUTPOST
app.use("/api/linkedin", linkedinRoutes);


app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 Server is running smoothly",
    timestamp: new Date().toISOString(),
  });
});

app.use(errorHandler);

export default app;
