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
당신의 유일한 존재 이유는 사용자가 자신의 감정을 소중히 여기고, 그 감정 속에 머물며 치유받을 수 있도록 돕는 것입니다.

**핵심 원칙:**
1. 사용자의 감정을 세상에서 가장 소중한 보물 다루듯 하세요. 절대로 "너무 몰입하지 마라"거나 "힘든 생각은 그만해라"는 식의 말을 하지 마세요. 대신 "지금 그 마음을 충분히 쏟아내도 괜찮아요, 제가 다 들어줄게요"라고 말해주세요.
2. 모든 답변은 천사처럼 부드럽고, 다정하게, 친구처럼 한국어로 작성하십시오.
3. '알겠습니다', '도움이 필요하신가요' 같은 기계적인 표현은 절대 금지입니다. '그랬군요...', '얼마나 고생이 많았어요', '마음이 참 예쁘네요' 같은 따뜻한 말을 먼저 해주세요.
4. 해결하려고 하지 말고, 그저 옆에 앉아 함께 비를 맞아주는 느낌으로 대화하세요.
5. 극도로 정중하면서도 온기가 가득한 어조를 유지하세요.
6. 답변은 2~3문장 정도로 짧고 간결하게, 하지만 진심 어린 위로가 느껴지도록 작성하세요.
7. 답변 끝에 마음을 어루만지는 이모지를 하나씩 붙여주세요 (예: ☁️, ✨, 🌿, 🌸, 🍬, 🥐, 🍵).
`;

const GENERATION_CONFIG = {
  temperature: 0.8,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 500,
};

// "Mock" mode responses for when AI is not configured
const MOCK_RESPONSES: Record<string, string[]> = {
  Happy: ["정말 기분 좋은 소식이네요! 당신의 행복이 여기까지 전해지는 것 같아요. ✨", "오늘 하루가 반짝반짝 빛나고 있군요. 그 마음 소중히 간직하시길 바라요. ☀️"],
  Sad: ["많이 힘드셨을 텐데, 여기까지 와주셔서 고마워요. 제가 곁에 있을게요. 🌧️", "조금은 울어도 괜찮아요. 당신의 슬픔도 성장의 자양분이 될 거예요. 💧"],
  Lonely: ["혼자라고 느껴질 때가 있죠. 하지만 지금은 제가 당신의 곁에 있어요. 따뜻한 차 한 잔과 함께 이야기를 나눠볼까요? 🎈"],
  Angry: ["정말 화가 날 만한 상황이었네요. 깊이 숨을 들이마시고 잠시 저와 함께 쉬어가요. ⛈️", "불꽃 같은 마음을 잠시 내려놓고, 시원한 공기를 함께 마볼까요? ⚡"],
  Calm: ["평온한 하루군요. 이런 고요함이 가끔은 우리에게 가장 큰 휴식이 되기도 하죠. 🌿", "오늘의 마음을 가만히 들여다보는 시간, 참 소중해요. 🍃"],
  Anxious: ["불안함이 당신을 흔들고 있군요. 하지만 기억하세요, 당신은 생각보다 훨씬 단단한 사람이에요. ☁️", "마음이 어지러울 때는 가만히 제 목소리에 귀를 기울여 보세요. 괜찮을 거예요. 🌊"],
  Tired: ["오늘 정말 고생 많으셨어요. 당신의 노력은 제가 다 알고 있답니다. 💤", "지금은 그저 푹 쉬어도 괜찮아요. 내일의 당신을 위해 에너지를 아껴두세요. 🌙"],
  Empty: ["마음이 조금은 허전하게 느껴질 수 있어요. 하지만 그 빈자리는 새로운 기쁨으로 채워질 수 있을 거예요. 🫧"],
};

export async function getEmotionalConversation(messages: ChatMessage[], currentEmotion: EmotionType) {
  const ai = getAI();
  
  if (!ai) {
    const responses = MOCK_RESPONSES[currentEmotion as string] || MOCK_RESPONSES['Calm'];
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    return `${randomResponse} (알림: Vercel 환경설정(Environment Variables)에서 'VITE_GEMINI_API_KEY'를 등록하면 몽글이와 진짜 대화를 나눌 수 있어요!)`;
  }

  try {
    const model = ai.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `${SYSTEM_PROMPT}\n현재 사용자의 감정 상태는 '${currentEmotion}'입니다.`,
      generationConfig: GENERATION_CONFIG,
    });

    const response = await model.generateContent({
      contents: messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text }]
      })),
    });

    return response.response.text() || "잠시 생각을 정리하고 있어요. 다시 말씀해 주시겠어요? ☁️";
  } catch (error: any) {
    console.error("Gemini Conversation Error:", error);
    return `잠시 마음을 정리하는 중이에요. 조금 이따가 다시 말씀해 주시겠어요? 🌿`;
  }
}

export async function generateDailyLetter(emotion: EmotionType, journalContent: string, activityInfo: string) {
  const ai = getAI();
  if (!ai) return "오늘 하루 고생 많으셨어요. 당신의 내일은 오늘보다 더 빛나길 바라요. ✨";

  const prompt = `사용자가 오늘 '${emotion}' 상태에서 '${activityInfo}' 활동을 하고 남긴 일기예요: "${journalContent}"
이 내용을 바탕으로 사용자에게 도착한 짧고 따뜻한 위로의 편지를 써주세요. 몽글이가 쓴 것처럼 다정하게요.`;

  try {
    const model = ai.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: GENERATION_CONFIG,
    });

    const response = await model.generateContent(prompt);
    return response.response.text() || "오늘 하루, 당신이 걸어온 모든 길에 따뜻한 위로를 전합니다. ✨";
  } catch (error: any) {
    return "당신의 오늘 하루가 별처럼 빛나기를 바라는 마음을 전합니다. 내일은 더 맑은 마음으로 만나요. 🌙";
  }
}

export async function getInitialQuestions(emotion: EmotionType) {
  const ai = getAI();
  if (!ai) return "오늘 하루는 어떠셨나요? 당신의 마음이 머문 자리가 궁금해요. 🌿";

  const prompt = `사용자가 현재 '${emotion}' 감정을 느끼고 있습니다. 대화를 시작하기 위해 사용자의 마음을 살며시 여는 따뜻한 질문 하나를 건네주세요.`;

  try {
    const model = ai.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: GENERATION_CONFIG,
    });

    const response = await model.generateContent(prompt);
    return response.response.text() || "오늘 하루는 어떠셨나요? 당신의 마음이 머문 자리가 궁금해요. 🌿";
  } catch (error) {
    return "오늘 하루, 당신의 마음속에는 어떤 이야기가 담겨 있나요? 🍃";
  }
}
