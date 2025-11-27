const mongoose = require("mongoose");

const ContentSchema = new mongoose.Schema({

  // ID is automatically created by MongoDB (_id)

  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true 
  },

  platform: { 
    type: String, 
    enum: ["facebook", "instagram", "linkedin"],
    required: true 
  },

  pageId: { 
    type: String, 
    required: true                // Facebook Page ID / Instagram Business ID / LinkedIn Page ID
  },

  pageName: { 
    type: String 
  },

  profileImage: { 
    type: String                  // Page or Profile Image URL
  },

  accessToken: { 
    type: String, 
    required: true 
  },

  refreshToken: { 
    type: String 
  },

  expiryToken: { 
    type: Date 
  },

  caption: { 
    type: String 
  },

  media: [
    {
      url: { type: String },      // Image/Video URL
      type: { type: String, enum: ["image", "video"] }
    }
  ],

  scheduledDate: { 
    type: Date 
  },

  status: { 
    type: String, 
    enum: ["draft", "scheduled", "posted", "failed"],
    default: "draft"
  },

}, { 
  timestamps: true              // automatically adds createdAt & updatedAt
});

module.exports = mongoose.model("Content", ContentSchema);
