import { asyncHandler } from "../../core/utils/async-handler.js";
import adminUser from "../../models/Admin.model.js";
import { ApiError } from "../../core/utils/api-error.js";
import { ApiResponse } from "../../core/utils/api-response.js";
import { mailTransporter } from "../../shared/helpers/mail.helper.js";
import crypto from "crypto";
import { storeAccessToken, storeLoginCookies } from "../../shared/helpers/cookies.helper.js";
import { adminVerificationMailBody, adminForgotPasswordMailBody } from "../../shared/constants/mail.constant.js";

// ------------------- REGISTER ADMIN -------------------
const registerAdmin = asyncHandler(async (req, res) => {
    const { adminName, adminEmail, adminPassword, adminRole, phoneNumber, adminAddress } = req.body;

    const existingAdmin = await adminUser.findOne({ adminEmail });
    if (existingAdmin) throw new ApiError(400, "Admin already exists");

    const admin = await adminUser.create({
        adminName,
        adminEmail,
        adminPassword,
        adminRole,
        phoneNumber,
        adminAddress
    });

    // Generate temporary verification token
    const { unHashedToken, hashedToken, tokenExpiry } = admin.generateTemporaryToken();
    admin.adminVerificationToken = hashedToken;
    admin.adminVerificationTokenExpiry = tokenExpiry;
    await admin.save();

    // Send verification email
    const verificationLink = `${process.env.BASE_URL}/api/v1/admin/verify/${unHashedToken}`;
    await mailTransporter.sendMail({
        from: process.env.MAILTRAP_SENDEREMAIL,
        to: adminEmail,
        subject: "Verify your admin email",
        html: adminVerificationMailBody(adminName, verificationLink)
    });

    return res.status(201).json(
        new ApiResponse(201, { adminName, adminEmail, adminRole }, "Admin registered successfully")
    );
});

// ------------------- LOGIN ADMIN -------------------
const loginAdmin = asyncHandler(async (req, res) => {
    const { adminEmail, adminPassword } = req.body;
    const admin = await adminUser.findOne({ adminEmail });
    if (!admin) throw new ApiError(400, "Admin not found");

    const isPasswordCorrect = await admin.isPasswordCorrect(adminPassword);
    if (!isPasswordCorrect) throw new ApiError(400, "Invalid password");
    if (!admin.adminIsVerified) throw new ApiError(400, "Admin not verified");

    const accessToken = admin.generateAccessToken();
    const refreshToken = admin.generateRefreshToken();

    storeLoginCookies(res, accessToken, refreshToken);
    admin.refreshToken = refreshToken;
    await admin.save();

    return res.status(200).json(
        new ApiResponse(200, { admin: { adminName: admin.adminName, adminEmail: admin.adminEmail, adminRole: admin.adminRole }, tokens: { accessToken, refreshToken } }, "Admin logged in successfully")
    );
});

// ------------------- LOGOUT ADMIN -------------------
const logoutAdmin = asyncHandler(async (req, res) => {
    const adminId = req.user?._id;
    if (!adminId) throw new ApiError(401, "Admin not authenticated");

    const admin = await adminUser.findById(adminId);
    if (!admin) throw new ApiError(404, "Admin not found");

    admin.refreshToken = null;
    await admin.save();

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.status(200).json(new ApiResponse(200, {}, "Admin logged out successfully"));
});

// ------------------- VERIFY ADMIN EMAIL -------------------
const verifyAdminMail = asyncHandler(async (req, res) => {
    const { token } = req.params;
    if (!token) throw new ApiError(400, "Token not provided");

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const admin = await adminUser.findOne({
        adminVerificationToken: hashedToken,
        adminVerificationTokenExpiry: { $gt: Date.now() }
    });
    if (!admin) throw new ApiError(400, "Invalid or expired verification token");

    admin.adminIsVerified = true;
    admin.adminVerificationToken = null;
    admin.adminVerificationTokenExpiry = null;
    await admin.save();

    return res.status(200).json(new ApiResponse(200, {}, "Admin verified successfully"));
});

// ------------------- GET NEW ACCESS TOKEN -------------------
const getAdminAccessToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) throw new ApiError(400, "Refresh token not found");

    const admin = await adminUser.findOne({ refreshToken });
    if (!admin) throw new ApiError(400, "Invalid refresh token");

    const accessToken = admin.generateAccessToken();
    storeAccessToken(res, accessToken);

    return res.status(201).json(new ApiResponse(201, { accessToken }, "Access token generated successfully"));
});

// ------------------- FORGOT PASSWORD -------------------
const forgotAdminPasswordMail = asyncHandler(async (req, res) => {
    const { adminEmail } = req.body;
    const admin = await adminUser.findOne({ adminEmail });
    if (!admin) throw new ApiError(400, "Admin not found");

    const { unHashedToken, hashedToken, tokenExpiry } = admin.generateTemporaryToken();
    admin.adminPasswordResetToken = hashedToken;
    admin.adminPasswordExpirationDate = tokenExpiry;
    await admin.save();

    const resetLink = `${process.env.BASE_URL}/api/v1/admin/reset-password/${unHashedToken}`;
    await mailTransporter.sendMail({
        from: process.env.MAILTRAP_SENDEREMAIL,
        to: adminEmail,
        subject: "Reset your password",
        html: adminForgotPasswordMailBody(admin.adminName, resetLink)
    });

    return res.status(201).json(new ApiResponse(201, { resetLink }, "Password reset link sent successfully"));
});

// ------------------- RESET PASSWORD -------------------
const resetAdminPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { adminPassword } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const admin = await adminUser.findOne({
        adminPasswordResetToken: hashedToken,
        adminPasswordExpirationDate: { $gt: Date.now() }
    });
    if (!admin) throw new ApiError(400, "Invalid or expired password reset token");

    admin.adminPassword = adminPassword;
    admin.adminPasswordResetToken = null;
    admin.adminPasswordExpirationDate = null;
    await admin.save();

    return res.status(201).json(new ApiResponse(201, {}, "Password reset successfully"));
});

export {
    registerAdmin,
    loginAdmin,
    logoutAdmin,
    verifyAdminMail,
    getAdminAccessToken,
    forgotAdminPasswordMail,
    resetAdminPassword
};
