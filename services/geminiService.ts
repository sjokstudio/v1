import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types.ts";

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeAudioWithGemini = async (base64Audio: string, mimeType: string): Promise<AnalysisResult> => {
  try {
    const modelId = "gemini-2.5-flash"; 

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio
            }
          },
          {
            text: `你现在是 SJoK Studio 的首席音频工程师。
请仔细分析这段音频文件，提取以下关键音乐信息：

1. BPM (速度): 精确的每分钟节拍数 (整数)。
2. Key (调式): 准确的调式 (例如: C Major, F# Minor, Bb Mixolydian 等)。
3. Description (评价): 用中文写一段简短、专业但有格调的评语（风格、氛围、乐器特色），不超过40个字。

请务必以纯 JSON 格式返回。`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bpm: { type: Type.NUMBER, description: "BPM value" },
            key: { type: Type.STRING, description: "Musical Key" },
            description: { type: Type.STRING, description: "Short description in Chinese" }
          },
          required: ["bpm", "key", "description"]
        }
      }
    });

    const resultText = response.text;
    
    if (!resultText) {
      throw new Error("SJoK Engine: 无数据返回");
    }

    const data = JSON.parse(resultText) as AnalysisResult;
    return data;

  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};