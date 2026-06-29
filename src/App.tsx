import React, { useState, useEffect, useRef } from "react";
import { 
  Pill, 
  AlertCircle, 
  Info, 
  Send, 
  Calendar, 
  RotateCcw, 
  BookOpen, 
  Heart, 
  Trash2, 
  ShieldAlert, 
  Plus, 
  Check, 
  ChevronRight, 
  Menu, 
  X, 
  Search, 
  User, 
  Stethoscope,
  Activity,
  FileText,
  Clock,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";

// Types
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: string;
}

interface OfflineDrug {
  name: string;
  class: "bebas" | "bebas_terbatas" | "keras" | "narkotika";
  className: string;
  indications: string;
  dosage: string;
  instructions: string;
  sideEffects: string;
  warnings: string;
}

// Initial offline drug catalog for fast Indonesian reference
const OFFLINE_DRUGS: OfflineDrug[] = [
  {
    name: "Paracetamol",
    class: "bebas",
    className: "Obat Bebas",
    indications: "Meredakan demam, sakit kepala, sakit gigi, dan nyeri ringan.",
    dosage: "Dewasa: 500 mg - 1000 mg tiap 4-6 jam sekali (Maksimal 4000 mg/hari).",
    instructions: "Dapat diminum sebelum atau sesudah makan. Jika memiliki riwayat sensitif lambung, sebaiknya diminum setelah makan.",
    sideEffects: "Secara umum sangat aman jika sesuai dosis. Penggunaan berlebih berisiko merusak organ hati.",
    warnings: "Hindari meminum bersama obat demam lain yang mengandung paracetamol untuk mencegah overdosis."
  },
  {
    name: "Antasida DOEN",
    class: "bebas",
    className: "Obat Bebas",
    indications: "Meredakan asam lambung tinggi, sakit maag, nyeri ulu hati, dan kembung.",
    dosage: "Dewasa: 1-2 tablet kunyah, 3-4 kali sehari.",
    instructions: "WAJIB dikunyah terlebih dahulu sebelum ditelan. Diminum 1 jam sebelum makan atau 2 jam setelah makan, serta menjelang tidur.",
    sideEffects: "Sembelit, diare ringan, mual jika dikonsumsi berlebihan.",
    warnings: "Beri jeda minimal 2 jam jika mengonsumsi obat lain karena antasida dapat menghambat penyerapan obat lain."
  },
  {
    name: "CTM (Chlorpheniramine Maleate)",
    class: "bebas_terbatas",
    className: "Obat Bebas Terbatas",
    indications: "Meredakan gejala alergi seperti gatal-gatal, biduran, pilek alergi, dan bersin-bersin.",
    dosage: "Dewasa: 1 tablet (4 mg), 3-4 kali sehari.",
    instructions: "Diminum sesudah makan dengan air putih.",
    sideEffects: "Efek samping utama adalah KANTUK BERAT, mulut kering, pandangan kabur.",
    warnings: "Sangat dilarang mengemudikan kendaraan atau mengoperasikan mesin setelah meminum obat ini!"
  },
  {
    name: "Ibuprofen",
    class: "bebas_terbatas",
    className: "Obat Bebas Terbatas",
    indications: "Meredakan nyeri sedang hingga berat (nyeri haid, sakit gigi, radang sendi) serta menurunkan demam.",
    dosage: "Dewasa: 200 mg - 400 mg, 3-4 kali sehari setelah makan.",
    instructions: "WAJIB diminum setelah makan untuk melindungi lapisan dinding lambung dari iritasi dan risiko maag.",
    sideEffects: "Nyeri lambung, mual, heartburn, pusing.",
    warnings: "Gunakan dengan sangat hati-hati pada penderita gangguan lambung (maag kronis) atau penderita asma."
  },
  {
    name: "Amoxicillin",
    class: "keras",
    className: "Obat Keras (Resep)",
    indications: "Mengobati infeksi bakteri pada saluran pernapasan, telinga, kulit, dan saluran kemih.",
    dosage: "Sesuai resep dokter (umumnya 250 mg - 500 mg tiap 8 jam sekali).",
    instructions: "Harus diminum dengan jeda waktu yang teratur (misalnya tiap 8 jam) dan WAJIB dihabiskan sesuai anjuran dokter meskipun gejala sudah hilang.",
    sideEffects: "Diare ringan, ruam kulit ringan, mual.",
    warnings: "Harus dibeli dengan resep dokter. Penghentian obat sebelum waktunya berisiko memicu resistensi bakteri (kebal antibiotik)!"
  },
  {
    name: "Captopril",
    class: "keras",
    className: "Obat Keras (Resep)",
    indications: "Menurunkan tekanan darah tinggi (hipertensi) dan gagal jantung.",
    dosage: "Sesuai petunjuk dokter (umumnya dimulai dari 12.5 mg - 25 mg, 2-3 kali sehari).",
    instructions: "WAJIB diminum saat perut kosong (1 jam sebelum makan atau 2 jam sesudah makan) agar obat terserap maksimal.",
    sideEffects: "Batuk kering yang mengganggu, pusing saat berdiri mendadak (hipotensi ortostatik), perubahan rasa di lidah.",
    warnings: "Merupakan obat resep dokter. Dilarang keras dikonsumsi oleh ibu hamil karena dapat merusak janin."
  }
];

// Modern design theme options
const THEMES = [
  {
    id: "mint",
    name: "Fresh Mint",
    icon: "🌿",
    primary: "emerald",
    bgGradient: "from-emerald-50/40 via-teal-50/20 to-slate-50/40",
    primaryBtn: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-100",
    secondaryBtn: "bg-emerald-50/60 border border-emerald-100 text-emerald-800 hover:bg-emerald-100/60 hover:border-emerald-200",
    accentText: "text-emerald-700",
    accentBg: "bg-emerald-50/60",
    accentBorder: "border-emerald-200/80",
    accentRing: "focus:border-emerald-500 focus:ring-emerald-200/50",
    chatBubble: "bg-emerald-600 text-white shadow-xs shadow-emerald-100",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200/60",
    logoGradient: "from-emerald-600 to-teal-500",
    pillActive: "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold",
    accentFill: "bg-emerald-600"
  },
  {
    id: "ocean",
    name: "Ocean Breeze",
    icon: "🌊",
    primary: "blue",
    bgGradient: "from-blue-50/40 via-sky-50/20 to-slate-50/40",
    primaryBtn: "bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-100",
    secondaryBtn: "bg-blue-50/60 border border-blue-100 text-blue-800 hover:bg-blue-100/60 hover:border-blue-200",
    accentText: "text-blue-700",
    accentBg: "bg-blue-50/60",
    accentBorder: "border-blue-200/80",
    accentRing: "focus:border-blue-500 focus:ring-blue-200/50",
    chatBubble: "bg-blue-600 text-white shadow-xs shadow-blue-100",
    badge: "bg-blue-50 text-blue-800 border-blue-200/60",
    logoGradient: "from-blue-600 to-sky-500",
    pillActive: "bg-blue-50 border-blue-300 text-blue-950 font-bold",
    accentFill: "bg-blue-600"
  },
  {
    id: "rose",
    name: "Rose Blossom",
    icon: "🌸",
    primary: "rose",
    bgGradient: "from-rose-50/40 via-pink-50/20 to-slate-50/40",
    primaryBtn: "bg-rose-500 hover:bg-rose-600 text-white shadow-xs shadow-rose-100",
    secondaryBtn: "bg-rose-50/60 border border-rose-100 text-rose-800 hover:bg-rose-100/60 hover:border-rose-200",
    accentText: "text-rose-700",
    accentBg: "bg-rose-50/60",
    accentBorder: "border-rose-200/80",
    accentRing: "focus:border-rose-400 focus:ring-rose-200/50",
    chatBubble: "bg-rose-500 text-white shadow-xs shadow-rose-100",
    badge: "bg-rose-50 text-rose-800 border-rose-200/60",
    logoGradient: "from-rose-500 to-pink-500",
    pillActive: "bg-rose-50 border-rose-300 text-rose-950 font-bold",
    accentFill: "bg-rose-500"
  },
  {
    id: "slate",
    name: "Slate Calm",
    icon: "⛰️",
    primary: "slate",
    bgGradient: "from-slate-150/60 via-zinc-100/40 to-slate-50/50",
    primaryBtn: "bg-slate-850 hover:bg-slate-900 text-white shadow-xs shadow-slate-200",
    secondaryBtn: "bg-slate-150 border border-slate-300 text-slate-800 hover:bg-slate-200",
    accentText: "text-slate-700",
    accentBg: "bg-slate-100",
    accentBorder: "border-slate-300",
    accentRing: "focus:border-slate-600 focus:ring-slate-300/50",
    chatBubble: "bg-slate-800 text-white shadow-xs",
    badge: "bg-slate-200/70 text-slate-800 border-slate-300/60",
    logoGradient: "from-slate-800 to-zinc-600",
    pillActive: "bg-slate-100 border-slate-400 text-slate-950 font-bold",
    accentFill: "bg-slate-800"
  }
];

export default function App() {
  // Theme state
  const [themeId, setThemeId] = useState<string>("mint");

  // Chat state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [inputText, setInputText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Layout tabs for mobile responsiveness
  const [activeTab, setActiveTab] = useState<"chat" | "classification" | "catalog">("chat");

  // Local Offline Catalog Search State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDrug, setSelectedDrug] = useState<(OfflineDrug & { interactions?: string }) | null>(null);

  // Online Drug Search State
  const [isSearchingDrug, setIsSearchingDrug] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<(OfflineDrug & { interactions?: string })[]>([]);

  // UI state
  const [showHistorySidebar, setShowHistorySidebar] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("zuzun_theme");
    if (savedTheme && THEMES.some(t => t.id === savedTheme)) {
      setThemeId(savedTheme);
    }
  }, []);

  const handleThemeChange = (id: string) => {
    setThemeId(id);
    localStorage.setItem("zuzun_theme", id);
  };

  const activeTheme = THEMES.find(t => t.id === themeId) || THEMES[0];

  // Initial welcome message from Apoteker Zuzun
  const getWelcomeMessage = (): Message => ({
    id: "welcome",
    role: "assistant",
    content: `Halo! Saya **Apoteker Zuzun**, senang bisa membantu Anda. 🌸

Sebagai Apoteker Virtual, saya siap memberikan informasi terpercaya tentang **dosis**, **efek samping**, **aturan minum**, hingga **interaksi obat-obatan** atau suplemen Anda. 

Apa yang ingin Anda konsultasikan hari ini? Silakan ajukan pertanyaan Anda secara langsung atau klik salah satu topik populer di bawah. Semoga sehat selalu!`,
    timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
  });

  // Load chat sessions from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("zuzun_chat_sessions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ChatSession[];
        if (parsed.length > 0) {
          setSessions(parsed);
          // Set the most recently updated session
          const sorted = [...parsed].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          setCurrentSessionId(sorted[0].id);
          return;
        }
      } catch (e) {
        console.error("Error loading saved sessions:", e);
      }
    }

    // Default first session if none exists
    const firstSessionId = "session_" + Date.now();
    const defaultSession: ChatSession = {
      id: firstSessionId,
      title: "Konsultasi Baru",
      messages: [getWelcomeMessage()],
      updatedAt: new Date().toISOString()
    };
    setSessions([defaultSession]);
    setCurrentSessionId(firstSessionId);
    localStorage.setItem("zuzun_chat_sessions", JSON.stringify([defaultSession]));
  }, []);

  // Load recent searches on mount
  useEffect(() => {
    const saved = localStorage.getItem("zuzun_recent_searches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading saved searches:", e);
      }
    }
  }, []);

  const saveRecentSearch = (drug: OfflineDrug & { interactions?: string }) => {
    const filtered = recentSearches.filter(d => d.name.toLowerCase() !== drug.name.toLowerCase());
    const updated = [drug, ...filtered].slice(0, 5); // Keep last 5 recent searches
    setRecentSearches(updated);
    localStorage.setItem("zuzun_recent_searches", JSON.stringify(updated));
  };

  // Save sessions to localStorage whenever they change
  const saveSessions = (updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
    localStorage.setItem("zuzun_chat_sessions", JSON.stringify(updatedSessions));
  };

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, currentSessionId, isLoading]);

  // Find active session
  const activeSession = sessions.find(s => s.id === currentSessionId);
  const activeMessages = activeSession ? activeSession.messages : [];

  // Start a new session
  const handleStartNewSession = () => {
    const newId = "session_" + Date.now();
    const newSession: ChatSession = {
      id: newId,
      title: "Konsultasi Baru",
      messages: [getWelcomeMessage()],
      updatedAt: new Date().toISOString()
    };
    const updated = [newSession, ...sessions];
    saveSessions(updated);
    setCurrentSessionId(newId);
    setErrorText(null);
    setInputText("");
    setActiveTab("chat");
    setShowHistorySidebar(false);
  };

  // Rename a session based on the first user query
  const renameSessionIfNeeded = (sessionId: string, firstQuery: string, currentSess: ChatSession) => {
    if (currentSess.title === "Konsultasi Baru") {
      const shortTitle = firstQuery.length > 25 ? firstQuery.substring(0, 25) + "..." : firstQuery;
      const updated = sessions.map(s => {
        if (s.id === sessionId) {
          return { ...s, title: shortTitle };
        }
        return s;
      });
      saveSessions(updated);
    }
  };

  // Delete a session
  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== sessionId);
    
    if (updated.length === 0) {
      // Recreate default if empty
      const newId = "session_" + Date.now();
      const defaultSession: ChatSession = {
        id: newId,
        title: "Konsultasi Baru",
        messages: [getWelcomeMessage()],
        updatedAt: new Date().toISOString()
      };
      saveSessions([defaultSession]);
      setCurrentSessionId(newId);
    } else {
      saveSessions(updated);
      if (currentSessionId === sessionId) {
        // Switch to the first available session
        setCurrentSessionId(updated[0].id);
      }
    }
  };

  // Send message to backend Gemini API
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading || !activeSession) return;

    const userMessage: Message = {
      id: "msg_" + Date.now() + "_user",
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    };

    // Update session locally with user message
    const updatedMessages = [...activeSession.messages, userMessage];
    const updatedSession = {
      ...activeSession,
      messages: updatedMessages,
      updatedAt: new Date().toISOString()
    };

    const updatedSessions = sessions.map(s => s.id === currentSessionId ? updatedSession : s);
    saveSessions(updatedSessions);
    setInputText("");
    setIsLoading(true);
    setErrorText(null);

    // Auto rename session based on first message
    if (activeMessages.length === 1) {
      renameSessionIfNeeded(currentSessionId, textToSend, activeSession);
    }

    try {
      // Send message history to Server API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error("Gagal terhubung dengan Apoteker Zuzun. Coba beberapa saat lagi.");
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: "msg_" + Date.now() + "_assistant",
        role: "assistant",
        content: data.text || "Mohon maaf, saya sedang mengalami kendala jaringan. Bisa diulangi pertanyaan Anda?",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      };

      // Save assistant response
      const finalMessages = [...updatedMessages, assistantMessage];
      const finalSession = {
        ...updatedSession,
        messages: finalMessages,
        updatedAt: new Date().toISOString()
      };

      saveSessions(sessions.map(s => s.id === currentSessionId ? finalSession : s));
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "Terjadi kesalahan koneksi.");
    } finally {
      setIsLoading(false);
    }
  };

  // Preset query handlers
  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question);
  };

  const handleOnlineSearch = async (queryName: string) => {
    if (!queryName.trim()) return;
    
    // Check local catalog first
    const localMatch = OFFLINE_DRUGS.find(d => d.name.toLowerCase() === queryName.trim().toLowerCase());
    if (localMatch) {
      setSelectedDrug(localMatch);
      saveRecentSearch(localMatch);
      setActiveTab("catalog");
      return;
    }

    // Check recent searches
    const recentMatch = recentSearches.find(d => d.name.toLowerCase() === queryName.trim().toLowerCase());
    if (recentMatch) {
      setSelectedDrug(recentMatch);
      setActiveTab("catalog");
      return;
    }

    setIsSearchingDrug(true);
    setSearchError(null);
    try {
      const response = await fetch("/api/search-drug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: queryName })
      });

      if (!response.ok) {
        throw new Error("Obat tidak ditemukan.");
      }

      const drugData = await response.json();
      const newDrug: OfflineDrug & { interactions?: string } = {
        name: drugData.name,
        class: drugData.class,
        className: drugData.className,
        indications: drugData.indications,
        dosage: drugData.dosage,
        instructions: drugData.instructions,
        sideEffects: drugData.sideEffects,
        warnings: drugData.warnings,
        interactions: drugData.interactions
      };

      setSelectedDrug(newDrug);
      saveRecentSearch(newDrug);
      setActiveTab("catalog");
    } catch (err: any) {
      console.error(err);
      setSearchError("Gagal mendapatkan informasi obat secara online. Coba periksa ejaan Anda.");
    } finally {
      setIsSearchingDrug(false);
    }
  };

  // Filter offline drug catalog
  const filteredDrugs = OFFLINE_DRUGS.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.indications.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`min-h-screen bg-gradient-to-br ${activeTheme.bgGradient} flex flex-col font-sans text-slate-850`} id="app_root">
      
      {/* HEADER BAR */}
      <header className="bg-white/85 backdrop-blur-md border-b border-slate-100 sticky top-0 z-30 shadow-xs" id="header_container">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3 shrink-0">
            <button 
              onClick={() => setShowHistorySidebar(!showHistorySidebar)}
              className="p-2 -ml-2 rounded-lg hover:bg-slate-100 lg:hidden text-slate-600 focus:outline-hidden"
              title="Tampilkan Riwayat"
              id="menu_toggle_button"
            >
              <Menu size={22} />
            </button>
            <div className="relative">
              <div className={`bg-gradient-to-tr ${activeTheme.logoGradient} text-white p-2 rounded-xl flex items-center justify-center shadow-xs`}>
                <Pill size={22} className="animate-pulse" />
              </div>
              <span className="absolute -bottom-1 -right-1 bg-emerald-500 w-3.5 h-3.5 rounded-full border-2 border-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">Apoteker Zuzun</h1>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${activeTheme.badge}`}>Virtual</span>
              </div>
              <p className="text-[10px] text-slate-500 flex items-center font-medium">
                <Activity size={11} className={`${activeTheme.accentText} mr-1 animate-pulse`} /> SIPA: 1992/SIPA-28.06/2026
              </p>
            </div>
          </div>

          {/* Dynamic Theme Picker - Modern & Minimalist (Desktop & Tablet) */}
          <div className="hidden md:flex items-center space-x-1.5 bg-slate-100/80 p-1 rounded-full border border-slate-200/60" id="desktop_theme_switcher">
            {THEMES.map((t) => {
              const isSelected = t.id === themeId;
              return (
                <button
                  key={t.id}
                  onClick={() => handleThemeChange(t.id)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-350 cursor-pointer ${
                    isSelected
                      ? "bg-white text-slate-900 shadow-sm scale-105"
                      : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                  }`}
                  title={`Ganti tema: ${t.name}`}
                >
                  <span>{t.icon}</span>
                  <span className="text-[11px] font-bold">{t.name}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Theme Trigger icon (Mobile Only) */}
          <div className="flex md:hidden items-center space-x-1" id="mobile_theme_switcher">
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200/50">
              {THEMES.map((t) => {
                const isSelected = t.id === themeId;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleThemeChange(t.id)}
                    className={`w-7 h-7 rounded-md flex items-center justify-center text-sm transition-all cursor-pointer ${
                      isSelected ? "bg-white shadow-xs scale-105" : "opacity-60 hover:opacity-100"
                    }`}
                    title={t.name}
                  >
                    {t.icon}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Stats or Right Items */}
          <div className="flex items-center space-x-2 shrink-0">
            <button 
              onClick={handleStartNewSession}
              className={`${activeTheme.secondaryBtn} text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center space-x-1.5 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer`}
              id="new_consultation_header_btn"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Mulai Sesi Baru</span>
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE TAB NAVIGATION (ONLY VISIBLE ON MOBILE) */}
      <div className="lg:hidden bg-white/95 backdrop-blur-md border-b border-slate-100 grid grid-cols-3 sticky top-16 z-20 shadow-xs" id="mobile_tabs">
        <button
          onClick={() => setActiveTab("chat")}
          className={`py-3 text-center text-xs font-bold border-b-2 flex flex-col items-center justify-center space-y-1 transition-all ${
            activeTab === "chat" 
              ? `border-b-2 border-slate-800 ${activeTheme.accentText} ${activeTheme.accentBg}` 
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          id="mobile_tab_chat"
        >
          <Stethoscope size={18} />
          <span>Konsultasi</span>
        </button>
        <button
          onClick={() => setActiveTab("classification")}
          className={`py-3 text-center text-xs font-bold border-b-2 flex flex-col items-center justify-center space-y-1 transition-all ${
            activeTab === "classification" 
              ? `border-b-2 border-slate-800 ${activeTheme.accentText} ${activeTheme.accentBg}` 
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          id="mobile_tab_classes"
        >
          <BookOpen size={18} />
          <span>Golongan Obat</span>
        </button>
        <button
          onClick={() => setActiveTab("catalog")}
          className={`py-3 text-center text-xs font-bold border-b-2 flex flex-col items-center justify-center space-y-1 transition-all ${
            activeTab === "catalog" 
              ? `border-b-2 border-slate-800 ${activeTheme.accentText} ${activeTheme.accentBg}` 
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          id="mobile_tab_catalog"
        >
          <Search size={18} />
          <span>Kamus Obat</span>
        </button>
      </div>

      {/* MAIN LAYOUT WRAPPER */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-0 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 relative overflow-hidden" id="main_layout">
        
        {/* SIDEBAR: CONVERSATION HISTORY (Left - 3 columns on Desktop, Slide-out drawer on Mobile) */}
        <aside 
          className={`
            fixed inset-y-0 left-0 z-40 w-72 bg-white/95 backdrop-blur-md border-r border-slate-100 p-4 flex flex-col transition-transform duration-300 lg:static lg:w-auto lg:h-auto lg:translate-x-0 lg:z-0 lg:col-span-3 lg:rounded-2xl lg:shadow-xs
            ${showHistorySidebar ? "translate-x-0" : "-translate-x-full"}
          `}
          id="history_sidebar"
        >
          {/* Sidebar Header for Mobile Drawer */}
          <div className="flex items-center justify-between mb-4 lg:hidden">
            <h2 className="font-bold text-slate-900 text-base">Riwayat Konsultasi</h2>
            <button 
              onClick={() => setShowHistorySidebar(false)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              id="close_sidebar_btn"
            >
              <X size={20} />
            </button>
          </div>

          <div className="hidden lg:flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center">
              <Clock size={14} className={`${activeTheme.accentText} mr-1.5`} /> Riwayat Konsultasi
            </h2>
            <span className={`text-[10px] ${activeTheme.badge} px-2 py-0.5 rounded-full font-bold`}>
              {sessions.length} Sesi
            </span>
          </div>

          {/* New consultation button inside sidebar */}
          <button
            onClick={handleStartNewSession}
            className={`w-full mb-3 ${activeTheme.primaryBtn} font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer`}
            id="sidebar_new_chat_btn"
          >
            <Plus size={16} />
            <span>Mulai Konsultasi Baru</span>
          </button>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1" id="sessions_list_container">
            {sessions.map((sess) => {
              const isActive = sess.id === currentSessionId;
              const lastMessage = sess.messages[sess.messages.length - 1];
              const snippet = lastMessage ? lastMessage.content : "";
              
              return (
                <div
                  key={sess.id}
                  onClick={() => {
                    setCurrentSessionId(sess.id);
                    setShowHistorySidebar(false);
                    setActiveTab("chat");
                  }}
                  className={`
                    group p-3 rounded-xl cursor-pointer transition-all border flex flex-col relative shadow-2xs
                    ${isActive 
                      ? `${activeTheme.pillActive} border-slate-300` 
                      : "bg-white/70 hover:bg-slate-50 border-slate-100 text-slate-700"
                    }
                  `}
                  id={`session_item_${sess.id}`}
                >
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-xs truncate pr-6 text-slate-900 group-hover:text-black">
                      {sess.title}
                    </p>
                    <button
                      onClick={(e) => handleDeleteSession(sess.id, e)}
                      className="absolute right-2 top-2 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                      title="Hapus Konsultasi"
                      id={`delete_session_btn_${sess.id}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-1">
                    {snippet.replace(/[#*`_]/g, "")}
                  </p>
                  <span className="text-[9px] text-slate-400 mt-2 self-end">
                    {new Date(sess.updatedAt).toLocaleDateString("id-ID", { month: "short", day: "numeric" })}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Quick Footer inside sidebar */}
          <div className="pt-4 border-t border-slate-100 mt-4 text-[10px] text-slate-400 text-center flex flex-col space-y-1">
            <p>Konsultasi Obat Bersama Apoteker Zuzun</p>
            <p className={`font-bold ${activeTheme.accentText}`}>Virtual Pharmacist Assistant</p>
          </div>
        </aside>

        {/* OVERLAY FOR MOBILE SIDEBAR */}
        {showHistorySidebar && (
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-35 lg:hidden"
            onClick={() => setShowHistorySidebar(false)}
            id="sidebar_backdrop"
          />
        )}

        {/* CHAT INTERFACE CONTAINER (Center - 6 columns on Desktop) */}
        <main 
          className={`
            flex flex-col bg-white/90 backdrop-blur-md border border-slate-100 h-[calc(100vh-10rem)] lg:h-[calc(100vh-12rem)] min-h-[500px] lg:col-span-6 lg:rounded-2xl lg:shadow-md overflow-hidden transition-all duration-300
            ${activeTab === "chat" ? "flex" : "hidden lg:flex"}
          `}
          id="chat_main_panel"
        >
          {/* Active Chat Header */}
          <div className={`bg-gradient-to-r ${activeTheme.bgGradient} px-4 py-3.5 border-b border-slate-100 flex items-center justify-between`} id="chat_header">
            <div className="flex items-center space-x-3">
              <div className="relative shrink-0">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${activeTheme.logoGradient} text-white flex items-center justify-center font-bold tracking-wider shadow-xs border border-white`}>
                  AZ
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Apoteker Zuzun</h3>
                <div className="flex items-center text-[10px] text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-ping" />
                  <span>Aktif Melayani • Virtual Pharmacist</span>
                </div>
              </div>
            </div>

            {/* Clear this session history */}
            <button 
              onClick={() => {
                if (activeSession && confirm("Apakah Anda ingin menghapus isi percakapan konsultasi ini?")) {
                  const clearedSession = {
                    ...activeSession,
                    messages: [getWelcomeMessage()],
                    updatedAt: new Date().toISOString()
                  };
                  saveSessions(sessions.map(s => s.id === currentSessionId ? clearedSession : s));
                  setErrorText(null);
                }
              }}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title="Bersihkan Percakapan"
              id="clear_chat_button"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30" id="messages_scroll_area">
            {activeMessages.map((msg, index) => {
              const isAssistant = msg.role === "assistant";
              return (
                <div
                  key={msg.id || index}
                  className={`flex ${isAssistant ? "justify-start" : "justify-end"} items-start space-x-2.5`}
                  id={`message_item_${index}`}
                >
                  {isAssistant && (
                    <div className="shrink-0">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${activeTheme.logoGradient} text-white flex items-center justify-center font-bold text-xs shadow-2xs border border-white`}>
                        AZ
                      </div>
                    </div>
                  )}

                  <div className={`flex flex-col max-w-[85%] ${!isAssistant ? "items-end" : ""}`}>
                    <div 
                      className={`
                        p-3.5 rounded-2xl shadow-2xs text-xs sm:text-sm leading-relaxed transition-all
                        ${isAssistant 
                          ? "bg-white text-slate-800 rounded-tl-none border border-slate-150" 
                          : `${activeTheme.chatBubble} rounded-tr-none`
                        }
                      `}
                    >
                      {isAssistant ? (
                        <div className="markdown-body">
                          <Markdown>{msg.content}</Markdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-line font-medium">{msg.content}</p>
                      )}
                    </div>
                    
                    {/* Message Meta */}
                    <span className="text-[10px] text-slate-400 mt-1 flex items-center space-x-1 px-1">
                      {!isAssistant && <User size={10} className="mr-0.5" />}
                      <span>{msg.timestamp}</span>
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start items-start space-x-2.5" id="chat_loading_indicator">
                <div className="shrink-0">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${activeTheme.logoGradient} text-white flex items-center justify-center font-bold text-xs shadow-2xs border border-white`}>
                    AZ
                  </div>
                </div>
                <div className="bg-white border border-slate-150 rounded-2xl rounded-tl-none p-4 shadow-2xs flex items-center space-x-2">
                  <div className="flex space-x-1.5">
                    <span className={`w-2 h-2 ${activeTheme.accentFill} rounded-full animate-bounce`} style={{ animationDelay: "0ms" }} />
                    <span className={`w-2 h-2 ${activeTheme.accentFill} rounded-full animate-bounce`} style={{ animationDelay: "150ms" }} />
                    <span className={`w-2 h-2 ${activeTheme.accentFill} rounded-full animate-bounce`} style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-xs text-slate-500 font-medium">Apoteker Zuzun sedang menganalisis...</span>
                </div>
              </div>
            )}

            {/* Error Message Box */}
            {errorText && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800 flex items-start space-x-2" id="chat_error_box">
                <AlertCircle size={16} className="shrink-0 text-red-600 mt-0.5" />
                <div>
                  <p className="font-bold">Gagal Terhubung</p>
                  <p className="mt-0.5">{errorText}</p>
                  <button 
                    onClick={() => {
                      // Attempt to retry last message
                      const userMsgs = activeMessages.filter(m => m.role === "user");
                      if (userMsgs.length > 0) {
                        const lastUserMsg = userMsgs[userMsgs.length - 1];
                        // Pop last message and send again
                        const withoutLast = activeMessages.slice(0, activeMessages.length - 1);
                        const updatedSession = {
                          ...activeSession,
                          messages: withoutLast,
                          updatedAt: new Date().toISOString()
                        };
                        saveSessions(sessions.map(s => s.id === currentSessionId ? updatedSession : s));
                        handleSendMessage(lastUserMsg.content);
                      }
                    }}
                    className="text-red-700 underline font-bold mt-1 block cursor-pointer"
                  >
                    Kirim Ulang Pertanyaan
                  </button>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Consultation Presets (Only visible when few messages) */}
          {activeMessages.length <= 1 && !isLoading && (
            <div className="px-4 py-3 bg-white border-t border-slate-100" id="preset_questions_container">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                <Info size={12} className={`${activeTheme.accentText} mr-1`} /> Topik Populer:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => handleQuickQuestion("Apakah Paracetamol aman untuk ibu hamil? Berapa dosisnya?")}
                  className={`bg-white hover:${activeTheme.accentBg} border border-slate-150 hover:${activeTheme.accentBorder} text-left p-2.5 rounded-xl transition-all hover:shadow-2xs text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center justify-between cursor-pointer`}
                >
                  <span>🤰 Paracetamol untuk Ibu Hamil</span>
                  <ChevronRight size={14} className="text-slate-400 shrink-0" />
                </button>
                <button
                  onClick={() => handleQuickQuestion("Bagaimana aturan minum obat maag Antasida, sebelum atau sesudah makan?")}
                  className={`bg-white hover:${activeTheme.accentBg} border border-slate-150 hover:${activeTheme.accentBorder} text-left p-2.5 rounded-xl transition-all hover:shadow-2xs text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center justify-between cursor-pointer`}
                >
                  <span>🍽️ Aturan Minum Obat Maag Antasida</span>
                  <ChevronRight size={14} className="text-slate-400 shrink-0" />
                </button>
                <button
                  onClick={() => handleQuickQuestion("Apa efek samping utama dari obat hipertensi Captopril?")}
                  className={`bg-white hover:${activeTheme.accentBg} border border-slate-150 hover:${activeTheme.accentBorder} text-left p-2.5 rounded-xl transition-all hover:shadow-2xs text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center justify-between cursor-pointer`}
                >
                  <span>🫀 Efek Samping Obat Captopril</span>
                  <ChevronRight size={14} className="text-slate-400 shrink-0" />
                </button>
                <button
                  onClick={() => handleQuickQuestion("Kenapa antibiotik Amoxicillin wajib diminum sampai habis?")}
                  className={`bg-white hover:${activeTheme.accentBg} border border-slate-150 hover:${activeTheme.accentBorder} text-left p-2.5 rounded-xl transition-all hover:shadow-2xs text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center justify-between cursor-pointer`}
                >
                  <span>💊 Mengapa Amoxicillin Harus Habis?</span>
                  <ChevronRight size={14} className="text-slate-400 shrink-0" />
                </button>
              </div>
            </div>
          )}

          {/* Message Input Box */}
          <div className="p-3 bg-white border-t border-slate-100" id="chat_input_container">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputText);
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Tanyakan dosis, efek samping, atau aturan pakai obat..."
                className={`flex-1 bg-slate-100 hover:bg-slate-50/50 focus:bg-white text-xs sm:text-sm border border-transparent ${activeTheme.accentRing} focus:ring-2 rounded-xl px-4 py-3 text-slate-850 focus:outline-hidden transition-all placeholder:text-slate-400`}
                disabled={isLoading}
                id="chat_input_field"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className={`
                  p-3 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-xs
                  ${!inputText.trim() || isLoading 
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                    : `${activeTheme.primaryBtn} hover:shadow-md active:scale-95`
                  }
                `}
                title="Kirim Pesan"
                id="submit_message_btn"
              >
                <Send size={16} />
              </button>
            </form>
            <div className="flex items-center justify-between px-1 mt-1.5 text-[10px] text-slate-400">
              <span className="flex items-center font-medium">
                <ShieldAlert size={12} className="text-amber-500 mr-1 animate-pulse" />
                Dosis anak/ibu hamil butuh konsultasi ekstra.
              </span>
              <span className="font-semibold text-slate-400">Apoteker Zuzun v1.3</span>
            </div>
          </div>
        </main>

        {/* WIDGET: INDONESIAN DRUG CLASSIFICATIONS (Right Sidebar Part 1 - 3 columns on Desktop) */}
        <section 
          className={`
            bg-white/90 backdrop-blur-md border border-slate-100 p-4 flex flex-col space-y-4 lg:col-span-3 lg:rounded-2xl lg:shadow-md
            ${activeTab === "classification" ? "block" : "hidden lg:block"}
          `}
          id="drug_classification_widget"
        >
          <div>
            <h2 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center">
              <BookOpen size={14} className={`${activeTheme.accentText} mr-1.5`} /> Klasifikasi Lambang Obat
            </h2>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Di Indonesia, obat diklasifikasikan dengan lambang warna khusus pada kemasan untuk menjamin keselamatan pasien.
            </p>
          </div>

          <div className="space-y-3.5" id="drug_logos_list">
            
            {/* Obat Bebas */}
            <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-100/70 flex items-start space-x-3 transition-all hover:bg-emerald-50">
              <div className="shrink-0 w-8 h-8 rounded-full border-2 border-black bg-emerald-500 flex items-center justify-center shadow-xs" title="Logo Obat Bebas" />
              <div className="text-xs">
                <div className="flex items-center space-x-1.5">
                  <h4 className="font-bold text-slate-900">Obat Bebas</h4>
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 rounded-full font-bold">Tanpa Resep</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Aman dikonsumsi sendiri tanpa resep dokter sesuai aturan pakai.
                </p>
                <p className="text-[10px] text-emerald-700 font-bold mt-1">
                  Contoh: Paracetamol, Antasida, Vitamin C.
                </p>
              </div>
            </div>

            {/* Obat Bebas Terbatas */}
            <div className="bg-blue-50/40 p-3 rounded-xl border border-blue-100/70 flex items-start space-x-3 transition-all hover:bg-blue-50">
              <div className="shrink-0 w-8 h-8 rounded-full border-2 border-black bg-blue-500 flex items-center justify-center shadow-xs" title="Logo Obat Bebas Terbatas" />
              <div className="text-xs">
                <div className="flex items-center space-x-1.5">
                  <h4 className="font-bold text-slate-900">Bebas Terbatas</h4>
                  <span className="bg-blue-100 text-blue-800 text-[9px] px-1.5 rounded-full font-bold">Terbatas</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Bebas dibeli tapi disertai tanda peringatan khusus (P. No. 1 - 6).
                </p>
                <p className="text-[10px] text-blue-700 font-bold mt-1">
                  Contoh: CTM, Cetirizine, Obat Batuk Hitam.
                </p>
              </div>
            </div>

            {/* Obat Keras */}
            <div className="bg-rose-50/40 p-3 rounded-xl border border-rose-100/70 flex items-start space-x-3 transition-all hover:bg-rose-50">
              <div className="shrink-0 w-8 h-8 rounded-full border-2 border-black bg-red-600 flex items-center justify-center font-extrabold text-white text-sm shadow-xs" title="Logo Obat Keras">
                K
              </div>
              <div className="text-xs">
                <div className="flex items-center space-x-1.5">
                  <h4 className="font-bold text-slate-900">Obat Keras</h4>
                  <span className="bg-rose-100 text-rose-800 text-[9px] px-1.5 rounded-full font-bold">Wajib Resep</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Hanya boleh dibeli dengan resep dokter asli demi menghindari penyalahgunaan.
                </p>
                <p className="text-[10px] text-rose-700 font-bold mt-1">
                  Contoh: Antibiotik, Obat Darah Tinggi, Jantung.
                </p>
              </div>
            </div>

            {/* Narkotika */}
            <div className="bg-purple-50/40 p-3 rounded-xl border border-purple-100/70 flex items-start space-x-3 transition-all hover:bg-purple-50">
              <div className="shrink-0 w-8 h-8 rounded-full border-2 border-black bg-white flex items-center justify-center shadow-xs pr-1 relative overflow-hidden" title="Logo Narkotika">
                <div className="w-5 h-1 bg-red-600 absolute rotate-45" />
                <div className="w-5 h-1 bg-red-600 absolute -rotate-45" />
              </div>
              <div className="text-xs">
                <div className="flex items-center space-x-1.5">
                  <h4 className="font-bold text-slate-900">Narkotika</h4>
                  <span className="bg-purple-100 text-purple-800 text-[9px] px-1.5 rounded-full font-bold">Sangat Ketat</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Diawasi secara ketat karena berpotensi menyebabkan ketergantungan yang tinggi.
                </p>
                <p className="text-[10px] text-purple-700 font-bold mt-1">
                  Contoh: Codeine, Morfin.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <h4 className="font-bold text-slate-800 text-[11px] flex items-center mb-1">
              <ShieldAlert size={14} className="text-amber-500 mr-1.5" /> Petunjuk Keamanan Obat:
            </h4>
            <ul className="text-[10.5px] text-slate-600 list-disc list-inside space-y-1 leading-relaxed">
              <li>Periksa tanggal kedaluwarsa sebelum konsumsi.</li>
              <li>Jangan berbagi obat resep pribadi dengan orang lain.</li>
              <li>Simpan obat di suhu sejuk dan terhindar dari cahaya matahari.</li>
            </ul>
          </div>
        </section>

        {/* WIDGET: OFFLINE DRUG CATALOG & DISCLAIMER (Right Sidebar Part 2 - 3 columns on Desktop) */}
        <section 
          className={`
            bg-white/90 backdrop-blur-md border border-slate-100 p-4 flex flex-col space-y-4 lg:col-span-3 lg:rounded-2xl lg:shadow-md overflow-y-auto
            ${activeTab === "catalog" ? "block" : "hidden lg:block"}
          `}
          id="offline_catalog_widget"
        >
          {/* Section header */}
          <div>
            <h2 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center">
              <Search size={14} className={`${activeTheme.accentText} mr-1.5`} /> Kamus Informasi Obat
            </h2>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Cari nama obat apa saja untuk melihat panduan dosis umum, aturan minum, efek samping, dan potensi interaksi secara instan.
            </p>
          </div>

          {/* Search box */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    handleOnlineSearch(searchQuery);
                  }
                }}
                placeholder="Masukkan nama obat (e.g. Ibuprofen, Metformin)..."
                className={`w-full bg-slate-50 border border-slate-200/60 rounded-xl pl-9 pr-14 py-2 text-xs focus:bg-white focus:outline-hidden ${activeTheme.accentRing} focus:ring-1 text-slate-850 transition-all`}
                id="catalog_search_input"
              />
              {searchQuery.trim() && (
                <button
                  onClick={() => handleOnlineSearch(searchQuery)}
                  disabled={isSearchingDrug}
                  className={`absolute right-2 top-1.5 ${activeTheme.primaryBtn} disabled:bg-slate-300 p-1 px-2.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer`}
                  title="Cari online"
                >
                  CARI
                </button>
              )}
            </div>

            {/* Quick Online Search trigger when search query is entered */}
            {searchQuery.trim() && !isSearchingDrug && (
              <button
                onClick={() => handleOnlineSearch(searchQuery)}
                className={`w-full py-2 px-3 bg-gradient-to-r ${activeTheme.bgGradient} hover:opacity-90 border border-slate-200/50 rounded-xl text-left text-[11px] font-bold text-slate-800 flex items-center justify-between transition-all cursor-pointer`}
              >
                <span className="flex items-center space-x-1.5">
                  <Search size={12} className={`${activeTheme.accentText} animate-pulse`} />
                  <span>Cari lengkap "{searchQuery}" secara Online</span>
                </span>
                <span className={`text-[8px] ${activeTheme.badge} px-1.5 py-0.5 rounded-md font-bold tracking-wider`}>AI</span>
              </button>
            )}
          </div>

          {/* Search loading state */}
          {isSearchingDrug && (
            <div className={`border ${activeTheme.accentBorder} bg-white rounded-xl p-4 text-center space-y-2 animate-pulse`}>
              <div className={`w-5 h-5 border-2 ${activeTheme.accentBorder} border-t-transparent rounded-full animate-spin mx-auto`} />
              <p className={`text-[11px] ${activeTheme.accentText} font-bold`}>Mencari informasi medis obat "{searchQuery}"...</p>
            </div>
          )}

          {/* Search error state */}
          {searchError && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 flex items-start space-x-2">
              <AlertCircle size={15} className="shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Pencarian Gagal</p>
                <p className="text-[10px] text-rose-700 mt-0.5 leading-relaxed">{searchError}</p>
                <button
                  onClick={() => handleOnlineSearch(searchQuery)}
                  className={`mt-1.5 text-[10px] font-extrabold ${activeTheme.accentText} hover:opacity-80 underline cursor-pointer`}
                >
                  Coba Lagi
                </button>
              </div>
            </div>
          )}

          {/* Recent Searches Panel */}
          {recentSearches.length > 0 && !searchQuery.trim() && (
            <div className="space-y-1.5" id="recent_searches_section">
              <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Pencarian Terbaru</p>
              <div className="flex flex-wrap gap-1.5">
                {recentSearches.map((drug) => (
                  <button
                    key={drug.name}
                    onClick={() => {
                      setSelectedDrug(drug);
                      setSearchQuery("");
                    }}
                    className={`text-[10.5px] px-2.5 py-1 rounded-lg border font-medium transition-all flex items-center space-x-1 cursor-pointer ${
                      selectedDrug?.name === drug.name 
                        ? `${activeTheme.pillActive} border-slate-300 font-bold` 
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${activeTheme.accentFill}`} />
                    <span>{drug.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Catalog search list (Local Offline Inventory) */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1" id="catalog_list">
            <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mb-1">Daftar Obat Terpopuler</p>
            {filteredDrugs.length > 0 ? (
              filteredDrugs.map((drug) => (
                <button
                  key={drug.name}
                  onClick={() => {
                    setSelectedDrug(selectedDrug?.name === drug.name ? null : drug);
                    setSearchError(null);
                  }}
                  className={`
                    w-full text-left p-2.5 rounded-xl border transition-all text-xs flex justify-between items-center cursor-pointer
                    ${selectedDrug?.name === drug.name 
                      ? `${activeTheme.pillActive} border-slate-300 font-bold shadow-2xs` 
                      : "bg-white hover:bg-slate-50 border-slate-100 text-slate-700"
                    }
                  `}
                  id={`catalog_item_${drug.name.toLowerCase()}`}
                >
                  <div className="flex items-center space-x-2">
                    {/* Visual dot representation of class */}
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      drug.class === "bebas" ? "bg-emerald-500" :
                      drug.class === "bebas_terbatas" ? "bg-blue-500" :
                      drug.class === "keras" ? "bg-red-500" : "bg-purple-500"
                    }`} />
                    <span>{drug.name}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-normal">{drug.className}</span>
                </button>
              ))
            ) : (
              !isSearchingDrug && !searchQuery.trim() && (
                <p className="text-center text-[11px] text-slate-400 py-4">Obat tidak ditemukan.</p>
              )
            )}
          </div>

          {/* Expanded selected drug details with pharmacy recommendations */}
          <AnimatePresence mode="wait">
            {selectedDrug && (
              <motion.div
                key={selectedDrug.name}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white border border-slate-150 rounded-xl p-3.5 text-xs space-y-3.5 shadow-sm"
                id="selected_drug_details_card"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-extrabold text-slate-900 text-sm tracking-tight">{selectedDrug.name}</span>
                  <span className={`
                    text-[9px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider
                    ${selectedDrug.class === "bebas" ? "bg-emerald-100 text-emerald-800 border-emerald-200" : ""}
                    ${selectedDrug.class === "bebas_terbatas" ? "bg-blue-100 text-blue-800 border-blue-200" : ""}
                    ${selectedDrug.class === "keras" ? "bg-rose-100 text-rose-800 border-rose-200" : ""}
                    ${selectedDrug.class === "narkotika" ? "bg-purple-100 text-purple-800 border-purple-200" : ""}
                  `}>
                    {selectedDrug.className}
                  </span>
                </div>

                <div>
                  <p className="font-bold text-slate-900 text-[10px] uppercase tracking-wider">Indikasi/Kegunaan:</p>
                  <p className="text-slate-600 mt-0.5 leading-relaxed font-medium">{selectedDrug.indications}</p>
                </div>

                <div className={`bg-slate-50 border border-slate-100 rounded-lg p-2.5`}>
                  <p className="font-bold text-slate-900 text-[10px] uppercase tracking-wider">Dosis Umum:</p>
                  <p className="text-slate-700 mt-0.5 leading-relaxed font-bold">{selectedDrug.dosage}</p>
                </div>

                <div>
                  <p className="font-bold text-slate-900 text-[10px] uppercase tracking-wider">Aturan Pakai & Waktu Minum:</p>
                  <p className="text-slate-600 mt-0.5 leading-relaxed font-medium">{selectedDrug.instructions}</p>
                </div>

                <div>
                  <p className="font-bold text-rose-950 text-[10px] uppercase tracking-wider">Efek Samping Umum:</p>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">{selectedDrug.sideEffects}</p>
                </div>

                {selectedDrug.interactions && (
                  <div className="bg-orange-50/30 border border-orange-100 rounded-lg p-2.5">
                    <p className="font-bold text-orange-950 text-[10px] uppercase tracking-wider">Potensi Interaksi Obat:</p>
                    <p className="text-orange-900 mt-0.5 leading-relaxed text-[11px]">{selectedDrug.interactions}</p>
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5 text-[10.5px] text-amber-950">
                  <p className="font-extrabold text-amber-900">⚠️ Peringatan Penting:</p>
                  <p className="mt-0.5 leading-relaxed font-medium">{selectedDrug.warnings}</p>
                </div>

                {/* Consultation trigger inside widget */}
                <button
                  onClick={() => {
                    handleQuickQuestion(`Saya ingin konsultasi mengenai obat **${selectedDrug.name}**. Bolehkah saya meminum obat ini dan tolong jelaskan detail efek samping serta cara kerja obat ini?`);
                  }}
                  className={`w-full mt-1 ${activeTheme.primaryBtn} font-bold py-2.5 px-3 rounded-xl transition-all text-xs flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer`}
                >
                  <Send size={12} />
                  <span>Konsultasikan Obat Ini di Chat</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* General Medical Disclaimer (CRITICAL SAFETY CONSTRAINT) */}
          <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 text-xs" id="medical_disclaimer_card">
            <h4 className="font-bold text-rose-900 flex items-center mb-1">
              <ShieldAlert size={14} className="text-rose-600 mr-1.5" /> Batasan Tanggung Jawab Medis:
            </h4>
            <p className="text-[10px] text-rose-700 leading-relaxed">
              Informasi dari Apoteker Zuzun bertujuan sebagai edukasi obat-obatan secara umum dan **tidak menggantikan diagnosis dokter profesional**. 
            </p>
            <p className="text-[10px] text-rose-700 leading-relaxed mt-1.5 font-bold">
              Jangan pernah mengubah dosis obat resep Anda atau menghentikan terapi penting tanpa konsultasi dan persetujuan dari dokter Anda terlebih dahulu.
            </p>
          </div>

          {/* Quick External Links */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-600">
            <p className="font-bold text-slate-800 text-[10.5px] mb-1 flex items-center">
              <Stethoscope size={13} className={`${activeTheme.accentText} mr-1`} /> Kontak Darurat Nasional:
            </p>
            <ul className="text-[10px] space-y-1 font-semibold">
              <li className="flex justify-between">
                <span>Layanan Ambulans Darurat</span>
                <span className={`font-bold ${activeTheme.accentText}`}>Call 112</span>
              </li>
              <li className="flex justify-between">
                <span>Halo Kemenkes</span>
                <span className={`font-bold ${activeTheme.accentText}`}>Call 1500567</span>
              </li>
            </ul>
          </div>

        </section>

      </div>

      {/* FOOTER BAR */}
      <footer className="bg-white/85 backdrop-blur-md border-t border-slate-100 py-4 mt-auto text-center text-xs text-slate-500" id="footer_bar">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
          <p className="font-medium">© 2026 Apoteker Zuzun. Semua Hak Dilindungi Undang-Undang.</p>
          <div className="flex space-x-4 font-semibold text-slate-600">
            <span className={`text-[10px] ${activeTheme.accentText} flex items-center ${activeTheme.accentBg} border ${activeTheme.accentBorder} px-2.5 py-0.5 rounded-full`}>
              <span className={`w-1.5 h-1.5 rounded-full ${activeTheme.accentFill} mr-1 animate-pulse`} /> Server-Side Gemini API Aktif
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
