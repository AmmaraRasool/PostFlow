import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import jwt from "jsonwebtoken";

const isLoggedIn = asyncHandler(async (req, res, next) => {
    let accessToken;

    // Try to get from cookies
    if (req.cookies?.accessToken) {
        accessToken = req.cookies.accessToken;
    }

    // Try to get from Authorization header
    else if (req.headers.authorization?.startsWith("Bearer ")) {
        accessToken = req.headers.authorization.split(" ")[1];
    }

    // No token found
    if (!accessToken) {
        throw new ApiError(401, "User not authenticated");
    }

    // Verify token
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

req.user = {
    id: decoded.id || decoded._id    // support both
};

    next();
});

export { isLoggedIn };
