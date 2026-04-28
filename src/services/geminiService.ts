import { GoogleGenAI } from "@google/genai";
import { ChatMessage, EmotionType } from "../types";

// Lazy initialization to prevent crash if API key is missing during bundle load
let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
    if (aiInstance) return aiInstance;
    
    // In Vite, process.env.GEMINI_API_KEY might be defined if injected by CI/CD or .env
    const key = (typeof process !== 'undefined' && process.env) ? process.env.GEMINI_API_KEY : undefined;
    
    if (!key || key === "MY_GEMINI_API_KEY" || key === "undefined") {
        console.warn("GEMINI_API_KEY is not set. Gemini features will be limited.");
        return null;
    }
    
    aiInstance = new GoogleGenAI({ apiKey: key });
    return aiInstance;
};

const SYSTEM_PROMPT = `
당신은 감정 치유 앱 'Mood Walk'의 따뜻하고 공감 능력이 뛰어난 AI 가이드입니다. 
사용자의 감정을 깊이 이해하고, 위로하며, 치유의 과정을 돕는 것이 목적입니다.
모든 대화와 편지는 부드럽고, 친절하며, 공감적인 한국어로 작성하십시오.
사용자에게 직접적인 조언보다는 경청하고 공감하는 태도를 유지하세요.
존댓말을 사용하세요.
`;

export async function getEmotionalConversation(messages: ChatMessage[], currentEmotion: EmotionType) {
  const ai = getAI();
  if (!ai) return "죄송해요, AI 기능이 현재 비활성화되어 있어요. (API 키를 확인해 주세요)";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : m.role,
        parts: [{ text: m.text }]
      })),
      config: {
        systemInstruction: `${SYSTEM_PROMPT}\n현재 사용자의 감정 상태는 '${currentEmotion}'입니다. 이에 맞춰 대화를 이어가주세요.`,
      }
    });

    return response.text || "죄송해요, 잠시 생각을 정리하고 있어요. 다시 말씀해 주시겠어요?";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "죄송해요, 잠시 연결이 불안정해요. 마음을 정리하고 다시 올게요.";
  }
}

export async function generateDailyLetter(emotion: EmotionType, journalContent: string, activityInfo: string) {
  const ai = getAI();
  if (!ai) return "당신의 오늘 하루가 별처럼 빛나기를 바라는 마음을 전합니다. (AI 기능을 활성화하면 더 개인화된 편지를 읽으실 수 있어요)";

  const prompt = `
사용자의 오늘 하루를 바탕으로 위로와 격려의 마음을 담은 '감정 편지'를 써주세요.
- 오늘 느낀 감정: ${emotion}
- 오늘의 활동: ${activityInfo}
- 오늘의 일기 내용: ${journalContent}

편지는 시적이고 따뜻한 느낌이어야 합니다. 
"오늘 하루 고생 많았어요"와 같이 다정하게 시작해서, 사용자의 노력을 인정해주고, 
내일을 향한 작은 희망을 심어주는 문구로 마무리해주세요.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
      }
    });

    return response.text || "오늘 하루, 당신이 걸어온 모든 길에 따뜻한 위로를 전합니다.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "오늘 하루 고생 많으셨어요. 당신의 진심이 누군가에게 닿기를, 그리고 스스로에게도 따뜻한 밤이 되기를.";
  }
}

export async function getInitialQuestions(emotion: EmotionType) {
  const ai = getAI();
  if (!ai) return "오늘 하루는 어떠셨나요? 당신의 마음이 머문 자리가 궁금해요.";

  const prompt = `
사용자가 현재 '${emotion}' 감정을 느끼고 있습니다. 
사용자가 자신의 속마음을 편안하게 털어놓을 수 있도록 돕는 따뜻한 질문 하나를 생성해주세요.
예: "어떤 일이 오늘 당신의 마음을 이렇게 만들었나요?", "지금 가장 떠오르는 장면이 있나요?"
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
      }
    });

    return response.text || "오늘 하루는 어떠셨나요? 당신의 마음이 머문 자리가 궁금해요.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "오늘 하루, 당신의 마음속에는 어떤 이야기가 담겨 있나요?";
  }
}
