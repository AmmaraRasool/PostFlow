// import mongoose from "mongoose";

// const postSchema = new mongoose.Schema({
//   userId: { 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: "User",
//     required: true 
//   },

//   caption: { 
//     type: String, 
//     required: true 
//   },

//   media: [
//     {
//       url: { type: String, required: true },
//       type: { type: String, enum: ["image", "video"], required: true }
//     }
//   ],

//   platforms: [
//     { 
//       type: String, 
//       enum: ["facebook", "instagram"],
//       required: true
//     }
//   ],

//   socialAccountId: { 
//     type: String,
//     required: true
//   },

//   accessToken: { // <-- added
//     type: String,
//     required: function() {
//       return this.platforms.includes('facebook');
//     }
//   },

//   scheduledTime: { 
//     type: Date, 
//     required: true 
//   },

//   status: {
//     type: String,
//     enum: ["draft", "scheduled", "posted", "failed", "published"],
//     default: "draft"  
//   },

//   autoPost: {
//     type: Boolean,
//     default: false
//   },

//   publishedAt: { 
//     type: Date 
//   },
//   accessToken: { type: String, required: true }, // long-lived page token

//   platformPostId: { // store FB post ID
//     type: String, 
//     default: null 
//   },

// }, { 
//   timestamps: true
// });

// const Post = mongoose.model("Post", postSchema);

// export default Post;


import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true 
  },

  caption: { 
    type: String, 
    required: true 
  },

  media: [
    {
      url: { type: String, required: true },
      key: { type: String, required: true },         // store key for deletes
      type: { type: String, enum: ["image", "video"], required: true }
    }
  ],

  platforms: [
    { 
      type: String, 
      enum: ["facebook", "instagram"],
      required: true
    }
  ],

  socialAccountId: { 
    type: String,
    required: true
  },

  accessToken: { // long-lived page token (required if platforms include facebook)
    type: String,
    required: function() {
      return Array.isArray(this.platforms) && this.platforms.includes('facebook');
    }
  },

  scheduledTime: { 
    type: Date, 
    required: true 
  },

  status: {
    type: String,
    enum: ["draft", "scheduled", "posted", "failed", "published"],
    default: "draft"  
  },

  autoPost: {
    type: Boolean,
    default: false
  },

  publishedAt: { 
    type: Date 
  },

  platformPostId: { // store FB post ID
    type: String, 
    default: null 
  },

}, { 
  timestamps: true
});

const Post = mongoose.model("Post", postSchema);

export default Post;