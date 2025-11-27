import express from "express";
import {
    registerAdmin,
    loginAdmin,
    logoutAdmin,
    verifyAdminMail,
    getAdminAccessToken,
    forgotAdminPasswordMail,
    resetAdminPassword
} from "../../modules/admin/admin.controller.js";
import { isLoggedIn } from "../../core/middleware/isLoggedin.js"; // middleware to check auth
import { validate } from "../../core/middleware/validate.js";
import { registerAdminSchema, loginAdminSchema, resetPasswordSchema} from "../../shared/validators/Admin.validation.js";

const adminRouter = express.Router();

adminRouter.post("/register", validate(registerAdminSchema), registerAdmin);
adminRouter.post("/login", validate(loginAdminSchema), loginAdmin);
adminRouter.get("/verify/:token", verifyAdminMail);
adminRouter.get("/forgot-password", forgotAdminPasswordMail);
adminRouter.post("/reset-password/:token", validate(resetPasswordSchema), resetAdminPassword);
adminRouter.post("/logout", isLoggedIn, logoutAdmin);
adminRouter.get("/get-access-token", getAdminAccessToken);

export default adminRouter;
