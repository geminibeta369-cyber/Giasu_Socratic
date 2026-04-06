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
  Key
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { getTutorResponse } from "./services/geminiService";
import { Message, Level, TutorState } from "./types";

const INITIAL_STATE: TutorState = {
  history: [],
  level: "beginner",
  step: 1,
  attempts: 1,
  currentProblem: null,
  userName: null,
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

function MessageBubble({ msg }: { msg: Message }) {
  const [showSolution, setShowSolution] = useState(false);

  return (
    <div className={`flex gap-2 md:gap-3 max-w-[90%] md:max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center ${
        msg.role === "user" ? "bg-brand-600 text-white" : "bg-white border border-slate-200 text-brand-600 shadow-sm"
      }`}>
        {msg.role === "user" ? <User className="w-4 h-4 md:w-5 md:h-5" /> : <Bot className="w-4 h-4 md:w-5 md:h-5" />}
      </div>
      
      <div className={`p-3 md:p-4 rounded-2xl shadow-sm space-y-2 md:space-y-3 ${
        msg.role === "user" 
          ? "bg-brand-600 text-white rounded-tr-none" 
          : "bg-white border border-slate-100 text-slate-800 rounded-tl-none"
      }`}>
        {msg.image && (
          <div className="rounded-lg overflow-hidden border border-white/20 max-w-sm">
            <img 
              src={msg.image} 
              alt="Bài tập" 
              className="w-full h-auto object-contain bg-black/5"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
        <div className="markdown-body">
          <ReactMarkdown 
            remarkPlugins={[remarkMath]} 
            rehypePlugins={[rehypeKatex]}
          >
            {msg.text}
          </ReactMarkdown>
        </div>

        {msg.similarExercise && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-2 text-brand-600 font-bold text-xs uppercase tracking-wider">
              <BrainCircuit className="w-4 h-4" />
              Bài tập tương tự gợi ý
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm italic text-slate-700">
              <ReactMarkdown 
                remarkPlugins={[remarkMath]} 
                rehypePlugins={[rehypeKatex]}
              >
                {msg.similarExercise.problem}
              </ReactMarkdown>
            </div>
            <button
              onClick={() => setShowSolution(!showSolution)}
              className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              {showSolution ? "Ẩn hướng dẫn giải" : "Xem hướng dẫn giải"}
            </button>
            <AnimatePresence>
              {showSolution && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 bg-brand-50 rounded-xl border border-brand-100 text-sm text-slate-700">
                    <div className="font-bold text-brand-700 mb-1 text-[10px] uppercase tracking-widest">Hướng dẫn giải:</div>
                    <ReactMarkdown 
                      remarkPlugins={[remarkMath]} 
                      rehypePlugins={[rehypeKatex]}
                    >
                      {msg.similarExercise.solutionGuide}
                    </ReactMarkdown>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
      const updated = [...geminiKeys, newKey.trim()];
      setGeminiKeys(updated);
      if (selectedKeyIdx === null) setSelectedKeyIdx(updated.length - 1);
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

    try {
      const activeKey = selectedKeyIdx !== null ? geminiKeys[selectedKeyIdx] : undefined;
      const { text: responseText, extractedName, similarExercise } = await getTutorResponse(
        currentInput,
        state.history,
        state.level,
        state.step,
        state.attempts,
        state.userName,
        activeKey,
        currentImage || undefined
      );

      const tutorMessage: Message = { 
        role: "model", 
        text: responseText,
        similarExercise: similarExercise || undefined
      };
      
      setState(prev => ({
        ...prev,
        history: [...newHistory, tutorMessage],
        attempts: prev.attempts + 1,
        userName: extractedName || prev.userName
      }));
    } catch (error) {
      console.error("Lỗi khi lấy phản hồi từ gia sư:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetTutor = () => {
    setState(INITIAL_STATE);
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

  return (
    <div className="flex flex-col h-dvh w-full md:max-w-4xl md:mx-auto bg-white md:shadow-xl overflow-hidden md:border-x border-slate-200">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 bg-brand-600 text-white shadow-md z-10">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="p-1.5 md:p-2 bg-white/20 rounded-lg">
            <GraduationCap className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="font-bold text-base md:text-lg leading-tight">
              {state.userName ? `Chào, ${state.userName}!` : "Gia sư Socratic (Thầy)"}
            </h1>
            <p className="text-[10px] md:text-xs text-brand-100 flex items-center gap-1">
              <BrainCircuit className="w-3 h-3" />
              Trình độ: {levelLabels[state.level]}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Cài đặt"
          >
            <Settings2 className="w-5 h-5" />
          </button>
          <button 
            onClick={resetTutor}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Làm mới phiên học"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-slate-50 border-b border-slate-200 overflow-hidden"
          >
            <div className="p-4 flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                Trình độ học tập
              </h3>
              <div className="flex gap-2">
                {(['beginner', 'intermediate', 'advanced'] as Level[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      state.level === l 
                        ? "bg-brand-600 text-white shadow-md" 
                        : "bg-white text-slate-600 border border-slate-200 hover:border-brand-300"
                    }`}
                  >
                    {levelLabels[l]}
                  </button>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                  <Key className="w-4 h-4" />
                  Gemini API Keys
                </h3>
                
                <div className="space-y-2 mb-3">
                  {geminiKeys.map((key, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${
                        selectedKeyIdx === idx 
                          ? "bg-brand-50 border-brand-300 ring-1 ring-brand-300" 
                          : "bg-white border-slate-200 hover:border-brand-200"
                      }`}
                      onClick={() => setSelectedKeyIdx(idx)}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedKeyIdx === idx ? "border-brand-600 bg-brand-600" : "border-slate-300"
                      }`}>
                        {selectedKeyIdx === idx && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                      <div className="flex-1 truncate font-mono text-xs text-slate-500">
                        {key.substring(0, 8)}...{key.substring(key.length - 4)}
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeGeminiKey(idx);
                        }}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {geminiKeys.length === 0 && (
                    <p className="text-xs text-slate-400 italic">Chưa có Gemini API key nào được lưu.</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <input 
                    type="password"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="Nhập Gemini API Key mới..."
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                  <button 
                    onClick={addGeminiKey}
                    disabled={!newKey.trim()}
                    className="p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Key được chọn sẽ được dùng để gọi AI. Nếu không có key nào được chọn, ứng dụng sẽ dùng key mặc định (nếu có).
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 bg-slate-50/50">
        {state.history.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-70">
            <div className="p-4 bg-brand-100 rounded-full text-brand-600">
              <BookOpen className="w-10 h-10 md:w-12 md:h-12" />
            </div>
            <div className="max-w-xs px-4">
              <h2 className="text-lg md:text-xl font-bold text-slate-800">Sẵn sàng học chưa?</h2>
              <p className="text-sm text-slate-600 mt-2">
                Nhập một bài tập hoặc gửi hình ảnh, Thầy sẽ giúp em giải quyết từng bước một.
              </p>
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {state.history.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <MessageBubble msg={msg} />
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-2 md:gap-3 max-w-[85%]">
              <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-white border border-slate-200 text-brand-600 flex items-center justify-center shadow-sm">
                <Bot className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="p-3 md:p-4 bg-white border border-slate-100 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5 md:gap-2">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-1.5 h-1.5 md:w-2 md:h-2 bg-brand-400 rounded-full" 
                />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                  className="w-1.5 h-1.5 md:w-2 md:h-2 bg-brand-400 rounded-full" 
                />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                  className="w-1.5 h-1.5 md:w-2 md:h-2 bg-brand-400 rounded-full" 
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <div className="p-3 md:p-4 bg-white border-t border-slate-200 pb-safe">
        {/* Selected Image Preview */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="relative mb-2 inline-block"
            >
              <img 
                src={selectedImage} 
                className="h-16 md:h-20 w-auto rounded-lg border-2 border-brand-500 object-cover shadow-sm"
                alt="Preview"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Real-time LaTeX Preview */}
        <AnimatePresence>
          {input.includes("$") && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-3 p-3 bg-brand-50/50 border border-brand-100 rounded-xl overflow-hidden"
            >
              <div className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <BrainCircuit className="w-3 h-3" />
                Xem trước công thức
              </div>
              <div className="markdown-body text-slate-700">
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

        {/* Math Toolbar Toggle */}
        <div className="flex items-center justify-between mb-2">
          <button 
            type="button"
            onClick={() => setShowMathToolbar(!showMathToolbar)}
            className={`text-[10px] md:text-xs font-medium px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 md:gap-2 transition-all shadow-sm border ${
              showMathToolbar 
                ? "bg-brand-600 text-white border-brand-600 shadow-brand-200" 
                : "bg-white text-slate-600 border-slate-200 hover:border-brand-300"
            }`}
          >
            <Calculator className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Máy tính Công thức
          </button>
          
          <div className="flex items-center gap-1 md:gap-2">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 md:p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
              title="Gửi hình ảnh bài tập"
            >
              <ImageIcon className="w-4.5 h-4.5 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        {/* Calculator-style Math Toolbar */}
        <AnimatePresence>
          {showMathToolbar && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-3 bg-slate-800 rounded-xl md:rounded-2xl border border-slate-700 p-3 md:p-4 shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center mb-2 md:mb-3 flex-shrink-0">
                <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 md:gap-2">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-brand-500 animate-pulse" />
                  Math Keypad
                </span>
                <div className="flex gap-1.5 md:gap-2">
                  <button
                    type="button"
                    onClick={backspaceInput}
                    className="px-2 md:px-3 py-1 md:py-1.5 bg-slate-700 text-slate-200 rounded-lg text-[10px] md:text-xs font-bold hover:bg-slate-600 transition-colors flex items-center gap-1 shadow-sm active:translate-y-0.5"
                  >
                    <RefreshCw className="w-2.5 h-2.5 md:w-3 md:h-3 rotate-180" /> Xóa
                  </button>
                  <button
                    type="button"
                    onClick={clearInput}
                    className="px-2 md:px-3 py-1 md:py-1.5 bg-red-900/50 text-red-200 rounded-lg text-[10px] md:text-xs font-bold hover:bg-red-800 transition-colors shadow-sm active:translate-y-0.5"
                  >
                    AC
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[35vh] md:max-h-none pr-1 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-4">
                  {/* Numbers & Basic Operators (Calculator Style) */}
                  <div className="md:col-span-5 grid grid-cols-4 gap-1.5 md:gap-2">
                    {MATH_GROUPS[0].symbols.map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => insertMathSymbol(s.value)}
                        className={`h-9 md:h-11 flex items-center justify-center rounded-lg md:rounded-xl text-sm md:text-lg font-bold transition-all active:translate-y-0.5 shadow-[0_2px_0_0_rgba(0,0,0,0.2)] md:shadow-[0_4px_0_0_rgba(0,0,0,0.2)] border-b-2 ${
                          s.type === "operator" 
                            ? "bg-brand-600 text-white border-brand-800 hover:bg-brand-500" 
                            : s.type === "variable"
                            ? "bg-indigo-600 text-white border-indigo-800 hover:bg-indigo-500 italic"
                            : "bg-slate-700 text-white border-slate-900 hover:bg-slate-600"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {/* Advanced Functions */}
                  <div className="md:col-span-4 flex flex-col gap-1.5 md:gap-2">
                    <span className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-wider">{MATH_GROUPS[1].name}</span>
                    <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                      {MATH_GROUPS[1].symbols.map((s) => (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => insertMathSymbol(s.value)}
                          className="h-8 md:h-10 flex items-center justify-center bg-slate-600 border-b-2 border-slate-900 rounded-lg md:rounded-xl text-[10px] md:text-sm font-medium text-slate-100 hover:bg-slate-500 transition-all active:translate-y-0.5 shadow-[0_2px_0_0_rgba(0,0,0,0.2)] md:shadow-[0_3px_0_0_rgba(0,0,0,0.2)]"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Formulas */}
                  <div className="md:col-span-3 flex flex-col gap-1.5 md:gap-2">
                    <span className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-wider">{MATH_GROUPS[2].name}</span>
                    <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                      {MATH_GROUPS[2].symbols.map((s) => (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => insertMathSymbol(s.value)}
                          className="h-8 md:h-10 flex items-center justify-center bg-brand-900/40 border-b-2 border-brand-950 rounded-lg md:rounded-xl text-[9px] md:text-xs font-semibold text-brand-200 hover:bg-brand-800/50 transition-all active:translate-y-0.5 shadow-[0_2px_0_0_rgba(0,0,0,0.2)] md:shadow-[0_3px_0_0_rgba(0,0,0,0.2)]"
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
          className="relative flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={state.history.length === 0 ? "Nhập bài toán hoặc gửi ảnh..." : "Câu trả lời..."}
              className="w-full pl-4 pr-4 py-3 md:py-3.5 bg-slate-100 border-none rounded-xl md:rounded-2xl focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none text-sm md:text-base text-slate-800 shadow-inner"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={(!input.trim() && !selectedImage) || isLoading}
            className={`p-3 md:p-3.5 rounded-xl md:rounded-2xl transition-all shadow-lg ${
              (!input.trim() && !selectedImage) || isLoading 
                ? "text-slate-400 bg-slate-100 cursor-not-allowed shadow-none" 
                : "text-white bg-brand-600 hover:bg-brand-700 active:scale-95"
            }`}
          >
            <Send className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </form>
        <p className="text-[10px] text-slate-400 mt-2.5 text-center flex items-center justify-center gap-1">
          <ChevronRight className="w-3 h-3" />
          Thầy sẽ hướng dẫn em giải từng bước. Sử dụng $...$ cho công thức toán học.
        </p>
      </div>
    </div>
  );
}
