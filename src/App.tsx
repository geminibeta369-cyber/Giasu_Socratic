import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  GraduationCap, 
  RefreshCw, 
  User, 
  Bot, 
  ChevronRight, 
  BookOpen, 
  BrainCircuit,
  Settings2,
  Image as ImageIcon,
  X,
  Calculator,
  Plus,
  Trash2,
  Key,
  Camera,
  Upload,
  Youtube,
  Play
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import confetti from "canvas-confetti";
import { getTutorResponse } from "./services/geminiService";
import { Message, Level, TutorState } from "./types";
import GeometryBoard from "./components/GeometryBoard";

const INITIAL_STATE: TutorState = {
  history: [],
  level: "beginner",
  step: 1,
  attempts: 1,
  currentProblem: null,
  userName: null,
  grade: null,
  subject: null,
  isSetupComplete: false,
};

const MATH_GROUPS = [
  {
    name: "Số & Cơ bản",
    symbols: [
      { label: "7", value: "7", type: "number" },
      { label: "8", value: "8", type: "number" },
      { label: "9", value: "9", type: "number" },
      { label: "÷", value: "/", type: "operator" },
      { label: "4", value: "4", type: "number" },
      { label: "5", value: "5", type: "number" },
      { label: "6", value: "6", type: "number" },
      { label: "×", value: "*", type: "operator" },
      { label: "1", value: "1", type: "number" },
      { label: "2", value: "2", type: "number" },
      { label: "3", value: "3", type: "number" },
      { label: "-", value: "-", type: "operator" },
      { label: "0", value: "0", type: "number" },
      { label: ".", value: ".", type: "number" },
      { label: "(", value: "(", type: "number" },
      { label: ")", value: ")", type: "number" },
      { label: "+", value: "+", type: "operator" },
      { label: "=", value: "=", type: "operator" },
      { label: "x", value: "x", type: "variable" },
      { label: "y", value: "y", type: "variable" },
    ]
  },
  {
    name: "Hàm số",
    symbols: [
      { label: "x²", value: "^2", type: "function" },
      { label: "xⁿ", value: "^{}", type: "function" },
      { label: "√", value: "\\sqrt{}", type: "function" },
      { label: "π", value: "\\pi", type: "function" },
      { label: "sin", value: "\\sin()", type: "function" },
      { label: "cos", value: "\\cos()", type: "function" },
      { label: "tan", value: "\\tan()", type: "function" },
      { label: "log", value: "\\log_{}", type: "function" },
      { label: "ln", value: "\\ln()", type: "function" },
    ]
  },
  {
    name: "Ký hiệu & Công thức",
    symbols: [
      { label: "a/b", value: "\\frac{}{}", type: "formula" },
      { label: "≠", value: "!=", type: "formula" },
      { label: "≤", value: "<=", type: "formula" },
      { label: "≥", value: ">=", type: "formula" },
      { label: "Σ", value: "\\sum", type: "formula" },
      { label: "∫", value: "\\int", type: "formula" },
      { label: "lim", value: "\\lim_{x \\to \\infty}", type: "formula" },
      { label: "∞", value: "\\infty", type: "formula" },
      { label: "$...$", value: "$$", type: "formula" },
      { label: "$$...$$", value: "$$$$", type: "formula" },
    ]
  }
];

function SetupScreen({ onComplete }: { onComplete: (data: { name: string, grade: string, subject: string }) => void }) {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("Lớp 6");
  const [subject, setSubject] = useState("Toán học");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onComplete({ name, grade, subject });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="w-full max-w-md p-6 md:p-8 bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] border border-slate-100 relative overflow-hidden"
    >
      {/* Decorative background elements */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-50 rounded-full blur-3xl opacity-50" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent-50 rounded-full blur-3xl opacity-50" />

      <div className="relative z-10">
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-brand-50 to-brand-200 rounded-3xl flex items-center justify-center shadow-inner rotate-3">
            <GraduationCap className="w-10 h-10 md:w-12 md:h-12 text-brand-600 -rotate-3" />
          </div>
        </div>
        
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 text-center mb-2 tracking-tight">Chào mừng em!</h2>
        <p className="text-slate-500 text-center mb-6 md:mb-10 text-xs md:text-sm font-medium">Hãy cho Thầy biết một chút về em để Thầy có thể hỗ trợ tốt nhất nhé.</p>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div className="space-y-1.5 md:space-y-2">
            <label className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Tên của em</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Minh Anh"
              className="w-full px-4 py-3.5 md:px-5 md:py-4 bg-slate-50/50 border-2 border-slate-100 rounded-xl md:rounded-2xl focus:border-brand-400 focus:bg-white transition-all outline-none text-slate-800 font-medium placeholder:text-slate-300 text-sm md:text-base"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-5">
            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Khối lớp</label>
              <div className="relative">
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-4 py-3.5 md:px-5 md:py-4 bg-slate-50/50 border-2 border-slate-100 rounded-xl md:rounded-2xl focus:border-brand-400 focus:bg-white transition-all outline-none text-slate-800 font-medium appearance-none cursor-pointer text-sm md:text-base"
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i} value={`Lớp ${i + 1}`}>Lớp {i + 1}</option>
                  ))}
                </select>
                <div className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 rotate-90" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Môn học</label>
              <div className="relative">
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3.5 md:px-5 md:py-4 bg-slate-50/50 border-2 border-slate-100 rounded-xl md:rounded-2xl focus:border-brand-400 focus:bg-white transition-all outline-none text-slate-800 font-medium appearance-none cursor-pointer text-sm md:text-base"
                >
                  <option value="Toán học">Toán học</option>
                  <option value="Vật lý">Vật lý</option>
                  <option value="Hóa học">Hóa học</option>
                  <option value="Tiếng Anh">Tiếng Anh</option>
                </select>
                <div className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 rotate-90" />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-4 md:py-5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl md:rounded-2xl shadow-[0_20px_40px_-10px_rgba(124,58,237,0.3)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none mt-2 md:mt-4 flex items-center justify-center gap-2 md:gap-3 group text-sm md:text-base"
          >
            Bắt đầu học ngay
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="flex justify-center mt-4">
            <a 
              href="https://www.youtube.com/watch?v=YOUR_VIDEO_ID" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-slate-400 hover:text-brand-600 transition-colors"
            >
              <Youtube className="w-4 h-4 text-red-500" />
              Chưa có API Key? Xem hướng dẫn tại đây
            </a>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

function MessageBubble({ msg, id }: { msg: Message; id: string }) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex gap-2.5 md:gap-5 max-w-full md:max-w-[90%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`flex-shrink-0 w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-[1.25rem] flex items-center justify-center shadow-sm relative overflow-hidden ${
        isUser ? "bg-brand-600 text-white" : "bg-white border border-slate-100 text-brand-600"
      }`}>
        {isUser ? (
          <User className="w-4 h-4 md:w-6 md:h-6 relative z-10" />
        ) : (
          <>
            <div className="absolute inset-0 bg-brand-50 opacity-50" />
            <Bot className="w-4 h-4 md:w-7 md:h-7 relative z-10" />
          </>
        )}
      </div>
      
      <div className={`p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-sm space-y-3 md:space-y-5 relative ${
        isUser 
          ? "bg-brand-600 text-white rounded-tr-none shadow-brand-100/50" 
          : "bg-white border border-slate-50 text-slate-800 rounded-tl-none shadow-slate-100/50"
      }`}>
        {msg.image && (
          <div className="rounded-xl md:rounded-2xl overflow-hidden border-2 md:border-4 border-white/10 max-w-sm shadow-xl">
            <img 
              src={msg.image} 
              alt="Bài tập" 
              className="w-full h-auto object-contain bg-black/5"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
        <div className={`markdown-body ${isUser ? "text-white prose-invert" : "text-slate-700"} font-medium leading-relaxed text-sm md:text-[15px]`}>
          <ReactMarkdown 
            remarkPlugins={[remarkMath]} 
            rehypePlugins={[rehypeKatex]}
          >
            {msg.text}
          </ReactMarkdown>
        </div>

        {msg.geometry && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-slate-50 space-y-4 md:space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3 text-brand-600 font-bold text-[10px] md:text-[11px] uppercase tracking-[0.2em]">
                <div className="p-1.5 md:p-2 bg-brand-50 rounded-lg md:rounded-xl">
                  <Calculator className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </div>
                Hình vẽ minh họa
              </div>
              <div className="px-2 md:px-3 py-0.5 md:py-1 bg-brand-50 text-brand-600 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider">
                Interactive
              </div>
            </div>

            <div className="rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border-2 md:border-4 border-slate-50 shadow-inner bg-white">
              <GeometryBoard id={`board-${id}`} code={msg.geometry.jsxgraph_code} />
            </div>

            <div className="p-4 md:p-5 bg-brand-50/50 rounded-2xl md:rounded-[1.5rem] border border-brand-100/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <BrainCircuit className="w-10 h-10 md:w-12 md:h-12 text-brand-600" />
              </div>
              <span className="font-bold text-brand-700 block mb-2 md:mb-3 text-[10px] md:text-[11px] uppercase tracking-[0.15em] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                Ghi chú từ Thầy
              </span>
              <div className="markdown-body text-sm md:text-[15px] text-slate-600 font-medium leading-relaxed italic">
                <ReactMarkdown 
                  remarkPlugins={[remarkMath]} 
                  rehypePlugins={[rehypeKatex]}
                >
                  {msg.geometry.explanation}
                </ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [state, setState] = useState<TutorState>(INITIAL_STATE);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMathToolbar, setShowMathToolbar] = useState(false);
  const [geminiKeys, setGeminiKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem("gemini_api_keys");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedKeyIdx, setSelectedKeyIdx] = useState<number | null>(() => {
    const saved = localStorage.getItem("selected_gemini_key_idx");
    return saved ? parseInt(saved) : null;
  });
  const [newKey, setNewKey] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [showImageMenu, setShowImageMenu] = useState(false);

  useEffect(() => {
    localStorage.setItem("gemini_api_keys", JSON.stringify(geminiKeys));
  }, [geminiKeys]);

  useEffect(() => {
    if (selectedKeyIdx !== null) {
      localStorage.setItem("selected_gemini_key_idx", selectedKeyIdx.toString());
    } else {
      localStorage.removeItem("selected_gemini_key_idx");
    }
  }, [selectedKeyIdx]);

  const addGeminiKey = () => {
    if (newKey.trim()) {
      const keysToAdd = newKey
        .split("\n")
        .map(k => k.trim())
        .filter(k => k.length > 0 && !geminiKeys.includes(k));
      
      if (keysToAdd.length > 0) {
        const updated = [...geminiKeys, ...keysToAdd];
        setGeminiKeys(updated);
        if (selectedKeyIdx === null) setSelectedKeyIdx(updated.length - keysToAdd.length);
      }
      setNewKey("");
    }
  };

  const removeGeminiKey = (index: number) => {
    const updated = geminiKeys.filter((_, i) => i !== index);
    setGeminiKeys(updated);
    if (selectedKeyIdx === index) {
      setSelectedKeyIdx(updated.length > 0 ? 0 : null);
    } else if (selectedKeyIdx !== null && selectedKeyIdx > index) {
      setSelectedKeyIdx(selectedKeyIdx - 1);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const triggerCheer = () => {
    // Confetti effect
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    // Sound effect
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3");
    audio.volume = 0.3;
    audio.play().catch(e => console.log("Audio play failed", e));
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.history, isLoading]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const insertMathSymbol = (symbol: string) => {
    if (!inputRef.current) return;
    
    const start = inputRef.current.selectionStart || 0;
    const end = inputRef.current.selectionEnd || 0;
    const text = input;
    const before = text.substring(0, start);
    const after = text.substring(end);
    
    const newValue = before + symbol + after;
    setInput(newValue);
    
    // Focus back and set cursor position
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        // If it's a template like \frac{}{}, put cursor inside first bracket
        let offset = symbol.length;
        if (symbol.includes("{}")) {
          offset = symbol.indexOf("{}") + 1;
        } else if (symbol.includes("()")) {
          offset = symbol.indexOf("()") + 1;
        } else if (symbol === "$$") {
          offset = 1;
        } else if (symbol === "$$$$") {
          offset = 2;
        }
        const newPos = start + offset;
        inputRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const clearInput = () => {
    setInput("");
    inputRef.current?.focus();
  };

  const backspaceInput = () => {
    if (!inputRef.current) return;
    const start = inputRef.current.selectionStart || 0;
    const end = inputRef.current.selectionEnd || 0;
    
    if (start === end && start > 0) {
      const newValue = input.substring(0, start - 1) + input.substring(end);
      setInput(newValue);
      setTimeout(() => {
        inputRef.current?.setSelectionRange(start - 1, start - 1);
        inputRef.current?.focus();
      }, 0);
    } else if (start !== end) {
      const newValue = input.substring(0, start) + input.substring(end);
      setInput(newValue);
      setTimeout(() => {
        inputRef.current?.setSelectionRange(start, start);
        inputRef.current?.focus();
      }, 0);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMessage: Message = { 
      role: "user", 
      text: input,
      image: selectedImage || undefined
    };
    const newHistory = [...state.history, userMessage];
    
    setState(prev => ({
      ...prev,
      history: newHistory,
    }));
    
    const currentInput = input;
    const currentImage = selectedImage;
    
    setInput("");
    setSelectedImage(null);
    setIsLoading(true);

    // Play send sound
    const sendAudio = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
    sendAudio.volume = 0.2;
    sendAudio.play().catch(e => console.log("Audio play failed", e));

    try {
      let responseText = "";
      let extractedName = null;
      let geometry = null;
      let success = false;
      let errorMsg = "";

      // Try keys starting from the selected one
      const startIndex = selectedKeyIdx !== null ? selectedKeyIdx : 0;
      const keysToTry = geminiKeys.length > 0 ? geminiKeys : [undefined];
      
      for (let i = 0; i < keysToTry.length; i++) {
        const currentIdx = (startIndex + i) % keysToTry.length;
        const activeKey = keysToTry[currentIdx];
        
        try {
          const result = await getTutorResponse(
            currentInput,
            state.history,
            state.level,
            state.step,
            state.attempts,
            state.userName,
            state.grade,
            state.subject,
            activeKey,
            currentImage || undefined
          );
          
          // Check if the response indicates an API error (this is a bit tricky since getTutorResponse catches errors)
          // We'll need to modify getTutorResponse to return an error flag or throw.
          // For now, let's assume if it returns the "vui lòng cấu hình" message, it failed.
          if (result.text.includes("cấu hình Gemini API Key") && keysToTry.length > 1) {
            continue;
          }

          responseText = result.text;
          extractedName = result.extractedName;
          geometry = result.geometry;
          success = true;
          
          // Update selected key if we successfully used a different one
          if (currentIdx !== selectedKeyIdx && selectedKeyIdx !== null) {
            setSelectedKeyIdx(currentIdx);
          }

          // Check for positive feedback to trigger cheer
          const positiveKeywords = ["giỏi lắm", "chính xác", "khen em", "tuyệt vời", "đúng rồi"];
          if (positiveKeywords.some(word => result.text.toLowerCase().includes(word))) {
            triggerCheer();
          }

          break;
        } catch (err) {
          console.error(`Lỗi với key ${currentIdx}:`, err);
          errorMsg = err instanceof Error ? err.message : String(err);
          if (i === keysToTry.length - 1) throw err;
        }
      }

      if (!success) {
        throw new Error(errorMsg || "Không thể kết nối với AI.");
      }

      // Play arrival sound
      const arrivalAudio = new Audio("https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3");
      arrivalAudio.volume = 0.2;
      arrivalAudio.play().catch(e => console.log("Audio play failed", e));

      const tutorMessage: Message = { 
        role: "model", 
        text: responseText,
        geometry: geometry || undefined
      };
      
      setState(prev => ({
        ...prev,
        history: [...newHistory, tutorMessage],
        attempts: prev.attempts + 1,
        userName: extractedName || prev.userName
      }));
    } catch (error) {
      console.error("Lỗi khi lấy phản hồi từ gia sư:", error);
      const errorMessage: Message = {
        role: "model",
        text: "Thầy đang gặp một chút khó khăn khi suy nghĩ. Em có thể thử kiểm tra lại API Key hoặc diễn đạt lại câu hỏi nhé."
      };
      setState(prev => ({
        ...prev,
        history: [...newHistory, errorMessage]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const resetTutor = () => {
    setState(prev => ({
      ...INITIAL_STATE,
      userName: prev.userName,
      grade: prev.grade,
      subject: prev.subject,
      isSetupComplete: prev.isSetupComplete,
      level: prev.level
    }));
  };

  const setLevel = (level: Level) => {
    setState(prev => ({ ...prev, level }));
    setShowSettings(false);
  };

  const levelLabels: Record<Level, string> = {
    beginner: "Cơ bản",
    intermediate: "Trung bình",
    advanced: "Nâng cao",
  };

  const handleSetupComplete = (data: { name: string, grade: string, subject: string }) => {
    setState(prev => ({
      ...prev,
      userName: data.name,
      grade: data.grade,
      subject: data.subject,
      isSetupComplete: true
    }));
  };

  return (
    <div className="flex flex-col h-dvh w-full md:max-w-4xl md:mx-auto bg-white md:shadow-[0_0_100px_-20px_rgba(0,0,0,0.1)] overflow-hidden md:border-x border-slate-100 relative">
      <AnimatePresence>
        {!state.isSetupComplete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
            <SetupScreen onComplete={handleSetupComplete} />
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 flex items-center justify-between px-4 py-3 md:px-8 md:py-6 bg-white/90 backdrop-blur-md border-b border-slate-100 z-40 shadow-sm">
        <div className="flex items-center gap-2.5 md:gap-4">
          <div className="p-2 md:p-3 bg-brand-50 rounded-xl md:rounded-2xl shadow-sm rotate-3">
            <GraduationCap className="w-5 h-5 md:w-7 md:h-7 text-brand-600 -rotate-3" />
          </div>
          <div>
            <h1 className="font-bold text-base md:text-xl text-slate-800 tracking-tight leading-tight">
              {state.userName ? `Chào, ${state.userName}!` : "Gia sư Socratic (Thầy)"}
            </h1>
            <div className="flex flex-wrap gap-x-2 md:gap-x-3 gap-y-1 mt-0.5">
              <div className="flex items-center gap-1 md:gap-1.5 px-1.5 md:px-2 py-0.5 bg-brand-50 rounded-full">
                <BrainCircuit className="w-2.5 h-2.5 md:w-3 md:h-3 text-brand-600" />
                <span className="text-[9px] md:text-[11px] font-bold text-brand-700 uppercase tracking-wider">
                  {levelLabels[state.level]}
                </span>
              </div>
              {state.grade && (
                <div className="flex items-center gap-1 md:gap-1.5 px-1.5 md:px-2 py-0.5 bg-accent-50 rounded-full">
                  <BookOpen className="w-2.5 h-2.5 md:w-3 md:h-3 text-accent-600" />
                  <span className="text-[9px] md:text-[11px] font-bold text-accent-700 uppercase tracking-wider">
                    {state.grade} • {state.subject}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 md:gap-2">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 md:p-2.5 rounded-lg md:rounded-xl transition-all ${showSettings ? "bg-brand-600 text-white shadow-lg shadow-brand-200" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"}`}
            title="Cài đặt"
          >
            <Settings2 className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <button 
            onClick={resetTutor}
            className="p-2 md:p-2.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-lg md:rounded-xl transition-all"
            title="Làm mới phiên học"
          >
            <RefreshCw className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>
      </header>

      {/* Settings Panel - Full Screen Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 md:p-8"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-4xl bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 md:px-10 md:py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-100 rounded-xl text-brand-600">
                    <Settings2 className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <h2 className="text-lg md:text-2xl font-bold text-slate-800 tracking-tight">Cài đặt hệ thống</h2>
                </div>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                  {/* Left Column: Student Info & Level */}
                  <div className="space-y-8">
                    <section>
                      <h3 className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                        <BrainCircuit className="w-4 h-4" />
                        Trình độ học tập
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {(['beginner', 'intermediate', 'advanced'] as Level[]).map((l) => (
                          <button
                            key={l}
                            onClick={() => setLevel(l)}
                            className={`flex-1 px-4 py-3 rounded-2xl text-xs md:text-sm font-bold transition-all border-2 ${
                              state.level === l 
                                ? "bg-brand-600 border-brand-600 text-white shadow-lg shadow-brand-100" 
                                : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                            }`}
                          >
                            {levelLabels[l]}
                          </button>
                        ))}
                      </div>
                    </section>

                    <section className="pt-8 border-t border-slate-100">
                      <h3 className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                        <User className="w-4 h-4" />
                        Thông tin học sinh
                      </h3>
                      <div className="p-5 bg-slate-50 rounded-[2rem] flex items-center justify-between border border-slate-100">
                        <div>
                          <p className="text-sm md:text-base font-bold text-slate-800">{state.userName}</p>
                          <p className="text-xs text-slate-500 font-medium">{state.grade} • {state.subject}</p>
                        </div>
                        <button 
                          onClick={() => {
                            setState(prev => ({ ...prev, isSetupComplete: false }));
                            setShowSettings(false);
                          }}
                          className="text-xs font-bold text-brand-600 hover:text-brand-700 px-4 py-2 bg-white rounded-xl shadow-sm transition-all active:scale-95"
                        >
                          Thay đổi
                        </button>
                      </div>
                    </section>
                  </div>

                  {/* Right Column: API Keys */}
                  <div className="space-y-6">
                    <h3 className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Gemini API Keys
                    </h3>

                    {/* Quick Links Section - Prominent */}
                    <div className="p-5 bg-brand-50 rounded-[2rem] border border-brand-100">
                      <h4 className="text-[11px] font-bold text-brand-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Hướng dẫn & Liên kết nhanh
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <a 
                          href="https://aistudio.google.com/app/apikey" 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center justify-center gap-3 py-3 bg-white border-2 border-brand-200 rounded-2xl text-xs font-bold text-brand-600 hover:bg-brand-50 transition-all shadow-sm"
                        >
                          <Key className="w-4 h-4" />
                          Lấy Key tại đây
                        </a>
                        {/* DÁN LINK YOUTUBE CỦA BẠN VÀO ĐÂY */}
                        <a 
                          href="https://www.youtube.com/watch?v=2PivCPuNliU" 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center justify-center gap-3 py-3 bg-red-50 border-2 border-red-100 rounded-2xl text-xs font-bold text-red-600 hover:bg-red-100 transition-all shadow-sm"
                        >
                          <Youtube className="w-4 h-4" />
                          Video hướng dẫn
                        </a>
                      </div>
                    </div>

                    {/* Input Section */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nhập API Key tại đây</label>
                      <textarea 
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            addGeminiKey();
                          }
                        }}
                        placeholder="Dán một hoặc nhiều API Key (mỗi dòng một key)..."
                        rows={3}
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] text-sm focus:border-brand-400 focus:bg-white outline-none transition-all font-medium resize-none shadow-inner"
                      />
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] text-slate-400 font-medium italic">
                          Ctrl+Enter để thêm nhanh
                        </span>
                        <button 
                          onClick={addGeminiKey}
                          disabled={!newKey.trim()}
                          className="px-8 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-100 flex items-center justify-center gap-2 font-bold text-sm"
                        >
                          <Plus className="w-5 h-5" />
                          Thêm vào danh sách
                        </button>
                      </div>
                    </div>

                    {/* Key List */}
                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar border-t border-slate-100 pt-5">
                      {geminiKeys.map((key, idx) => (
                        <div 
                          key={idx} 
                          className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                            selectedKeyIdx === idx 
                              ? "bg-brand-50 border-brand-300 shadow-sm" 
                              : "bg-white border-slate-50 hover:border-slate-100"
                          }`}
                          onClick={() => setSelectedKeyIdx(idx)}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedKeyIdx === idx ? "border-brand-600 bg-brand-600" : "border-slate-200"
                          }`}>
                            {selectedKeyIdx === idx && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <div className="flex-1 truncate font-mono text-xs font-medium text-slate-600">
                            {key.substring(0, 12)}...{key.substring(key.length - 6)}
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              removeGeminiKey(idx);
                            }}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {geminiKeys.length === 0 && (
                        <div className="p-8 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 text-center">
                          <p className="text-xs text-slate-400 font-medium">Chưa có Gemini API key nào được lưu.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-5 md:space-y-8 bg-[#fcfdfe] relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#7c3aed 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        {state.history.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-5 md:space-y-6 relative z-10">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-200 blur-3xl opacity-30 animate-pulse" />
              <div className="relative p-5 md:p-6 bg-brand-50 rounded-[2rem] md:rounded-[2.5rem] text-brand-600 shadow-inner rotate-3">
                <BookOpen className="w-10 h-10 md:w-16 md:h-16 -rotate-3" />
              </div>
            </div>
            <div className="max-w-sm px-6">
              <h2 className="text-xl md:text-3xl font-bold text-slate-800 tracking-tight">Sẵn sàng học chưa?</h2>
              <p className="text-xs md:text-base text-slate-500 mt-2 md:mt-3 font-medium leading-relaxed">
                Nhập một bài tập hoặc gửi hình ảnh, Thầy sẽ giúp em giải quyết từng bước một theo cách dễ hiểu nhất.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 md:gap-2 mt-2 md:mt-4">
              {["Giải toán lớp 9", "Học Tiếng Anh", "Bài tập Vật lý"].map((tag) => (
                <span key={tag} className="px-3 py-1.5 md:px-4 md:py-2 bg-white border border-slate-100 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-bold text-slate-400 shadow-sm">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {state.history.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} relative z-10`}
            >
              <MessageBubble msg={msg} id={idx.toString()} />
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <div className="flex justify-start relative z-10">
            <div className="flex gap-3 md:gap-4 max-w-[85%]">
              <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-2xl bg-white border border-slate-100 text-brand-600 flex items-center justify-center shadow-sm">
                <Bot className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className="p-4 md:p-5 bg-white border border-slate-50 rounded-[1.5rem] rounded-tl-none shadow-sm flex items-center gap-2">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="w-2 h-2 bg-brand-400 rounded-full" 
                />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}
                  className="w-2 h-2 bg-brand-400 rounded-full" 
                />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }}
                  className="w-2 h-2 bg-brand-400 rounded-full" 
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-white border-t border-slate-50 pb-safe relative z-30">
        {/* Floating selected image preview */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div 
              initial={{ y: 20, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.8 }}
              className="absolute bottom-full left-6 mb-4 z-40"
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-brand-400 blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                <img 
                  src={selectedImage} 
                  className="h-24 md:h-32 w-auto rounded-[1.5rem] border-4 border-white shadow-2xl object-cover relative z-10"
                  alt="Preview"
                  referrerPolicy="no-referrer"
                />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 shadow-xl hover:bg-red-600 transition-all active:scale-90 z-20"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Real-time LaTeX Preview */}
        <AnimatePresence>
          {input.includes("$") && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: 10 }}
              animate={{ height: "auto", opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: 10 }}
              className="mb-4 p-4 bg-brand-50/30 border-2 border-brand-100/50 rounded-[1.5rem] overflow-hidden shadow-inner"
            >
              <div className="text-[10px] font-bold text-brand-600 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                Xem trước công thức
              </div>
              <div className="markdown-body text-slate-700 font-medium">
                <ReactMarkdown 
                  remarkPlugins={[remarkMath]} 
                  rehypePlugins={[rehypeKatex]}
                >
                  {input}
                </ReactMarkdown>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => setShowMathToolbar(!showMathToolbar)}
              className={`px-4 py-2 rounded-2xl flex items-center gap-2.5 transition-all font-bold text-[11px] uppercase tracking-wider border-2 ${
                showMathToolbar 
                  ? "bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-100" 
                  : "bg-white text-slate-500 border-slate-100 hover:border-brand-200"
              }`}
            >
              <Calculator className="w-4 h-4" />
              Công thức
            </button>
            
            <div className="relative">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <input 
                type="file" 
                ref={cameraInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                capture="environment"
                className="hidden"
              />
              <button 
                type="button"
                onClick={() => setShowImageMenu(!showImageMenu)}
                className={`p-2.5 rounded-2xl transition-all border-2 ${selectedImage ? "bg-accent-50 border-accent-200 text-accent-600" : "text-slate-400 border-slate-50 hover:bg-slate-50 hover:text-slate-600"}`}
                title="Gửi hình ảnh bài tập"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {showImageMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowImageMenu(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      className="absolute bottom-full left-0 mb-3 z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 min-w-[160px]"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          cameraInputRef.current?.click();
                          setShowImageMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors text-slate-700 font-bold text-sm"
                      >
                        <Camera className="w-5 h-5 text-brand-600" />
                        Chụp ảnh
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          fileInputRef.current?.click();
                          setShowImageMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors text-slate-700 font-bold text-sm"
                      >
                        <Upload className="w-5 h-5 text-accent-600" />
                        Tải ảnh lên
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {input && (
              <button 
                onClick={clearInput}
                className="p-2.5 text-slate-300 hover:text-red-400 transition-colors"
                title="Xóa tất cả"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Calculator-style Math Toolbar */}
        <AnimatePresence>
          {showMathToolbar && (
            <motion.div 
              initial={{ height: 0, opacity: 0, scale: 0.98 }}
              animate={{ height: "auto", opacity: 1, scale: 1 }}
              exit={{ height: 0, opacity: 0, scale: 0.98 }}
              className="mb-4 bg-slate-900 rounded-[2rem] border border-slate-800 p-5 md:p-6 shadow-2xl overflow-hidden flex flex-col relative"
            >
              {/* Decorative glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-brand-500 blur-md opacity-50" />

              <div className="flex justify-between items-center mb-5 flex-shrink-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  Bàn phím toán học
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={backspaceInput}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-[11px] font-bold hover:bg-slate-700 transition-all active:scale-95 flex items-center gap-2 border border-slate-700"
                  >
                    <RefreshCw className="w-3 h-3 rotate-180" /> Xóa
                  </button>
                  <button
                    type="button"
                    onClick={clearInput}
                    className="px-4 py-2 bg-red-900/30 text-red-400 rounded-xl text-[11px] font-bold hover:bg-red-900/50 transition-all active:scale-95 border border-red-900/50"
                  >
                    AC
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[40vh] md:max-h-none pr-1 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Numbers & Basic Operators */}
                  <div className="md:col-span-5 grid grid-cols-4 gap-1 md:gap-2">
                    {MATH_GROUPS[0].symbols.map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => insertMathSymbol(s.value)}
                        className={`h-9 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl text-sm md:text-lg font-bold transition-all active:scale-90 shadow-sm border-b-4 ${
                          s.type === "operator" 
                            ? "bg-brand-600 text-white border-brand-800 hover:bg-brand-500" 
                            : s.type === "variable"
                            ? "bg-indigo-600 text-white border-indigo-800 hover:bg-indigo-500 italic font-serif"
                            : "bg-slate-800 text-white border-slate-950 hover:bg-slate-700"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {/* Advanced Functions */}
                  <div className="md:col-span-4 flex flex-col gap-2 md:gap-3">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest ml-1">{MATH_GROUPS[1].name}</span>
                    <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                      {MATH_GROUPS[1].symbols.map((s) => (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => insertMathSymbol(s.value)}
                          className="h-9 md:h-11 flex items-center justify-center bg-slate-800/50 border-b-4 border-slate-950 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold text-slate-300 hover:bg-slate-800 transition-all active:scale-90"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Formulas */}
                  <div className="md:col-span-3 flex flex-col gap-2 md:gap-3">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest ml-1">{MATH_GROUPS[2].name}</span>
                    <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                      {MATH_GROUPS[2].symbols.map((s) => (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => insertMathSymbol(s.value)}
                          className="h-9 md:h-11 flex items-center justify-center bg-brand-900/20 border-b-4 border-brand-950 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-bold text-brand-300 hover:bg-brand-900/40 transition-all active:scale-90"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form 
          onSubmit={handleSendMessage}
          className="relative flex items-center gap-3"
        >
          <div className="relative flex-1 group">
            <div className="absolute inset-0 bg-brand-100 blur-xl opacity-0 group-focus-within:opacity-30 transition-opacity" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi Thầy bất cứ điều gì..."
              className="w-full px-5 py-3.5 md:px-6 md:py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl md:rounded-[2rem] focus:border-brand-200 focus:bg-white outline-none transition-all font-medium text-sm md:text-base text-slate-800 shadow-inner relative z-10"
              disabled={isLoading}
            />
          </div>
          <button 
            type="submit"
            disabled={(!input.trim() && !selectedImage) || isLoading}
            className="p-3.5 md:p-5 bg-brand-600 text-white rounded-2xl md:rounded-[1.5rem] hover:bg-brand-700 disabled:opacity-50 disabled:scale-95 transition-all shadow-xl shadow-brand-100 active:scale-90 relative z-10"
          >
            <Send className={`w-5 h-5 md:w-6 md:h-6 ${isLoading ? "animate-pulse" : ""}`} />
          </button>
        </form>
      </div>
    </div>
  );
}
