// import cron from "node-cron";
// import linkedinPost from "../../models/linkedinPost.js";
// import User from "../models/User.js";

// function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

// export function startLinkedinCron() {
//   cron.schedule("* * * * *", async () => {
//     console.log("LinkedIn cron tick:", new Date().toISOString());
//     const now = new Date();
//     const due = await LinkedinPost.find({
//       status: "scheduled",
//       scheduleAt: { $lte: now }
//     }).limit(20).populate("userId");

//     for (const p of due) {
//       try {
//         p.status = "posting";
//         await p.save();

//         const user = p.userId;
//         if (!user?.linkedin?.accessToken) {
//           p.status = "failed";
//           p.result = { error: "User not connected to LinkedIn" };
//           await p.save();
//           continue;
//         }

//         const accessToken = user.linkedin.accessToken;
//         const author = user.linkedin.linkedinId;
//         if (!author) {
//           p.status = "failed";
//           p.result = { error: "No LinkedIn author URN" };
//           await p.save();
//           continue;
//         }

//         // Post text-only
//         if (!p.mediaUrl) {
//           const body = {
//             author,
//             lifecycleState: "PUBLISHED",
//             specificContent: {
//               "com.linkedin.ugc.ShareContent": {
//                 shareCommentary: { text: p.text },
//                 shareMediaCategory: "NONE"
//               }
//             },
//             visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" }
//           };

//           const resp = await fetch("https://api.linkedin.com/v2/ugcPosts", {
//             method: "POST",
//             headers: {
//               Authorization: `Bearer ${accessToken}`,
//               "Content-Type": "application/json",
//               "X-Restli-Protocol-Version": "2.0.0"
//             },
//             body: JSON.stringify(body)
//           });
//           const json = await resp.json();
//           if (!resp.ok) {
//             p.status = "failed";
//             p.result = json;
//             await p.save();
//             continue;
//           }
//           p.status = "posted";
//           p.postedAt = new Date();
//           p.result = json;
//           await p.save();
//         } else {
//           // MEDIA flow (public image URL) - register upload -> upload -> create post
//           // 1) register upload
//           const registerBody = {
//             registerUploadRequest: {
//               recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
//               owner: author,
//               serviceRelationships: [
//                 { relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" }
//               ]
//             }
//           };

//           const regResp = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
//             method: "POST",
//             headers: {
//               Authorization: `Bearer ${accessToken}`,
//               "Content-Type": "application/json",
//               "X-Restli-Protocol-Version": "2.0.0"
//             },
//             body: JSON.stringify(registerBody)
//           });

//           const regJson = await regResp.json();
//           if (!regResp.ok) {
//             p.status = "failed";
//             p.result = regJson;
//             await p.save();
//             continue;
//           }

//           const uploadMechanism = regJson.value.uploadMechanism;
//           const uploadUrl = uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
//           const asset = regJson.value.asset;

//           // 2) fetch image bytes from public URL
//           const mediaFetch = await fetch(p.mediaUrl);
//           if (!mediaFetch.ok) {
//             p.status = "failed";
//             p.result = { error: "Failed to fetch media URL", status: mediaFetch.status };
//             await p.save();
//             continue;
//           }
//           const mediaBuffer = await mediaFetch.arrayBuffer();

//           // 3) upload bytes to uploadUrl
//           const uploadResp = await fetch(uploadUrl, {
//             method: "PUT",
//             headers: { "Content-Type": "application/octet-stream" },
//             body: Buffer.from(mediaBuffer)
//           });
//           if (!uploadResp.ok) {
//             p.status = "failed";
//             p.result = { error: "Upload to LinkedIn failed", status: uploadResp.status };
//             await p.save();
//             continue;
//           }

//           // 4) create UGC post referencing asset
//           const body = {
//             author,
//             lifecycleState: "PUBLISHED",
//             specificContent: {
//               "com.linkedin.ugc.ShareContent": {
//                 shareCommentary: { text: p.text },
//                 shareMediaCategory: "IMAGE",
//                 media: [
//                   {
//                     status: "READY",
//                     description: { text: "" },
//                     media: asset,
//                     title: { text: "" }
//                   }
//                 ]
//               }
//             },
//             visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" }
//           };

//           const postResp = await fetch("https://api.linkedin.com/v2/ugcPosts", {
//             method: "POST",
//             headers: {
//               Authorization: `Bearer ${accessToken}`,
//               "Content-Type": "application/json",
//               "X-Restli-Protocol-Version": "2.0.0"
//             },
//             body: JSON.stringify(body)
//           });

//           const postJson = await postResp.json();
//           if (!postResp.ok) {
//             p.status = "failed";
//             p.result = postJson;
//             await p.save();
//             continue;
//           }

//           p.status = "posted";
//           p.postedAt = new Date();
//           p.result = postJson;
//           await p.save();
//         }

//         await sleep(300); // small delay
//       } catch (err) {
//         console.error("Posting error:", err);
//         p.status = "failed";
//         p.result = { error: err.message };
//         await p.save();
//       }
//     }
//   });
// }
