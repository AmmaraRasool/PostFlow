// import { ApiError } from "../utils/api-error.js";
// import { asyncHandler } from "../utils/async-handler.js";

// import jwt from "jsonwebtoken";

// export const isLoggedIn = async (req, res, next) => {
//   const token = req.headers.authorization?.split(" ")[1];
//   if (!token) return res.status(401).json({ success:false, message:"No token provided" });

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(decoded.uid);
//     if (!user) return res.status(401).json({ success:false, message:"User not found" });
    
//     req.user = user; // THIS is required!
//     next();
//   } catch (err) {
//     return res.status(401).json({ success:false, message:"Invalid token" });
//   }
// };








import jwt from "jsonwebtoken";
import User from "../../models/User.model.js";

export const isLoggedIn = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ success: false, message: "Unauthorized" });
  }
};
