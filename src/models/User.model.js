    import mongoose from "mongoose";
    import crypto from "crypto";
    import jwt from "jsonwebtoken";
    import bcrypt from "bcryptjs";

    const userSchema = new mongoose.Schema({
        userName: { type: String, required: true },
        userEmail: { type: String, required: true, unique: true, lowercase: true },
        userPassword: { type: String, required: true },
        userRole: { type: String, enum: ["admin", "user"], default: "user" },
        userIsVerified: { type: Boolean, default: false }, // <- Add this
        userVerificationToken: { type: String, default: null }, // <- Add this
        userVerificationTokenExpiry: { type: Date, default: null }, // <- Add this

        userPasswordResetToken: { type: String, default: null },
        userPasswordExpirationDate: { type: Date, default: null },


        userRefreshToken: { type: String, default: null }, // <- Add this
        
    }, { timestamps: true });

    // Hash password before saving
    userSchema.pre("save", async function(next) {
        if (!this.isModified("userPassword")) return next();
        this.userPassword = await bcrypt.hash(this.userPassword, 10);
        next();
    });

    // Compare password
    userSchema.methods.isPasswordCorrect = async function(password) {
        return bcrypt.compare(password, this.userPassword);
    };

    // Generate temporary token for verification or reset
    userSchema.methods.generateTemporaryToken = function() {
        const unHashedToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(unHashedToken).digest("hex");
        const tokenExpiry = Date.now() + 30 * 60 * 1000; // 30 minutes from now
        return { unHashedToken, hashedToken, tokenExpiry };
    };

    // Generate JWT Access Token
    userSchema.methods.generateAccessToken = function() {
        return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY });
    };


    // Generate JWT Refresh Token
    userSchema.methods.generateRefreshToken = function() {
        return jwt.sign({ id: this._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
    };


    // Hash refresh token before saving to database
    userSchema.methods.hashToken = function (token) {
        return crypto.createHash("sha256").update(token).digest("hex");
    };


    const User = mongoose.model("User", userSchema);

    export default User;
