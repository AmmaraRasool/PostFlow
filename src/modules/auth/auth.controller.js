import crypto from "crypto";
import { clearAuthCookies } from "../../shared/helpers/cookies.helper.js";
import { asyncHandler } from "../../core/utils/async-handler.js";
import User from "../../models/User.model.js";
import { ApiError } from "../../core/utils/api-error.js";
import { ApiResponse } from "../../core/utils/api-response.js";
import { userForgotPasswordMailBody, userVerificationMailBody } from "../../shared/constants/mail.constant.js";
import { mailTransporter } from "../../shared/helpers/mail.helper.js";
import { storeAccessToken, storeLoginCookies } from "../../shared/helpers/cookies.helper.js";

const registerUser = asyncHandler(async (req, res) => {
    const { userName, userEmail, userPassword, userRole } = req.body
    const normalizedEmail = userEmail.toLowerCase();

    const existingUser = await User.findOne({ userEmail: normalizedEmail });
    if (existingUser) {
        throw new ApiError(400, "User already exists")
    }

    const user = await User.create({
        userName,
        userEmail: normalizedEmail,
        userPassword,
        userRole,
        
    })

    if (!user) {
        throw new ApiError(400, "User not Created");
    }

    const {unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken()

    user.userVerificationToken = hashedToken
    user.userVerificationTokenExpiry = tokenExpiry
    await user.save()

    console.log("User created:", user);
    
    const userVerificationEmailLink = `${process.env.BASE_URL}/api/v1/auth/verify/${unHashedToken}`

    await mailTransporter.sendMail({
        from: process.env.MAILTRAP_SENDEREMAIL,
        to: userEmail,
        subject: "Verify your email",
        html: userVerificationMailBody(userName, userVerificationEmailLink),
    })

    const response = {
        userName: user.userName,
        userEmail: user.userEmail,
        userRole: user.userRole,
        
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                response,
                "User created successfully"
            )
        );


})

const logInUser = asyncHandler(async (req, res) => {

    const { userEmail, userPassword } = req.body
    const user = await User.findOne({ userEmail })
    if (!user) {
        throw new ApiError(400, "User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(userPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid password");
    }

    if (!user.userIsVerified) {
        throw new ApiError(400, "User not verified");
    }

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    storeLoginCookies(res, accessToken, refreshToken)

    const hashedRefreshToken = user.hashToken(refreshToken);
    user.userRefreshToken = hashedRefreshToken;
    await user.save();


    const response = {
        user: {
            userName: user.userName,
            userEmail: user.userEmail,
            userRole: user.userRole,
        },
        tokens: {
            accessToken,
            refreshToken
        }
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                response,
                "User logged in successfully"
            )
        );


})

const logoutUser = asyncHandler(async (req, res) => {
    const userId = req.user?.id; // assuming `req.user` is set by auth middleware

    if (!userId) {
        throw new ApiError(401, "User not authenticated");
    }

    // Clear refresh token from database
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    user.userRefreshToken = null;
    await user.save();

    // Clear cookies (for web clients)
    clearAuthCookies(res);


    return res
        .status(200)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const verifyUserMail = asyncHandler(async (req, res) => {
    const { token } = req.params
    if (!token) {
        throw new ApiError(400, "Token not found")
    }
const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
        userVerificationToken: hashedToken,
        userVerificationTokenExpiry: { $gt: Date.now() }
    })
    if (!user) {
        throw new ApiError(400, "Invalid or expired verification token");
    }

    user.userIsVerified = true;
    user.userVerificationToken = null;
    user.userVerificationTokenExpiry = null;
    await user.save();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "User verified successfully"));
})

const getAccessToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.cookies
    if (!refreshToken) {
        throw new ApiError(400, "Refresh token not found")
    }

const hashedRefreshToken = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

const user = await User.findOne({ userRefreshToken: hashedRefreshToken });

if (!user) {
        throw new ApiError(400, "Invalid refresh token");
    }

    const accessToken = await user.generateAccessToken();
    storeAccessToken(res, accessToken)

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                { accessToken },
                "Access token generated successfully"
            )
        );
})

const forgotPasswordMail = asyncHandler(async (req, res) => {
    const { userEmail } = req.body;

    const user = await User.findOne({ userEmail });
    if (!user) {
        throw new ApiError(400, "User not found");
    }

    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken();

    // Store hashed token in DB
    user.userPasswordResetToken = hashedToken;
    user.userPasswordExpirationDate = tokenExpiry;
    await user.save();

    // Send unhashed token to user via email
    const userPasswordResetLink = `${process.env.BASE_URL}/api/v1/auth/reset-password/${unHashedToken}`;

    await mailTransporter.sendMail({
        from: process.env.MAILTRAP_SENDEREMAIL,
        to: userEmail,
        subject: "Reset your password",
        html: userForgotPasswordMailBody(user.userName, userPasswordResetLink),
    });

    return res.status(201).json(
        new ApiResponse(201, { userPasswordResetLink }, "Password reset link sent successfully")
    );
});


const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { userPassword } = req.body;

    // Hash the token from email to match DB
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        userPasswordResetToken: hashedToken,
        userPasswordExpirationDate: { $gt: Date.now() },
    });

    if (!user) {
        throw new ApiError(400, "Invalid or expired password reset token");
    }

    user.userPassword = userPassword;
    user.userPasswordResetToken = null;
    user.userPasswordExpirationDate = null;
    await user.save();

    return res.status(201).json(new ApiResponse(201, {}, "Password reset successfully"));
});


export { registerUser, logInUser, logoutUser, verifyUserMail, getAccessToken, forgotPasswordMail, resetPassword }