import { GoogleGenAI } from "@google/genai";
import { ChatMessage, EmotionType } from "../types";

// Helper to safely get API key from environment
function getApiKey(): string | undefined {
  // Check multiple possible locations for the key (Environment Variables)
  const keys = [
    (import.meta as any).env?.VITE_GEMINI_API_KEY,
    (import.meta as any).env?.VITE_GOOGLE_API_KEY,
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_API_KEY,
  ];

  for (const key of keys) {
    if (key && key !== "MY_GEMINI_API_KEY" && key !== "undefined" && key !== "" && !key.includes("AI Studio Free Tier")) {
      return key;
    }
  }

  return undefined;
}

export const isAIReady = () => {
  return getApiKey() !== undefined;
};

// Lazy initialization
let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
    if (aiInstance) return aiInstance;
    
    const key = getApiKey();
    
    if (!key) {
        return null;
    }
    
    try {
      aiInstance = new GoogleGenAI({ apiKey: key });
      return aiInstance;
    } catch (error) {
      console.error("Failed to initialize GoogleGenAI:", error);
      return null;
    }
};

const SYSTEM_PROMPT = `
당신은 감정 치유 앱 'Mood Walk'의 따뜻하고 공감 능력이 뛰어난 AI 가이드 '몽글'입니다.
사용자의 감정을 깊이 이해하고, 위로하며, 치유의 과정을 돕는 것이 목적입니다.
모든 대화와 편지는 부드럽고, 친절하며, 공감적인 한국어로 작성하십시오.
사용자에게 직접적인 조언보다는 경청하고 공감하는 태도를 유지하세요.
존댓말을 사용하세요. 답변은 너무 길지 않게, 따뜻한 온기가 느껴지도록 작성하세요.
`;

// "Mock" mode responses for when AI is not configured
const MOCK_RESPONSES: Record<string, string[]> = {
  Happy: ["정말 기분 좋은 소식이네요! 당신의 행복이 여기까지 전해지는 것 같아요.", "오늘 하루가 반짝반짝 빛나고 있군요. 그 마음 소중히 간직하시길 바라요."],
  Sad: ["많이 힘드셨을 텐데, 여기까지 와주셔서 고마워요. 제가 곁에 있을게요.", "조금은 울어도 괜찮아요. 당신의 슬픔도 성장의 자양분이 될 거예요."],
  Lonely: ["혼자라고 느껴질 때가 있죠. 하지만 지금은 제가 당신의 곁에 있어요. 따뜻한 차 한 잔과 함께 이야기를 나눠볼까요?"],
  Angry: ["정말 화가 날 만한 상황이었네요. 깊이 숨을 들이마시고 잠시 저와 함께 쉬어가요.", "불꽃 같은 마음을 잠시 내려놓고, 시원한 공기를 함께 마볼까요?"],
  Calm: ["평온한 하루군요. 이런 고요함이 가끔은 우리에게 가장 큰 휴식이 되기도 하죠.", "오늘의 마음을 가만히 들여다보는 시간, 참 소중해요."],
  Anxious: ["불안함이 당신을 흔들고 있군요. 하지만 기억하세요, 당신은 생각보다 훨씬 단단한 사람이에요.", "마음이 어지러울 때는 가만히 제 목소리에 귀를 기울여 보세요. 괜찮을 거예요."],
  Tired: ["오늘 정말 고생 많으셨어요. 당신의 노력은 제가 다 알고 있답니다.", "지금은 그저 푹 쉬어도 괜찮아요. 내일의 당신을 위해 에너지를 아껴두세요."],
  Empty: ["마음이 조금은 허전하게 느껴질 수 있어요. 하지만 그 빈자리는 새로운 기쁨으로 채워질 수 있을 거예요."],
};

export async function getEmotionalConversation(messages: ChatMessage[], currentEmotion: EmotionType) {
  const ai = getAI();
  
  if (!ai) {
    const responses = MOCK_RESPONSES[currentEmotion as string] || MOCK_RESPONSES['Calm'];
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    return `${randomResponse} (알림: 몽글이가 대화를 속삭이려면 열쇠가 필요해요!)`;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      })),
      config: {
        systemInstruction: `${SYSTEM_PROMPT}\n현재 사용자의 감정 상태는 '${currentEmotion}'입니다.`,
      }
    });

    return response.text || "잠시 생각을 정리하고 있어요. 다시 말씀해 주시겠어요?";
  } catch (error: any) {
    console.error("Gemini Conversation Error:", error);
    return `잠시 마음을 정리하는 중이에요. 조금 이따가 다시 말씀해 주시겠어요?`;
  }
}

export async function generateDailyLetter(emotion: EmotionType, journalContent: string, activityInfo: string) {
  const ai = getAI();
  if (!ai) return "오늘 하루 고생 많으셨어요. 당신의 내일은 오늘보다 더 빛나길 바라요.";

  const prompt = `사용자의 오늘 하루를 바탕으로 위로와 격려의 마음을 담은 '감정 편지'를 써주세요.
감정: ${emotion}, 활동: ${activityInfo}, 일기: ${journalContent}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { systemInstruction: SYSTEM_PROMPT }
    });

    return response.text || "오늘 하루, 당신이 걸어온 모든 길에 따뜻한 위로를 전합니다.";
  } catch (error: any) {
    return "당신의 오늘 하루가 별처럼 빛나기를 바라는 마음을 전합니다. 내일은 더 맑은 마음으로 만나요.";
  }
}

export async function getInitialQuestions(emotion: EmotionType) {
  const ai = getAI();
  if (!ai) return "오늘 하루는 어떠셨나요? 당신의 마음이 머문 자리가 궁금해요.";

  const prompt = `사용자가 현재 '${emotion}' 감정를 느끼고 있습니다. 마음을 털어놓을 수 있는 따뜻한 질문 하나를 생성해주세요.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { systemInstruction: SYSTEM_PROMPT }
    });

    return response.text || "오늘 하루는 어떠셨나요? 당신의 마음이 머문 자리가 궁금해요.";
  } catch (error) {
    return "오늘 하루, 당신의 마음속에는 어떤 이야기가 담겨 있나요?";
  }
}
