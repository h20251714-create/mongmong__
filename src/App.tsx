import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  Footprints, 
  PenLine, 
  Mail, 
  User, 
  Smile, 
  Frown, 
  Zap, 
  Sun, 
  Wind, 
  Moon, 
  Circle, 
  Send,
  ArrowRight,
  ChevronLeft,
  Navigation,
  Play,
  Pause,
  RotateCcw,
  TreeDeciduous,
  Camera,
  History,
  Activity as ActivityIcon,
  LogOut,
  Sparkles,
  MessageCircle,
  Laugh,
  Heart,
  SmilePlus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  EmotionType, 
  EMOTIONS, 
  JournalEntry, 
  UserStats, 
  ChatMessage 
} from './types';
import { 
  getEmotionalConversation, 
  generateDailyLetter, 
  getInitialQuestions,
  isAIReady
} from './services/geminiService';
import { auth, googleProvider, db } from './lib/firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { serverTimestamp } from 'firebase/firestore';
import { 
  getUserProfile, 
  saveUserToDB, 
  updateUserProfile, 
  getJournalEntries, 
  saveJournalEntry 
} from './services/dbService';

// --- Smile Profiles ---
const SMILE_PROFILES = [
  { id: 'happy', icon: Smile, label: '행복', bg: 'bg-yellow-400', color: 'text-white' },
  { id: 'joy', icon: Laugh, label: '기쁨', bg: 'bg-orange-400', color: 'text-white' },
  { id: 'love', icon: Heart, label: '사랑', bg: 'bg-red-400', color: 'text-white' },
  { id: 'peace', icon: Sun, label: '평온', bg: 'bg-blue-400', color: 'text-white' },
  { id: 'active', icon: Zap, label: '활기', bg: 'bg-purple-400', color: 'text-white' },
  { id: 'glow', icon: Sparkles, label: '반짝', bg: 'bg-teal-400', color: 'text-white' },
  { id: 'grin', icon: SmilePlus, label: '방긋', bg: 'bg-green-400', color: 'text-white' },
];

const Avatar = ({ icon: Icon, bg, color, size = 24, className = "" }: { icon: any, bg: string, color: string, size?: number, className?: string }) => (
  <div className={`rounded-full flex items-center justify-center ${bg} ${color} ${className}`} style={{ width: size * 1.5, height: size * 1.5 }}>
    <Icon size={size} />
  </div>
);

const renderProfileIcon = (seed: string, size: number = 24, className: string = "") => {
  const profile = SMILE_PROFILES.find(p => p.id === seed) || SMILE_PROFILES[0];
  return <Avatar icon={profile.icon} bg={profile.bg} color={profile.color} size={size} className={className} />;
};

const CLALMING_TRACKS = [
  { id: 'calm', title: '평온한 피아노 선율', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
];

// --- Components ---

const NavBar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: any) => void }) => {
  const tabs = [
    { id: 'home', icon: Home, label: '홈' },
    { id: 'activity', icon: Footprints, label: '활동' },
    { id: 'journal', icon: PenLine, label: '일기' },
    { id: 'letter', icon: Mail, label: '편지' },
    { id: 'profile', icon: User, label: '프로필' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 vintage-card bg-white border-2 border-[#D4C3A3] mx-4 mb-6 px-6 py-3 flex justify-between items-center z-50">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center space-y-1 transition-all ${
              isActive ? 'text-mood-brown scale-110' : 'text-mood-brown/30'
            }`}
          >
            <div className={`p-2 rounded-full transition-colors ${isActive ? 'bg-mood-beige/40 shadow-inner' : ''}`}>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className="text-[10px] font-bold">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

const WeatherBackground = ({ emotion }: { emotion: EmotionType | null }) => {
  if (!emotion) return <div className="fixed inset-0 bg-mood-cream rainbow-bg -z-10" />;
  
  const weather = EMOTIONS[emotion].weather;
  
  const gradients: Record<string, string> = {
    sunny: 'bg-gradient-to-br from-orange-100 via-yellow-50 to-blue-200',
    rainy: 'bg-gradient-to-br from-blue-300 via-sky-200 to-indigo-100',
    cloudy_night: 'bg-gradient-to-br from-indigo-300 via-purple-200 to-indigo-400',
    stormy: 'bg-gradient-to-br from-red-200 via-orange-100 to-slate-400',
    sunset: 'bg-gradient-to-br from-orange-300 via-pink-200 to-purple-200',
    foggy: 'bg-gradient-to-br from-purple-200 via-slate-200 to-mood-cream',
    misty: 'bg-gradient-to-br from-blue-100 via-slate-200 to-mood-cream',
    overcast: 'bg-gradient-to-br from-slate-300 via-gray-200 to-mood-cream',
  };

  return (
    <motion.div 
      key={weather}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`fixed inset-0 ${gradients[weather] || 'bg-mood-cream'} -z-10 transition-colors duration-1000 overflow-hidden rainbow-bg`}
    >
      <div className="absolute inset-0">
        {/* Floating clouds/blobs */}
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -left-20 w-64 h-64 bg-white/30 blur-3xl rounded-full"
        />
        <motion.div
          animate={{
            x: [0, -70, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/3 -right-20 w-96 h-96 bg-white/20 blur-3xl rounded-full"
        />
        
        {/* Dynamic Stars */}
        {(weather === 'cloudy_night' || weather === 'sunset') && (
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0.2 }}
                animate={{ opacity: [0.2, 0.8, 0.2] }}
                transition={{ duration: Math.random() * 3 + 2, repeat: Infinity, delay: Math.random() * 2 }}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType | null>(null);
  
  // App Logic State
  const [showEmotionPicker, setShowEmotionPicker] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const [isWalking, setIsWalking] = useState(false);
  const [walkTime, setWalkTime] = useState(0);
  const [steps, setSteps] = useState(0);
  
  const [journalText, setJournalText] = useState('');
  const [dailyLetter, setDailyLetter] = useState<string | null>(null);
  const [history, setHistory] = useState<JournalEntry[]>([]);
  const [stats, setStats] = useState<UserStats>({
    treeLevel: 1,
    leavesCount: 5,
    flowersCount: 0,
    totalWalkTime: 0,
    totalSteps: 0,
  });

  const [showLeavesGallery, setShowLeavesGallery] = useState(false);

  // Profile State
  const [userName, setUserName] = useState('스마일');
  const [userBio, setUserBio] = useState('행복을 산책하는 여행자');
  const [avatarSeed, setAvatarSeed] = useState('happy');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Cursor State
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  // Audio State
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const playAudio = async () => {
    if (!audioRef.current) return;
    try {
      if (audioRef.current.readyState < 2) {
        await new Promise((resolve) => {
          const onCanPlay = () => {
            audioRef.current?.removeEventListener('canplay', onCanPlay);
            resolve(null);
          };
          audioRef.current?.addEventListener('canplay', onCanPlay, { once: true });
          setTimeout(resolve, 3000);
        });
      }
      await audioRef.current.play();
    } catch (e) {
      console.log("Audio play failed", e);
      setIsMusicPlaying(false);
    }
  };

  useEffect(() => {
    if (isMusicPlaying && audioRef.current) {
      playAudio();
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [isMusicPlaying]);

  // Automatic Anonymous Auth logic
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const profile = await getUserProfile(u.uid);
        if (profile) {
          setUserName(profile.name);
          setUserBio(profile.bio);
          setAvatarSeed(profile.avatarSeed);
          setStats(profile.stats);
          setIsNewUser(false);
          
          const entries = await getJournalEntries(u.uid);
          if (entries) setHistory(entries as any);
        } else {
          setIsNewUser(true);
        }
      } else {
        // Automatically sign in anonymously if not logged in
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.error("Anonymous Sign-in failed:", err);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Mouse Tracker for Water Drop
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      const target = e.target as HTMLElement;
      setIsHovering(!!(target.closest('button') || target.closest('a') || target.closest('input') || target.closest('textarea')));
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Timer logic
  useEffect(() => {
    if (isWalking) {
      timerRef.current = setInterval(() => {
        setWalkTime(prev => prev + 1);
        setSteps(prev => prev + (Math.random() > 0.5 ? 1 : 0)); 
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isWalking]);

  const handleFinishSetup = async () => {
    if (!user) return;
    const initialData = {
      name: userName,
      bio: userBio,
      avatarSeed: avatarSeed,
      stats: stats
    };
    await saveUserToDB(user.uid, initialData);
    setIsNewUser(false);
  };

  const handleStartActivity = () => {
    setActiveTab('activity');
    setIsWalking(true);
  };

  const handleFinishActivity = () => {
    setIsWalking(false);
    setActiveTab('journal');
  };

  const handleSaveJournal = async () => {
    if (!user) return;

    // Capture values before clearing state
    const capturedContent = journalText || "조용하고 평화로운 산책이었어요.";
    const capturedEmotion = currentEmotion || 'Calm';
    const capturedActivity = EMOTIONS[capturedEmotion].activityType;
    const capturedWalkTime = walkTime;
    const capturedSteps = steps;

    const newEntry: Omit<JournalEntry, 'id'> = {
      date: new Date().toISOString(),
      emotion: capturedEmotion,
      content: capturedContent,
      activityDone: capturedActivity,
      activityTime: capturedWalkTime,
      steps: capturedSteps,
      createdAt: serverTimestamp() as any, // Include server timestamp for security rules
    };

    try {
      const entryId = await saveJournalEntry(user.uid, newEntry);
      
      // Update local history
      setHistory([{ id: entryId, ...newEntry } as any, ...history]);
      
      // Update stats
      const newStats = {
        ...stats,
        leavesCount: stats.leavesCount + 1,
        totalWalkTime: stats.totalWalkTime + capturedWalkTime,
        totalSteps: stats.totalSteps + capturedSteps,
        flowersCount: stats.flowersCount + (capturedWalkTime > 300 ? 1 : 0),
        treeLevel: Math.floor((stats.leavesCount + 1) / 10) + 1
      };
      setStats(newStats);
      await updateUserProfile(user.uid, { stats: newStats });

      // Clear states
      setJournalText('');
      setWalkTime(0);
      setSteps(0);
      
      // Navigate and show loading for letter
      setActiveTab('letter');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setDailyLetter(null);

      const activityInfo = `${capturedActivity} (${Math.floor(capturedWalkTime / 60)}분)`;
      const letter = await generateDailyLetter(
        capturedEmotion, 
        capturedContent, 
        activityInfo
      );
      
      if (letter) {
        setDailyLetter(letter);
      } else {
        throw new Error("No letter generated");
      }
    } catch (error) {
      console.error("Save/Letter error:", error);
      setDailyLetter("당신의 마음은 이미 저 하늘 위 몽글몽글 구름에 닿았어요. 잠시 후에 다시 이 우체통을 확인해 주세요. 따뜻한 답장이 도착해 있을 거예요.");
    }
  };

  const handleEmotionSelect = async (emotion: EmotionType) => {
    setCurrentEmotion(emotion);
    setShowEmotionPicker(false);
    setShowChat(true);
    
    setIsTyping(true);
    const initialQuestion = await getInitialQuestions(emotion);
    setChatMessages([{ role: 'model', text: initialQuestion }]);
    setIsTyping(false);
  };

  const handleSendMessage = async (text: string) => {
    const newMessages: ChatMessage[] = [...chatMessages, { role: 'user', text }];
    setChatMessages(newMessages);
    setIsTyping(true);
    
    const response = await getEmotionalConversation(newMessages, currentEmotion || 'Calm');
    setChatMessages([...newMessages, { role: 'model', text: response }]);
    setIsTyping(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-mood-cream rainbow-bg">
      <div className="animate-float">
        <Smile size={64} className="text-mood-brown opacity-20" />
      </div>
    </div>
  );

  // Remove the login screen as we now use automatic guest mode
  
  if (isNewUser) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 rainbow-bg">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm vintage-card p-10 bg-white/90"
      >
        <h2 className="text-3xl font-bold mb-8 text-mood-brown text-center">반가워요!<br/>누구라고 불러드릴까요?</h2>
        
        <div className="space-y-8">
          <div className="flex flex-col items-center space-y-6">
            <div className="w-32 h-32 rounded-full border-8 border-mood-beige bg-white shadow-2xl relative group flex items-center justify-center mb-4">
               {renderProfileIcon(avatarSeed, 48)}
            </div>
            <div className="p-4 vintage-card bg-white/50 w-full text-center">
              <p className="text-[10px] font-bold text-mood-ink/30 mb-3 uppercase tracking-widest">표정 스티커 선택</p>
              <div className="grid grid-cols-4 gap-3">
                {SMILE_PROFILES.map(smile => (
                  <button 
                    key={smile.id} 
                    onClick={() => setAvatarSeed(smile.id)}
                    className={`aspect-square rounded-full border-4 transition-all flex items-center justify-center ${avatarSeed === smile.id ? 'border-mood-brown scale-110 shadow-lg' : 'border-white/50 opacity-40 hover:opacity-100'}`}
                  >
                    {renderProfileIcon(smile.id, 20)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <input 
              className="w-full vintage-card bg-white p-5 font-bold text-2xl text-center outline-none border-2 border-mood-beige shadow-inner"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="산책자 이름"
            />
          </div>

          <button 
            onClick={handleFinishSetup}
            disabled={!userName.trim()}
            className="w-full bg-mood-brown text-white py-5 rounded-3xl font-bold text-xl shadow-xl active:scale-95 disabled:opacity-50"
          >
            숲을 향해 걷기
          </button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen px-6 pt-12 pb-32 overflow-x-hidden relative">
      <WeatherBackground emotion={currentEmotion} />
      
      {/* Precision Water Drop Cursor (Correct offset to tip) */}
      <motion.div 
        className="cursor-drop hidden md:block"
        animate={{ 
          x: mousePos.x - 16, 
          y: mousePos.y - 16,
          scale: isHovering ? 1.5 : 1,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 450, mass: 0.2 }}
      />

      <audio 
        ref={audioRef} 
        loop
        preload="auto"
        onError={() => {
          console.error("Audio Load Error");
          setIsMusicPlaying(false);
        }}
        src={CLALMING_TRACKS[0].url}
      />

      <div className="fixed top-6 right-6 z-[10010] flex items-center space-x-2">
        {isMusicPlaying && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-mood-beige/50 text-xs font-bold text-mood-brown shadow-sm"
          >
            {CLALMING_TRACKS[0].title}
          </motion.div>
        )}
        <div className="flex bg-white/60 backdrop-blur-md rounded-full shadow-lg border border-mood-beige/30 p-1">
          <button 
            onClick={() => {
              setIsMusicPlaying(!isMusicPlaying);
            }}
            className="p-3 rounded-full bg-mood-brown text-white shadow-inner active:scale-95 transition-all w-12 h-12 flex items-center justify-center"
          >
            {isMusicPlaying ? <Pause size={18} /> : <Play size={18} className="translate-x-0.5" />}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showEmotionPicker ? (
          <motion.div
            key="picker"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center"
          >
            <div className="mb-4 text-mood-brown animate-float">
              <Smile size={60} strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-bold mb-2 mt-2">오늘, 마음이 어때요?</h1>
            <p className="text-mood-ink/50 mb-10 text-lg">당신의 몽글몽글한 감정을 들려주세요.</p>
            
            <div className="grid grid-cols-2 gap-4 w-full">
              {(Object.keys(EMOTIONS) as EmotionType[]).map((key) => {
                const info = EMOTIONS[key];
                return (
                  <button
                    key={key}
                    onClick={() => handleEmotionSelect(key)}
                    className="vintage-card p-6 flex flex-col items-center space-y-3 transition-transform hover:scale-105 active:scale-95 bg-white shadow-md border-2 border-mood-beige"
                  >
                    <div className={`w-16 h-16 rounded-full ${info.color} flex items-center justify-center text-mood-ink/80 shadow-inner relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-white/20 blur-sm" />
                      <div className="relative z-10 scale-150">
                        {key === 'Happy' && '☀️'}
                        {key === 'Sad' && '🌧️'}
                        {key === 'Angry' && '⚡'}
                        {key === 'Calm' && '🍃'}
                        {key === 'Anxious' && '☁️'}
                        {key === 'Tired' && '💤'}
                        {key === 'Lonely' && '🎈'}
                        {key === 'Empty' && '🫧'}
                      </div>
                    </div>
                    <span className="font-bold text-lg text-mood-brown">{info.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : showChat ? (
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col h-[75vh]"
          >
            {!isAIReady() && (
              <div className="mb-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-start space-x-3 text-amber-900 shadow-sm animate-pulse-slow">
                <div className="mt-0.5 bg-amber-200 rounded-full p-1">
                  <Sparkles size={16} className="text-amber-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">앗! 몽글이가 아직 조용해요</p>
                  <p className="text-[10px] leading-relaxed opacity-80 mt-1">
                    오른쪽 <span className="font-bold underline">Secrets</span> 패널에서 <span className="font-bold underline">GEMINI_API_KEY</span> 옆의 빈칸에 
                    아까 복사한 키를 붙여넣어 주세요! (새로 만들지 않으셔도 됩니다.)
                  </p>
                </div>
              </div>
            )}
            <header className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => {
                    if (activeTab === 'home') setShowChat(false);
                    else setShowEmotionPicker(true);
                  }} 
                  className="glass-btn p-2"
                >
                  <ChevronLeft size={20} />
                </button>
                <div>
                  <h2 className="font-bold text-xl">{EMOTIONS[currentEmotion!].label}의 기록</h2>
                  <div className="flex items-center space-x-2 text-xs text-mood-ink/60 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>가이드가 들려주는 중</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowChat(false);
                  handleStartActivity();
                }}
                className="bg-mood-brown text-white px-5 py-2 rounded-full font-bold text-sm shadow-lg flex items-center space-x-2 active:scale-95"
              >
                <span>산책 시작</span>
                <ArrowRight size={16} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide py-4 font-chat text-xl">
              {chatMessages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-4 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-mood-brown text-white rounded-tr-none' 
                      : 'vintage-card rounded-tl-none bg-white/90 font-chat'
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="glass-card p-4 rounded-2xl rounded-tl-none flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-mood-ink/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-mood-ink/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-mood-ink/40 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
              
              {!isTyping && chatMessages.length >= 2 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center py-6"
                >
                  <button 
                    onClick={() => {
                      setShowChat(false);
                      handleStartActivity();
                    }}
                    className="bg-mood-brown text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl animate-bounce-gentle flex items-center space-x-3"
                  >
                    <span>이 마음으로 산책 시작하기</span>
                    <ArrowRight size={20} />
                  </button>
                </motion.div>
              )}
            </div>

            <div className="mt-4 vintage-card p-2 flex items-center space-x-2 bg-white/40 backdrop-blur-xl border-2 border-mood-beige shadow-xl">
              <input
                className="flex-1 bg-transparent px-4 py-3 focus:outline-none font-chat text-xl placeholder:text-mood-ink/30"
                placeholder="마음의 소리를 적어보세요..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    handleSendMessage(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <button 
                className="bg-mood-brown text-white p-3 rounded-2xl shadow-md active:scale-90"
                onClick={() => {
                  const input = document.querySelector('input');
                  if (input && input.value.trim()) {
                    handleSendMessage(input.value);
                    input.value = '';
                  }
                }}
              >
                <Send size={20} />
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="w-full h-full">
            {activeTab === 'home' && (
              <motion.div
                key="home-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <header className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <Smile className="text-mood-brown animate-float" size={32} />
                    <div>
                      <h1 className="text-2xl font-bold text-mood-brown">감정 산책</h1>
                      <p className="text-mood-ink/50 text-xs font-bold">{new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}</p>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-lg bg-white flex items-center justify-center">
                    {renderProfileIcon(avatarSeed, 24)}
                  </div>
                </header>

                <section className="grid grid-cols-1 gap-4">
                  <button 
                    onClick={() => {
                      if (currentEmotion) {
                        setShowChat(true);
                        setActiveTab('home');
                      } else {
                        setShowEmotionPicker(true);
                        setActiveTab('home');
                      }
                    }}
                    className="vintage-card p-6 bg-white/80 border-2 border-mood-beige flex items-center justify-between group active:scale-95 transition-all shadow-md overflow-hidden relative"
                  >
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-mood-beige/20 rounded-full blur-2xl group-hover:bg-mood-beige/40 transition-colors" />
                    <div className="flex items-center space-x-4 relative z-10">
                      <div className="p-3 bg-mood-brown text-white rounded-2xl shadow-lg">
                        <MessageCircle size={24} />
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-lg text-mood-brown">몽글이와 대화하기</h3>
                        <p className="text-xs text-mood-ink/50 font-medium">지금 내 마음을 털어놓고 위로받아요</p>
                      </div>
                    </div>
                    <ArrowRight className="text-mood-brown/30 group-hover:text-mood-brown transition-colors relative z-10" size={20} />
                  </button>

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => {
                        setShowEmotionPicker(true);
                        setActiveTab('home');
                      }}
                      className="vintage-card p-4 bg-white/60 border border-mood-beige flex flex-col items-center space-y-2 active:scale-95 transition-all"
                    >
                      <SmilePlus size={20} className="text-mood-brown" />
                      <span className="text-xs font-bold text-mood-brown">감정 다시 고르기</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('activity')}
                      className="vintage-card p-4 bg-white/60 border border-mood-beige flex flex-col items-center space-y-2 active:scale-95 transition-all"
                    >
                      <Footprints size={20} className="text-mood-brown" />
                      <span className="text-xs font-bold text-mood-brown">산책 시작하기</span>
                    </button>
                  </div>
                </section>

                <section className="vintage-card p-6 flex flex-col items-center text-center relative overflow-hidden bg-white/60 border-2 border-[#D4C3A3] min-h-[460px]">
                  {/* Forest Growth Layer - More vivid as it grows */}
                  <div className="absolute bottom-6 left-0 right-0 h-40 pointer-events-none flex justify-center items-end space-x-[-15px] z-0 px-4">
                    {Array(Math.min(Math.floor(stats.leavesCount / 3), 20)).fill(0).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0, y: 20 }}
                        animate={{ opacity: 0.5, scale: 0.8 + Math.random() * 0.4, y: 0 }}
                        transition={{ delay: i * 0.1, type: 'spring' }}
                        className="flex flex-col items-center"
                      >
                         <div 
                           className="w-10 h-10 rounded-full border-2 border-white/20" 
                           style={{ backgroundColor: i % 2 === 0 ? '#A8D18D' : '#95C27C' }}
                         />
                         <div className="w-2 h-6 bg-[#6D4C41]/60 rounded-full -mt-1" />
                      </motion.div>
                    ))}
                  </div>

                  <div className="relative z-10 flex flex-col items-center w-full">
                    <div className="flex items-center space-x-2 mb-2">
                      <TreeDeciduous size={18} className="text-mood-brown" />
                      <h3 className="text-xl font-bold text-mood-brown">나의 치유 숲</h3>
                      <TreeDeciduous size={18} className="text-mood-brown" />
                    </div>
                    <p className="text-sm font-bold text-mood-ink/60 mb-6 bg-mood-beige/30 px-4 py-1 rounded-full">Level {stats.treeLevel} • {stats.leavesCount % 10}/10 잎사귀</p>
                    
                    <div className="relative w-64 h-64 flex items-center justify-center mt-4">
                      {/* Pastel Glow */}
                      <motion.div 
                        className="absolute inset-0 bg-pink-100/40 blur-3xl rounded-full"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 6, repeat: Infinity }}
                      />
                      
                      {/* Redesigned Pastel Tree (Removed Circles) */}
                      <div className="relative animate-float flex flex-col items-center translate-y-6">
                        <div className="relative w-48 h-48">
                          <svg className="absolute inset-0 w-full h-full drop-shadow-xl" viewBox="0 0 100 100">
                            <defs>
                              <radialGradient id="grad1" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#C6EBC5" />
                                <stop offset="100%" stopColor="#A1C298" />
                              </radialGradient>
                              <filter id="pastel">
                                <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
                                <feComposite in="SourceGraphic" operator="over" />
                              </filter>
                            </defs>
                            {/* Layered Foliage Groups */}
                            <circle cx="50" cy="35" r="32" fill="url(#grad1)" opacity="0.8" />
                            <circle cx="35" cy="50" r="28" fill="#B2C8BA" opacity="0.7" />
                            <circle cx="65" cy="50" r="28" fill="#94AF9F" opacity="0.7" />
                            <circle cx="50" cy="62" r="24" fill="#D2E3C8" opacity="0.65" />
                          </svg>
                        </div>
                        
                        {/* Textured Trunk */}
                        <div className="w-16 h-24 bg-[#8D7B68] rounded-b-full relative shadow-inner overflow-hidden -mt-6">
                          <div className="absolute inset-0 bg-black/10" />
                          <div className="absolute top-4 left-6 w-1.5 h-12 bg-white/20 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 grid grid-cols-2 gap-8 w-full border-t border-mood-ink/10 pt-6 relative z-10">
                    <button 
                      onClick={() => setShowLeavesGallery(true)}
                      className="flex flex-col items-center group active:scale-95 transition-transform"
                    >
                      <p className="text-2xl font-bold text-mood-brown group-hover:text-mood-blue transition-colors">{stats.leavesCount}</p>
                      <p className="text-[10px] text-mood-ink/40 font-bold uppercase tracking-widest flex items-center">
                        <span>수집한 잎사귀</span>
                        <ArrowRight size={10} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </p>
                    </button>
                    <div>
                      <p className="text-2xl font-bold text-mood-brown">{stats.flowersCount}</p>
                      <p className="text-[10px] text-mood-ink/40 font-bold uppercase tracking-widest">성장한 나무들</p>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showLeavesGallery && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/10 backdrop-blur-md"
                      >
                         <div className="vintage-card w-full max-w-xs p-8 bg-white/95 relative">
                            <button 
                              onClick={() => setShowLeavesGallery(false)}
                              className="absolute top-4 right-4 text-mood-ink/40 hover:text-mood-ink"
                            >
                              <RotateCcw size={20} />
                            </button>
                            <h3 className="text-xl font-bold mb-6 text-mood-brown">나의 잎사귀 상자</h3>
                            <div className="grid grid-cols-5 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                              {Array(stats.leavesCount).fill(0).map((_, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.05 }}
                                  className="aspect-square bg-mood-sage/20 rounded-lg flex items-center justify-center border border-mood-sage/30"
                                >
                                  <TreeDeciduous size={16} className="text-mood-sage" />
                                </motion.div>
                              ))}
                            </div>
                            <p className="mt-6 text-xs font-bold text-mood-ink/40">
                              잎사귀 {stats.leavesCount}개를 모았습니다.<br/>
                              10개를 모을 때마다 새로운 나무가 자라나요!
                            </p>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>
              </motion.div>
            )}

            {activeTab === 'activity' && (
              <motion.div
                key="activity-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col h-full space-y-6"
              >
                <header className="text-center pt-8">
                  <h2 className="text-4xl font-bold mb-2 text-mood-brown">
                    {Math.floor(walkTime / 60).toString().padStart(2, '0')}:
                    {(walkTime % 60).toString().padStart(2, '0')}
                  </h2>
                  <p className="text-lg text-mood-ink/60 font-bold">부드러운 숨을 쉬며 걷고 있어요</p>
                </header>

                <div className="flex-1 flex items-center justify-center py-10">
                  <div className="relative">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="absolute inset-0 bg-mood-blue blur-3xl rounded-full"
                    />
                    <div className="relative w-64 h-64 vintage-card rounded-full flex flex-col items-center justify-center shadow-xl bg-white/40">
                      <Footprints className="text-mood-blue mb-2 animate-bounce" size={48} />
                      <p className="text-5xl font-bold text-mood-brown">{steps}</p>
                      <p className="text-sm text-mood-ink/40 font-bold uppercase tracking-widest px-4 text-center">
                        치유의 발걸음
                      </p>
                    </div>
                  </div>
                </div>

                <div className="vintage-card p-2 flex space-x-2 bg-white/80">
                  <button 
                    onClick={() => setIsWalking(!isWalking)}
                    className="flex-1 py-4 flex items-center justify-center space-x-2 font-bold glass-btn"
                  >
                    {isWalking ? <Pause size={20} /> : <Play size={20} />}
                    <span>{isWalking ? '일시정지' : '다시시작'}</span>
                  </button>
                  <button 
                    onClick={handleFinishActivity}
                    className="bg-mood-brown text-white px-8 py-4 rounded-3xl flex items-center justify-center space-x-2 font-bold shadow-lg"
                  >
                    <span>마무리하기</span>
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'journal' && (
              <motion.div
                key="journal-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <header>
                  <h2 className="text-2xl font-bold mb-2 text-mood-brown">마음 일기</h2>
                  <p className="text-mood-ink/60 font-medium text-lg">오늘 산책하며 느낀 감정을 기록해볼까요?</p>
                </header>

                <div className="vintage-card p-6 h-64 relative bg-white/80">
                  <textarea
                    className="w-full h-full bg-transparent resize-none focus:outline-none text-xl leading-relaxed placeholder:text-mood-ink/20 font-chat"
                    placeholder="조용한 숲을 걷는 것처럼 마음을 편히 가지고 적어보세요..."
                    value={journalText}
                    onChange={(e) => setJournalText(e.target.value)}
                  />
                </div>

                <button 
                  onClick={handleSaveJournal}
                  disabled={!journalText.trim()}
                  className="w-full py-4 bg-mood-brown text-white rounded-3xl font-bold text-lg shadow-xl disabled:opacity-50 transition-all active:scale-95"
                >
                  일기 저장하고 편지 받기
                </button>
              </motion.div>
            )}

            {activeTab === 'letter' && (
              <motion.div
                key="letter-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col min-h-[70vh] justify-center space-y-6"
              >
                {!dailyLetter ? (
                  <div className="text-center space-y-10">
                    <div className="w-24 h-24 vintage-card mx-auto flex items-center justify-center bg-white">
                      <Mail size={40} className="text-mood-brown/40 animate-float" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">당신을 위한 편지를 쓰고 있어요</h2>
                      <p className="text-mood-ink/50 font-bold text-lg">오늘의 온기를 담아 전해드릴게요.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="vintage-card p-10 min-h-[50vh] flex flex-col relative overflow-hidden bg-white/95 shadow-xl border-2 border-mood-beige/30"
                    >
                      <div className="absolute -top-10 -right-10 opacity-5">
                        <Mail size={300} />
                      </div>
                      
                      <div className="flex-1 font-serif text-2xl leading-loose text-mood-ink/80 whitespace-pre-wrap pt-4">
                        {dailyLetter}
                      </div>
                      
                      <div className="mt-8 pt-6 border-t border-mood-ink/10 flex justify-between items-center font-serif text-xl text-mood-ink/40">
                        <span>몽글이 드림</span>
                        <span>{new Date().toLocaleDateString('ko-KR')}</span>
                      </div>
                    </motion.div>

                    <div className="flex flex-col space-y-3">
                      <button 
                        onClick={() => {
                          setChatMessages(prev => [
                            ...prev,
                            { role: 'model', text: "오늘 보내준 편지 어땠어? 네가 느낀 감정들에 대해 몽글이와 조금 더 이야기해볼까?" }
                          ]);
                          setShowEmotionPicker(false);
                          setShowChat(true);
                          setActiveTab('home');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="w-full py-4 bg-mood-brown text-white rounded-3xl font-bold text-lg shadow-xl flex items-center justify-center space-x-3 active:scale-95 transition-transform"
                      >
                        <MessageCircle size={20} />
                        <span>몽글이와 더 대화하기</span>
                      </button>
                      
                      <button 
                        onClick={() => setActiveTab('home')}
                        className="w-full py-3 text-mood-ink/40 font-bold text-sm hover:text-mood-brown transition-colors"
                      >
                        숲으로 돌아가기
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div
                key="profile-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <header className="text-center pt-4 flex flex-col items-center space-y-4">
                  <div className="p-4 vintage-card bg-white/80 border-2 border-mood-beige w-full mt-4">
                    <p className="text-[10px] font-bold text-mood-ink/30 mb-3 uppercase tracking-widest">표정 스티커 변경</p>
                    <div className="flex flex-wrap justify-center gap-3">
                      {SMILE_PROFILES.map(smile => (
                        <button
                          key={smile.id}
                          onClick={async () => {
                            setAvatarSeed(smile.id);
                            if (user) await updateUserProfile(user.uid, { avatarSeed: smile.id });
                          }}
                          className={`w-12 h-12 rounded-full border-4 transition-all flex items-center justify-center shadow-sm ${
                            avatarSeed === smile.id ? 'border-mood-brown scale-125 shadow-xl z-20' : 'border-white opacity-60 hover:opacity-100'
                          }`}
                        >
                          {renderProfileIcon(smile.id, 20)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="w-44 h-44 mx-auto rounded-full border-8 border-white shadow-2xl overflow-hidden vintage-card p-0 relative group mt-6 bg-white flex items-center justify-center">
                    {renderProfileIcon(avatarSeed, 80)}
                  </div>
                  
                  {isEditingProfile ? (
                    <div className="space-y-3 w-full max-w-[280px]">
                      <input 
                        className="w-full text-center text-3xl font-bold bg-white rounded-2xl px-4 py-2 outline-none border-4 border-mood-beige shadow-inner" 
                        value={userName} 
                        onChange={(e) => setUserName(e.target.value)}
                        autoFocus
                      />
                      <input 
                        className="w-full text-center text-sm font-bold text-mood-ink/60 bg-white/50 rounded-xl px-4 py-1 outline-none" 
                        value={userBio} 
                        onChange={(e) => setUserBio(e.target.value)}
                      />
                      <button 
                        onClick={async () => {
                          setIsEditingProfile(false);
                          if (user) await updateUserProfile(user.uid, { name: userName, bio: userBio });
                        }}
                        className="bg-mood-brown text-white font-bold px-8 py-2 rounded-full shadow-md mt-2 transition-transform active:scale-95"
                      >
                        몽글 저장
                      </button>
                    </div>
                  ) : (
                    <div className="cursor-pointer group flex flex-col items-center" onClick={() => setIsEditingProfile(true)}>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-3xl font-bold text-mood-brown">{userName}</h2>
                        <PenLine size={18} className="opacity-0 group-hover:opacity-50 transition-opacity text-mood-brown" />
                      </div>
                      <p className="text-mood-ink/40 font-bold italic text-lg">{userBio}</p>
                    </div>
                  )}

                  <button 
                    onClick={() => {
                      if (confirm("모든 산책 기록과 설정을 초기화할까요? 이 작업은 되돌릴 수 없습니다.")) {
                        localStorage.clear();
                        window.location.reload();
                      }
                    }}
                    className="flex items-center space-x-2 text-mood-ink/30 hover:text-red-400 transition-colors py-2 px-6 rounded-full border border-mood-ink/10"
                  >
                    <RotateCcw size={16} />
                    <span className="text-xs font-bold">데이터 초기화</span>
                  </button>
                </header>

                <div className="grid grid-cols-2 gap-4">
                  <div className="vintage-card p-6 flex flex-col items-center bg-white/60">
                    <ActivityIcon size={24} className="text-mood-blue mb-2" />
                    <span className="text-2xl font-bold text-mood-brown">{(stats.totalWalkTime / 60).toFixed(0)}</span>
                    <span className="text-[10px] text-mood-ink/40 font-bold uppercase tracking-widest">누적 분</span>
                  </div>
                  <div className="vintage-card p-6 flex flex-col items-center bg-white/60">
                    <Footprints size={24} className="text-mood-sage mb-2" />
                    <span className="text-2xl font-bold text-mood-brown">{stats.totalSteps.toLocaleString()}</span>
                    <span className="text-[10px] text-mood-ink/40 font-bold uppercase tracking-widest">누적 걸음</span>
                  </div>
                </div>

                <section className="space-y-4 pb-20">
                  <h3 className="font-bold px-2 text-mood-brown flex items-center space-x-2">
                    <History size={18} />
                    <span>발자취</span>
                  </h3>
                  <div className="space-y-3">
                    {history.length === 0 ? (
                      <div className="vintage-card p-8 text-center text-mood-ink/40 text-lg font-bold bg-white/40">
                        기록이 없어요
                      </div>
                    ) : (
                      history.slice(0, 5).map(item => (
                        <div key={item.id} className="vintage-card p-5 flex items-center space-x-4 bg-white/80 group">
                          <div className={`w-12 h-12 rounded-full ${EMOTIONS[item.emotion].color} flex items-center justify-center shadow-inner scale-125`}>
                            {item.emotion === 'Happy' && '☀️'}
                            {item.emotion === 'Sad' && '🌧️'}
                            {item.emotion === 'Angry' && '⚡'}
                            {item.emotion === 'Calm' && '🍃'}
                            {item.emotion === 'Anxious' && '☁️'}
                            {item.emotion === 'Tired' && '💤'}
                            {item.emotion === 'Lonely' && '🎈'}
                            {item.emotion === 'Empty' && '🫧'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold truncate text-mood-brown text-lg">{item.content}</h5>
                            <p className="text-[10px] text-mood-ink/40 font-bold">
                              {new Date(item.date).toLocaleDateString('ko-KR')}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>

      {!showEmotionPicker && !showChat && (
        <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
    </div>
  );
}
