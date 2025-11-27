import app from "./app.js";
import dotenv from "dotenv";
import connectDB from "./src/core/database/index.js";
import cron from "node-cron";
dotenv.config();
const PORT = process.env.PORT || 3000;

connectDB().then(() => {

    app.listen(PORT, () => {
        console.log(`🎯 Server started successfully!`);
        console.log(`📍 Port: ${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    });

    // 🕒 CRON RUNS EVERY MINUTE
    
   import("./src/cron/linkedinAutoPost.cron.js");

}).catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
});
