import express from "express";
import dotenv from "dotenv"
import cookieParser from "cookie-parser";
import cors from "cors"
import { errorHandler } from "./src/core/middleware/errorHandler.js";
import authRouter from "./src/modules/auth/auth.route.js";
// import aiRoutes from './modules/ai/ai.route.js';
import aiRoutes from "./src/modules/ai/ai.route.js";

//post
import postRouter from "./src/modules/post/post.routes.js";
// user
import userRouter from "./src/modules/user/user.route.js";
// admin
import adminRouter from "./src/modules/admin/admin.route.js";

const app = express()

dotenv.config()

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("My site is running successfully!");
});

app.use("/api/v1/auth", authRouter)

// user
app.use("/api/v1/users", userRouter)

// admin
app.use("/api/v1/admin", adminRouter)


app.use("/api/v1/post", postRouter);



app.use('/api/v1/ai', aiRoutes);



app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: '🚀 Server is running smoothly - Module Structure',
        timestamp: new Date().toISOString()
    });
});


app.use(errorHandler)

export default app