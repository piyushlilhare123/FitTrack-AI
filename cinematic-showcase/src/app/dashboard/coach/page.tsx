"use client";
import React, { useState, useRef, useEffect } from 'react';
import Card from '@/components/ui/Card';
import { 
  Sparkles, 
  Send, 
  Mic, 
  Bot, 
  User, 
  ArrowRight,
  Loader2,
  Plus,
  MessageSquare
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AICoach() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showWelcome, setShowWelcome] = useState(true);

  // Free Voice Assistant States
  const [hasGreetedVoice, setHasGreetedVoice] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<any>(null);

  // Keep a ref to activeChatId to prevent stale closures in voice callbacks
  const activeChatIdRef = useRef<string | null>(null);
  const isSessionActiveRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isThinkingRef = useRef(false); // Tracks if waiting for API response

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    isSessionActiveRef.current = isSessionActive;
  }, [isSessionActive]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  // Load voices proactively for SpeechSynthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) synthRef.current.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const speakResponse = (text: string, onEndCallback?: () => void) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Stop any current speech
    
    // Clean up text (remove markdown stars and complex emojis for better TTS)
    const cleanText = text.replace(/[*#]/g, '').replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-IN'; // Indian English accent matches Hinglish text well
    utterance.rate = 1.05; // Slightly faster for an energetic trainer feel
    utterance.pitch = 1.0;

    // Try to find a good Indian Male voice if available in Chrome/Edge
    const voices = window.speechSynthesis.getVoices();
    const indianVoices = voices.filter(v => v.lang.includes('en-IN') || v.lang.includes('hi-IN'));
    const maleKeywords = ['male', 'rishi', 'ravi', 'hemant', 'amit', 'madhur'];
    const maleIndianVoice = indianVoices.find(v => maleKeywords.some(kw => v.name.toLowerCase().includes(kw)));
    
    if (maleIndianVoice) {
      utterance.voice = maleIndianVoice;
    } else if (indianVoices.length > 0) {
      utterance.voice = indianVoices[0]; // fallback to any Indian voice
    } else {
      const genericMale = voices.find(v => v.name.toLowerCase().includes('male'));
      if (genericMale) utterance.voice = genericMale; // fallback generic male
    }

    // Store in window to prevent Chrome garbage collection bug that stops onend from firing
    (window as any).__voiceUtterance = utterance;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEndCallback && isSessionActiveRef.current) onEndCallback();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      if (onEndCallback && isSessionActiveRef.current) onEndCallback();
    };

    window.speechSynthesis.speak(utterance);
  };

  const suggestionPrompts = [
    "Create a 4-week cutting plan",
    "What should I eat before a morning run?",
    "I skipped 3 days, what now?"
  ];

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/api/ai/conversations');
      setConversations(res.data);
      if (res.data.length > 0 && !activeChatId) {
        loadConversation(res.data[0]._id);
      } else if (res.data.length === 0) {
        startNewChat();
      }
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  };

  const loadConversation = async (id: string) => {
    setActiveChatId(id);
    setIsLoading(true);
    try {
      const res = await api.get(`/api/ai/conversations/${id}`);
      setMessages(res.data.messages);
    } catch (err) {
      toast.error('Failed to load chat');
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = async () => {
    setIsLoading(true);
    try {
      const res = await api.post('/api/ai/conversations');
      setConversations(prev => [res.data, ...prev]);
      setActiveChatId(res.data._id);
      setMessages(res.data.messages);
    } catch (err) {
      toast.error('Failed to start new chat');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (textToSend: string, shouldSpeakResponse: boolean = false) => {
    if (!textToSend.trim() || !activeChatId) return;

    const userMessage = { sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    setIsLoading(true);
    isThinkingRef.current = true;

    try {
      const res = await api.post(`/api/ai/conversations/${activeChatId}/message`, {
        message: textToSend,
        isVoice: shouldSpeakResponse
      });

      const replyText = res.data.reply;
      isThinkingRef.current = false;
      
      // Free Voice Mode: Read the AI's response aloud!
      if (shouldSpeakResponse) {
        speakResponse(replyText, () => {
          // Automatically start listening again for continuous conversation
          startListening();
        });
      }

      const tokens = replyText.split(' ');
      let streamedText = '';
      
      setMessages(prev => [...prev, { sender: 'ai', text: '' }]);
      setIsLoading(false); 

      let tokenIndex = 0;
      const timer = setInterval(() => {
        if (tokenIndex < tokens.length) {
          streamedText += (tokenIndex === 0 ? '' : ' ') + tokens[tokenIndex];
          setMessages(prev => {
            const next = [...prev];
            next[next.length - 1] = { sender: 'ai', text: streamedText };
            return next;
          });
          tokenIndex++;
        } else {
          clearInterval(timer);
          // Refresh conversations to update titles
          fetchConversations();
        }
      }, 40);

    } catch (err: any) {
      setIsLoading(false);
      isThinkingRef.current = false;
      setMessages(prev => prev.filter(m => m !== userMessage));
      
      const errorMsg = err.response?.data?.message || err.message || '';
      toast.error(`Error: ${errorMsg || 'Coach is offline.'}`);
      setMessages(prev => [...prev, { sender: 'ai', text: `Sorry, I encountered an error: ${errorMsg || 'Connection failed.'} Please check your setup and try again.` }]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Stop after one sentence
    recognition.interimResults = false;
    recognition.lang = 'en-IN'; // Indian English to better understand Hinglish accents

    recognition.onstart = () => {
      setIsListening(true);
      toast.success('Listening...', { id: 'voice-listening' });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript.trim()) {
        recognitionRef.current?.stop(); // Stop listening explicitly since we have input
        
        const lowerTranscript = transcript.toLowerCase().trim().replace(/[.,!?'"]/g, "");
        const exitCommands = ["bye", "good bye", "goodbye", "okay bye", "end the call", "cut the call", "stop the call", "end call"];
        
        if (exitCommands.some(cmd => lowerTranscript.includes(cmd))) {
          toast.success(`Heard: "${transcript}"`);
          handleSendMessage(transcript, false); // Send message so AI logs it, but don't speak back
          
          // Auto-cut the call
          setTimeout(() => {
            setIsSessionActive(false);
            setIsListening(false);
            setIsSpeaking(false);
            if (synthRef.current) synthRef.current.cancel();
            toast('Voice session ended by command.', { icon: '📴' });
          }, 100);
          return;
        }

        toast.success(`Heard: "${transcript}"`);
        // Send message and tell it to speak back!
        handleSendMessage(transcript, true); 
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      toast.dismiss('voice-listening');
      if (event.error !== 'no-speech') {
        toast.error(`Microphone error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      toast.dismiss('voice-listening');

      // Crucial Fix: If the mic cut off due to 6s silence, but the session is STILL active
      // and the AI isn't speaking or thinking, we MUST immediately restart it to keep the session alive!
      if (isSessionActiveRef.current && !isThinkingRef.current && !isSpeakingRef.current) {
        try {
          recognitionRef.current?.start();
        } catch (e) {
          // ignore already started errors
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.warn('Speech recognition failed to start', e);
    }
  };

  const endVoiceSession = () => {
    setIsSessionActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    if (synthRef.current) synthRef.current.cancel();
    if (recognitionRef.current) recognitionRef.current.stop();
    toast('Voice session ended.', { icon: '📴' });
  };

  const handleVoiceInput = () => {
    if (typeof window === 'undefined') return;

    if (isSessionActive) {
      endVoiceSession();
      return;
    }

    setIsSessionActive(true);
    isSessionActiveRef.current = true; // Synchronous ref update to prevent race conditions

    // First time click: AI Greets you, THEN listens automatically
    if (!hasGreetedVoice) {
      setHasGreetedVoice(true);
      const greeting = "Hello, I am your fitness coach. Kya haal chal hai?";
      
      // Post the greeting to the UI chat
      setMessages(prev => [...prev, { sender: 'ai', text: greeting }]);
      
      // Speak the greeting, and start listening right after it finishes!
      speakResponse(greeting, () => {
        startListening();
      });
      return;
    }

    // Normal behavior: start listening
    startListening();
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent loading the chat
    if (!confirm('Are you sure you want to delete this conversation?')) return;
    try {
      await api.delete(`/api/ai/conversations/${id}`);
      toast.success('Chat deleted');
      setConversations(prev => prev.filter(c => c._id !== id));
      if (activeChatId === id) {
        setActiveChatId(null);
        setMessages([]);
        const remaining = conversations.filter(c => c._id !== id);
        if (remaining.length > 0) {
          loadConversation(remaining[0]._id);
        } else {
          startNewChat();
        }
      }
    } catch (err) {
      toast.error('Failed to delete chat');
    }
  };

  if (showWelcome) {
    return (
      <div className="h-[calc(100vh-8rem)] w-full flex flex-col md:flex-row items-center justify-center gap-10 pb-4 select-none animate-fadeIn bg-[#080d19]/10 rounded-3xl p-6 md:p-10 border border-white/5 relative overflow-hidden">
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes wave {
            0% { transform: rotate(0deg); }
            15% { transform: rotate(15deg); }
            30% { transform: rotate(-10deg); }
            45% { transform: rotate(15deg); }
            60% { transform: rotate(-5deg); }
            75% { transform: rotate(10deg); }
            100% { transform: rotate(0deg); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .animate-wave {
            animation: wave 1.5s ease-in-out infinite;
            transform-origin: 70% 70%;
          }
          .glow-cyan-text {
            text-shadow: 0 0 15px rgba(0, 245, 255, 0.3);
          }
        `}</style>
        
        {/* Subtle radial tech background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accentCyan/5 rounded-full blur-[100px] pointer-events-none z-0"></div>

        {/* Robot Image Frame & Container (looks 3D & premium) */}
        <div 
          onClick={() => setShowWelcome(false)}
          className="group relative w-full max-w-[280px] sm:max-w-xs md:max-w-sm aspect-[3/4] rounded-3xl border border-white/10 hover:border-accentCyan/40 bg-white/[0.01] hover:bg-white/[0.03] backdrop-blur-md shadow-2xl transition-all duration-500 cursor-pointer hover:shadow-[0_0_40px_rgba(0,245,255,0.15)] p-4 z-10 flex-shrink-0 flex items-center justify-center overflow-visible"
        >
          {/* Wavy hello hand bubble overlay (says hello on hover) */}
          <div className="absolute -top-12 -right-4 bg-[#39FF14] text-black text-[10px] font-black px-3 py-1.5 rounded-2xl rounded-bl-none shadow-lg opacity-0 translate-y-4 scale-75 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-500 z-30 flex items-center gap-1.5">
            <span>Hello!</span>
            <span className="inline-block animate-wave text-xs">👋</span>
          </div>

          {/* Glowing tech grid background inside frame */}
          <div className="absolute inset-4 rounded-2xl bg-[#0B121F] border border-white/5 overflow-hidden z-0">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:15px_15px] pointer-events-none"></div>
          </div>
          
          {/* The Robot Image: Popups out of the frame on hover! */}
          <img 
            src="/robot.jpg" 
            alt="FitTrack AI Coach" 
            className="relative w-[85%] h-[85%] object-contain rounded-2xl z-10 transition-all duration-500 ease-out transform group-hover:scale-110 group-hover:-translate-y-12 group-hover:rotate-1 drop-shadow-[0_15px_20px_rgba(0,0,0,0.6)] group-hover:drop-shadow-[0_25px_30px_rgba(0,245,255,0.25)]"
          />
          
          {/* Glowing bottom badge */}
          <div className="absolute bottom-4 left-4 right-4 bg-[#0F1928]/90 backdrop-blur-md border border-white/5 p-3 rounded-2xl z-20 flex items-center justify-between pointer-events-none transition-all duration-500 group-hover:translate-y-1 group-hover:opacity-90">
            <div>
              <p className="text-[9px] text-accentCyan font-bold uppercase tracking-widest">Assistant Online</p>
              <h4 className="text-xs font-bold text-white mt-0.5">Click to Open Chat</h4>
            </div>
            <div className="w-7 h-7 rounded-full bg-[#39FF14] text-black flex items-center justify-center animate-bounce shadow-lg shadow-[#39FF14]/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </div>
          </div>
        </div>

        {/* Text Details & Welcome Message */}
        <div className="max-w-md space-y-6 text-center md:text-left z-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F5FF]/10 border border-[#00F5FF]/20 text-[#00F5FF] text-[9px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 animate-pulse" />
              <span>Next-Gen AI Coach</span>
            </div>
            <h1 className="text-3xl font-display font-black text-white leading-tight uppercase tracking-tight">
              Meet Your <span className="text-[#00F5FF] glow-cyan-text">Fitness Advisor</span>
            </h1>
            <p className="text-xs text-[#C4CDD8] leading-relaxed font-medium">
              "Hello! I am your AI Fitness Coach. I can design customized workout splits, plan your daily caloric macros, suggest healthy recovery routines, and guide you in your fitness journey."
            </p>
          </div>

          <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl text-left space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14] animate-pulse"></span>
              Core Focus Areas:
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] text-mutedText">
              <div className="flex items-center gap-1.5">⚡ Strength Split Designer</div>
              <div className="flex items-center gap-1.5">🥗 Calorie & Macro Targeter</div>
              <div className="flex items-center gap-1.5">🔋 Rest & Recovery Optimizer</div>
              <div className="flex items-center gap-1.5">🎙️ Real-time Voice Coach</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start pt-2">
            <button
              onClick={() => setShowWelcome(false)}
              className="px-8 py-3 rounded-xl text-bg bg-[#39FF14] hover:bg-[#39FF14]/90 glow-green text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-lg shadow-[#39FF14]/20"
            >
              <span>Start Session</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6 pb-4 select-none">
      
      {/* Sidebar for History */}
      <Card className={`w-64 flex-shrink-0 flex flex-col h-full overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 hidden'}`}>
        <div className="p-4 border-b border-white/5">
          <button 
            onClick={startNewChat}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 text-white text-xs font-bold transition-all disabled:opacity-50"
          >
            <Plus className="w-4 h-4 text-actionGreen" />
            New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
          {conversations.map((chat) => (
            <div
              key={chat._id}
              className={`group flex items-center justify-between rounded-xl border text-xs transition-all ${
                activeChatId === chat._id 
                  ? 'bg-[#00F5FF]/10 border-[#00F5FF]/20 text-white' 
                  : 'bg-white/[0.01] border-transparent hover:bg-white/[0.03] text-mutedText hover:text-white'
              }`}
            >
              <button
                onClick={() => loadConversation(chat._id)}
                className="flex-1 text-left p-3 flex items-center gap-2 overflow-hidden"
              >
                <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${activeChatId === chat._id ? 'text-[#00F5FF]' : 'text-white/30'}`} />
                <span className="truncate">{chat.title}</span>
              </button>
              <button
                onClick={(e) => handleDeleteConversation(chat._id, e)}
                className="p-2 mr-1 text-mutedText hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center rounded-lg hover:bg-white/5"
                title="Delete Chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Main Chat Area */}
      <Card className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header Info */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#0F1928]/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <div>
              <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accentCyan animate-pulse" />
                <span>FitTrack AI Coach</span>
              </h2>
              <p className="text-[10px] text-mutedText mt-0.5">Scientific advisor in training splits, rest metrics, and meal macros.</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 text-[9px] font-bold text-[#00F5FF] bg-[#00F5FF]/10 border border-[#00F5FF]/20 px-3 py-1 rounded-full uppercase tracking-wider">
            <Bot className="w-3 h-3" />
            <span>Active</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
          {messages.length === 1 && (
            <div className="max-w-md mx-auto py-8 text-center space-y-4">
              <Bot className="w-10 h-10 text-accentCyan mx-auto glow-cyan p-2 bg-[#0F1928] rounded-xl border border-white/5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Suggested Prompts</h4>
                <p className="text-[10px] text-mutedText">Select a chip below to quickly consult the coach.</p>
              </div>
              
              <div className="flex flex-col space-y-2">
                {suggestionPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p)}
                    className="w-full text-left p-3.5 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-white/10 rounded-xl text-xs text-[#C4CDD8] hover:text-white transition-all flex items-center justify-between group"
                  >
                    <span>{p}</span>
                    <ArrowRight className="w-4 h-4 text-mutedText group-hover:text-accentCyan group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.length > 1 && messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            return (
              <div 
                key={idx} 
                className={`flex items-start gap-3.5 max-w-2xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs flex-shrink-0 ${
                  isUser 
                    ? 'bg-actionGreen/10 border-actionGreen/20 text-[#39FF14]' 
                    : 'bg-[#00F5FF]/15 border-[#00F5FF]/20 text-[#00F5FF]'
                }`}>
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message text */}
                <div 
                  className={`p-4 rounded-2xl border text-xs leading-relaxed shadow-lg ${
                    isUser 
                      ? 'bg-[#0F1928] border-actionGreen/15 text-white rounded-tr-none' 
                      : 'bg-[#0F1928] border-white/5 text-[#C4CDD8] rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            );
          })}

          {isSessionActive && (
            <div className="flex items-center justify-between p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl max-w-sm mx-auto gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex gap-1 items-end h-6">
                  <span className="w-1 bg-red-400 rounded-full animate-bounce [animation-duration:1s] h-4"></span>
                  <span className="w-1 bg-red-400 rounded-full animate-bounce [animation-duration:0.8s] h-6"></span>
                  <span className="w-1 bg-red-400 rounded-full animate-bounce [animation-duration:1.2s] h-5"></span>
                  <span className="w-1 bg-red-400 rounded-full animate-bounce [animation-duration:0.9s] h-3"></span>
                </div>
                <span className="text-xs font-semibold text-white">Voice Coach Connected</span>
              </div>
              <button
                type="button"
                onClick={endVoiceSession}
                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[10px] font-bold transition-all shadow-lg shadow-red-500/10 active:scale-95"
              >
                End Call
              </button>
            </div>
          )}

          {isLoading && !messages.some(m => m.text === '') && (
            <div className="flex items-center space-x-2.5 text-accentCyan animate-pulse mr-auto">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Coach is thinking...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Form at bottom */}
        <div className="p-4 border-t border-white/5 bg-[#0F1928]/50 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="flex gap-3 relative max-w-4xl mx-auto items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here..."
              className="flex-1 bg-[#0B121F] border border-white/10 focus:border-cyan/40 focus:outline-none rounded-xl py-3.5 px-5 text-xs text-white shadow-inner"
              disabled={isLoading || !activeChatId}
            />
            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={!activeChatId}
              className={`p-3.5 rounded-xl border transition-all flex items-center justify-center disabled:opacity-50 flex-shrink-0 ${
                isSessionActive 
                  ? 'bg-red-500 border-red-500/30 text-white shadow-lg shadow-red-500/30 animate-pulse'
                  : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/10 text-mutedText hover:text-white'
              }`}
              title={isSessionActive ? "End Voice Session" : "Start Voice Session"}
            >
              <Mic className={`w-4 h-4 ${isSessionActive ? 'animate-pulse' : ''}`} />
            </button>
            <button
              type="submit"
              disabled={isLoading || !input.trim() || !activeChatId}
              className="px-6 py-3.5 rounded-xl text-bg bg-[#39FF14] hover:bg-[#39FF14]/90 glow-green transition-all disabled:opacity-50 flex items-center justify-center flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-[9px] text-center text-white/30 mt-3">FitTrack AI can make mistakes. Consider verifying important fitness advice.</p>
        </div>
      </Card>

    </div>
  );
}
