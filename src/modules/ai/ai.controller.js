import { asyncHandler } from "../../core/utils/async-handler.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateAICaption = asyncHandler(async (req, res) => {
  const { text, image } = req.body;

  if (!text) {
    return res.status(400).json({
      success: false,
      message: "Text is required",
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // ------------------ CAPTION + HASHTAGS MODEL ------------------
    const captionModel = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.4,
        topK: 20,
        topP: 0.9,
        maxOutputTokens: 2000,
      },
    });

    const captionResponse = await captionModel.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
Strictly return ONLY valid JSON:
{
  "caption": "text",
  "hashtags": ["tag1", "tag2", "tag3"]
}

Generate caption + hashtags for:
"${text}"
              `,
            },
          ],
        },
      ],
    });

    const jsonText =
  captionResponse?.response?.candidates?.[0]?.content?.parts?.[0]?.text;

if (!jsonText) {
  return res.status(500).json({
    success: false,
    message: "AI did not return caption JSON",
  });
}

let raw = jsonText.trim();

// Remove code block markdown
raw = raw.replace(/```json/gi, "");
raw = raw.replace(/```/g, "");
raw = raw.replace(/`/g, "");
raw = raw.trim();

let parsed;
try {
  parsed = JSON.parse(raw);
} catch (err) {
  return res.status(500).json({
    success: false,
    message: "JSON parsing failed",
    raw: raw
  });
}


    let responseData = {
      caption: parsed.caption,
      hashtags: parsed.hashtags,
      image: null,
    };

    // ------------------ IMAGE GENERATION ------------------
    if (image === true) {
      const imageModel = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp", // this model supports images
      });

      const imgResponse = await imageModel.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text }],
          },
        ],
      });

      const imgPart =
        imgResponse?.response?.candidates?.[0]?.content?.parts?.find(
          (p) => p.inlineData?.data
        );

      if (!imgPart) {
        return res.status(500).json({
          success: false,
          message: "Image generation failed",
        });
      }

      responseData.image = imgPart.inlineData.data; // base64
    }

    return res.status(200).json({
      success: true,
      message: "AI content generated",
      data: responseData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});