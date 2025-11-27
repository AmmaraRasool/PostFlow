import jwt from "jsonwebtoken";
import User from "../../models/User.model.js";
import LinkedinPost from "../../models/LinkedinPost.model.js";
import { autoPublishLinkedInPosts } from "../../core/services/linkedinPost.service.js";

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI;
const BASE_URL = process.env.BASE_URL;

function signState(userId) {
  return jwt.sign({ uid: userId }, process.env.JWT_SECRET, { expiresIn: 600 });
}
function verifyState(state) {
  return jwt.verify(state, process.env.JWT_SECRET);
}

export const connectLinkedIn = async (req, res) => {
    console.log(CLIENT_ID)
  const userId = req.user._id.toString();
  const state = signState(userId);

  // 🛑 FIX: Remove 'w_member_social' unless your application is approved for it.
  // Use the standard scopes that come with the "Sign In with LinkedIn" product.
  const scope = encodeURIComponent("r_liteprofile r_emailaddress"); 

  const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}&scope=${scope}`;
console.log(url)
   res.redirect(url);


};

export const linkedinCallback = async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) return res.status(400).send("Missing code or state");
  let payload;
  try { payload = verifyState(state); } catch { return res.status(400).send("Invalid state"); }
  const userId = payload.uid;

  const tokenResp = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET
    })
  });
  const tokenJson = await tokenResp.json();
  if (!tokenResp.ok) return res.status(400).json(tokenJson);

  const { access_token, expires_in } = tokenJson;
  const user = await User.findById(userId);
  user.linkedinAccessToken = access_token;
  user.linkedinExpiresAt = new Date(Date.now() + expires_in * 1000);
  await user.save();

  res.redirect(`${BASE_URL}/dashboard?linkedin=connected`);
};

export const schedulePost = async (req, res) => {
  const user = req.user;
  const { text, mediaUrl, scheduleAt } = req.body;
  if (!text || !scheduleAt) return res.status(400).json({ success: false, message: "text and scheduleAt required" });

  const post = await LinkedinPost.create({
    userId: user._id,
    text,
    mediaUrl: mediaUrl || null,
    scheduleAt: new Date(scheduleAt),
    status: "scheduled"
  });

  res.status(201).json({ success: true, post });
};

export const runLinkedInAutoPost = async (req, res) => {
  await autoPublishLinkedInPosts();
  res.json({ success: true, message: "Auto-post job executed" });
};
