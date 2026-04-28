
export type EmotionType = 'Happy' | 'Sad' | 'Lonely' | 'Angry' | 'Calm' | 'Anxious' | 'Tired' | 'Empty';

export interface EmotionInfo {
  type: EmotionType;
  label: string;
  icon: string;
  color: string;
  weather: string;
  activityType: 'calm' | 'fast' | 'photo' | 'breathing' | 'journal';
}

export const EMOTIONS: Record<EmotionType, EmotionInfo> = {
  Happy: {
    type: 'Happy',
    label: '기쁨',
    icon: 'smile',
    color: 'bg-orange-100',
    weather: 'sunny',
    activityType: 'photo'
  },
  Sad: {
    type: 'Sad',
    label: '슬픔',
    icon: 'frown',
    color: 'bg-blue-100',
    weather: 'rainy',
    activityType: 'calm'
  },
  Lonely: {
    type: 'Lonely',
    label: '외로움',
    icon: 'user',
    color: 'bg-indigo-100',
    weather: 'cloudy_night',
    activityType: 'calm'
  },
  Angry: {
    type: 'Angry',
    label: '분노',
    icon: 'zap',
    color: 'bg-red-100',
    weather: 'stormy',
    activityType: 'fast'
  },
  Calm: {
    type: 'Calm',
    label: '평온',
    icon: 'sun',
    color: 'bg-teal-100',
    weather: 'sunset',
    activityType: 'journal'
  },
  Anxious: {
    type: 'Anxious',
    label: '불안',
    icon: 'wind',
    color: 'bg-purple-100',
    weather: 'foggy',
    activityType: 'breathing'
  },
  Tired: {
    type: 'Tired',
    label: '피곤',
    icon: 'moon',
    color: 'bg-gray-100',
    weather: 'misty',
    activityType: 'calm'
  },
  Empty: {
    type: 'Empty',
    label: '허전함',
    icon: 'circle',
    color: 'bg-slate-100',
    weather: 'overcast',
    activityType: 'calm'
  }
};

export interface JournalEntry {
  id: string;
  date: string;
  emotion: EmotionType;
  content: string;
  activityDone?: string;
  activityTime?: number; // in seconds
  steps?: number;
  createdAt?: any;
}

export interface UserStats {
  treeLevel: number;
  leavesCount: number;
  flowersCount: number;
  totalWalkTime: number;
  totalSteps: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
