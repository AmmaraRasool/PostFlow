import express from "express";
import { linkedinAuthRedirect, linkedinCallback, linkedinPost, linkedinautoPost } from "./linkedin.controller.js";

const linkedinRoutes = express.Router();

linkedinRoutes.get("/auth", linkedinAuthRedirect);
linkedinRoutes.get("/callback", linkedinCallback);
linkedinRoutes.post("/post", linkedinPost);

export default linkedinRoutes;