import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLocation } from '../context/LocationContext';
import { useToast } from '../context/ToastContext';
import { 
  Bot, Send, Mic, MicOff, Volume2, Sparkles, User,
  ExternalLink, ArrowRight, ShieldCheck, RefreshCw,
  MapPin, FileText, BookOpen, AlertCircle, ChevronRight
} from 'lucide-react';
import axios from 'axios';
import Card, { CardHeader, CardTitle, CardBody } from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { DOCUMENT_SERVICES, GOVERNMENT_SCHEMES } from '../data/governmentKnowledge';

// ─── Local knowledge search ───────────────────────────────────────────────
function searchKnowledgeBase(query) {
  const q = query.toLowerCase();
  const results = [];

  // Search document services
  for (const svc of DOCUMENT_SERVICES) {
    const score =
      (svc.name.toLowerCase().includes(q) ? 5 : 0) +
      (svc.tags?.some(t => q.includes(t)) ? 4 : 0) +
      (svc.category.toLowerCase().includes(q) ? 2 : 0) +
      (q.split(' ').some(w => svc.tags?.includes(w)) ? 3 : 0);
    if (score > 0) results.push({ type: 'document', item: svc, score });
  }

  // Search schemes
  for (const scheme of GOVERNMENT_SCHEMES) {
    const score =
      (scheme.title.toLowerCase().includes(q) ? 5 : 0) +
      (scheme.tags?.some(t => q.includes(t)) ? 4 : 0) +
      (scheme.category.toLowerCase().includes(q) ? 2 : 0) +
      (scheme.description.toLowerCase().includes(q) ? 1 : 0);
    if (score > 0) results.push({ type: 'scheme', item: scheme, score });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 3);
}

// ─── Build structured response from knowledge base ───────────────────────
function buildKBResponse(results, query, selectedLocation) {
  if (results.length === 0) return null;
  const top = results[0];

  if (top.type === 'document') {
    const d = top.item;
    const locationNote = selectedLocation?.state
      ? `\n\n📍 **Your selected state:** ${selectedLocation.state}. ${
          d.note
            ? `Note: ${d.note}`
            : 'Check your state\'s official portal for state-specific rules.'
        }`
      : '';

    return {
      text: `## 📋 ${d.name}\n\n**Category:** ${d.category} | **Jurisdiction:** ${d.jurisdiction}\n\n**Who can apply:** ${d.who}\n\n**Eligibility:** ${d.eligibility}\n\n**Required Documents:**\n${d.requiredDocuments.map(doc => `• ${doc}`).join('\n')}\n\n**Application Process:**\n${d.process.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n\n**Fees and processing time:** Not verified in this catalog; confirm on the official portal.\n\n**Helpline:** ${d.helpline || 'Check the official website.'}\n\n_Source: ${d.source || 'No official source link available.'} | Catalog information may be outdated; check the official portal before applying._${locationNote}`,
      actions: [
        d.applyUrl && { label: '🔗 Apply on Official Portal', url: d.applyUrl },
        d.statusUrl && { label: '🔍 Check Application Status', url: d.statusUrl },
        d.downloadUrl && { label: '⬇️ Download Document', url: d.downloadUrl },
        d.correctionUrl && { label: '✏️ Correction / Update', url: d.correctionUrl },
        d.officialWebsite && { label: '🌐 Official Website', url: d.officialWebsite },
      ].filter(Boolean),
    };
  }

  if (top.type === 'scheme') {
    const s = top.item;
    return {
      text: `## 🌾 ${s.title}\n\n**Category:** ${s.category} | **Level:** ${s.level} | **State:** ${s.state === 'All' ? 'All India' : s.state}\n\n${s.description}\n\n**Who may benefit:** ${s.eligibility?.who || s.beneficiaries || 'Check the official eligibility criteria.'}\n\n**Benefits listed in this catalog:** ${s.benefits || 'Not verified in this catalog; check the official source.'}\n\n**Required Documents:**\n${(s.requiredDocuments || []).map(d => `• ${d}`).join('\n')}\n\n**How to Apply:** ${s.applicationProcess || 'Check the official portal for current instructions.'}\n\n**Helpline:** ${s.helpline || 'See the official website.'}\n\n_Source: ${s.officialSource || 'No official source link available.'} | Catalog information may be outdated. A potential match is not an eligibility decision or approval._`,
      actions: [
        s.applyUrl && { label: '🔗 Apply Now', url: s.applyUrl },
        s.statusUrl && { label: '🔍 Check Status', url: s.statusUrl },
        s.officialSource && { label: '📖 Official Details', url: s.officialSource },
      ].filter(Boolean),
    };
  }

  return null;
}

// ─── Suggested quick questions ────────────────────────────────────────────
const SUGGESTED_QUESTIONS = [
  'How do I apply for a new PAN card?',
  'How to download my Aadhaar card?',
  'How to apply for a Passport?',
  'PM-KISAN eligibility and registration',
  'How to apply for Ayushman Bharat card?',
  'What is MGNREGA job card?',
  'How to apply for income certificate?',
  'How to register on e-Shram portal?',
  'National Scholarship Portal application process',
  'How to apply for voter ID card?',
  'RTI application process',
  'Driving licence application guide',
];

// ─── Parse markdown-like text to basic HTML-safe display ─────────────────
function FormatMessage({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  const renderInline = (line) => line.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });

  return (
    <div className="space-y-1 text-xs leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return <h3 key={i} className="text-sm font-extrabold text-navy-800 dark:text-white mt-2 mb-1">{line.replace('## ', '')}</h3>;
        }
        if (line.startsWith('### ')) {
          return <h4 key={i} className="text-xs font-bold text-saffron-600 dark:text-saffron-400 mt-2">{line.replace('### ', '')}</h4>;
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="font-bold text-navy-800 dark:text-white">{line.replace(/\*\*/g, '')}</p>;
        }
        if (line.startsWith('• ') || line.startsWith('- ')) {
          return <p key={i} className="pl-3 text-slate-700 dark:text-slate-200">{line}</p>;
        }
        if (/^\d+\./.test(line)) {
          return <p key={i} className="pl-3 text-slate-700 dark:text-slate-200">{line}</p>;
        }
        if (line.startsWith('_') && line.endsWith('_')) {
          return <p key={i} className="text-[10px] text-slate-400 italic mt-2">{line.replace(/_/g, '')}</p>;
        }
        if (line.trim() === '') return <br key={i} />;
        return <p key={i} className="text-slate-700 dark:text-slate-200">{renderInline(line)}</p>;
      })}
    </div>
  );
}

export default function AiAssistant() {
  const { profile } = useAuth();
  const { language, t } = useLanguage();
  const { selectedLocation } = useLocation();
  const toast = useToast();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `## Namaste! I am your Smart Bharat AI Civic Companion.\n\nI can help you find information about:\n\n• **Identity Documents** – Aadhaar, PAN, Passport, Voter ID, Driving Licence\n• **State Certificates** – Income, Caste, Domicile, Birth, Ration Card\n• **Government Schemes** – Find official sources and compare catalog rules\n• **Farmer Services** – PM-KISAN, Soil Health Card, crop insurance\n• **Civic Complaints** – Prepare a report and find jurisdiction-specific guidance\n• **Emergency** – Call 112 for urgent assistance\n\n${selectedLocation?.state ? `Your selected state: **${selectedLocation.state}**. State-specific services may vary.\n\n` : ''}Ask me anything in **English**, **Hindi**, or **Hinglish**!`,
      actions: [
        { label: 'Report Civic Issue', path: '/dashboard/report' },
        { label: 'Explore Schemes', path: '/dashboard/schemes' },
        { label: 'Nearby Offices', path: '/dashboard/offices' },
      ],
      timestamp: new Date(),
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // STT Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;

      const localeCodes = {
        English: 'en-IN', Hindi: 'hi-IN', Tamil: 'ta-IN', Telugu: 'te-IN',
        Marathi: 'mr-IN', Bengali: 'bn-IN', Gujarati: 'gu-IN', Punjabi: 'pa-IN',
      };
      rec.lang = localeCodes[language] || 'en-IN';

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, [language]);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition is not supported in this browser.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSpeakText = (text) => {
    if (!('speechSynthesis' in window)) {
      toast.error('Text-To-Speech is not supported in your browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`>]/g, '').replace(/#{1,3} /g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.9;
    utterance.lang = language === 'Hindi' ? 'hi-IN' : 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (queryText) => {
    const userQuery = (queryText || inputText).trim();
    if (!userQuery) return;
    if (loading) return;

    setInputText('');
    setApiError(false);

    const newMessages = [
      ...messages,
      { sender: 'user', text: userQuery, timestamp: new Date() }
    ];
    setMessages(newMessages);
    setLoading(true);

    // ── 1. Search local knowledge base first ─────────────────────────────
    const kbResults = searchKnowledgeBase(userQuery);
    const kbResponse = buildKBResponse(kbResults, userQuery, selectedLocation);

    try {
      // ── 2. Call backend Gemini API with context ──────────────────────
      const res = await axios.post('/api/ai/chat', {
        message: userQuery,
        email: profile?.email || 'guest@smartbharat.gov.in',
        language,
        selectedState: selectedLocation?.state || profile?.state || '',
        selectedCity: selectedLocation?.city || '',
        kbContext: kbResponse ? kbResponse.text.substring(0, 800) : '',
        chatHistory: messages.slice(-8).map(m => ({
          sender: m.sender,
          text: m.text.substring(0, 300),
        })),
      }, { timeout: 15000 });

      const botText = res.data.response || 'I could not generate a response. Please try again.';
      const botActions = res.data.actions || (kbResponse?.actions || []);

      setMessages([
        ...newMessages,
        {
          sender: 'bot',
          text: botText,
          actions: botActions,
          kbLinks: kbResponse?.actions || [],
          timestamp: new Date(),
        }
      ]);
      setRetryCount(0);
    } catch (err) {
      // ── 3. Fallback: use local KB response or generic fallback ────────
      console.warn('AI API unavailable, using local knowledge base fallback.');
      setApiError(true);

      if (kbResponse) {
        setMessages([
          ...newMessages,
          {
            sender: 'bot',
            text: kbResponse.text + '\n\n_ℹ️ Response from Smart Bharat knowledge base (offline mode)._',
            actions: kbResponse.actions || [],
            timestamp: new Date(),
          }
        ]);
      } else {
        // Generic fallback
        const q = userQuery.toLowerCase();
        let fallbackText = buildGenericFallback(q, language, selectedLocation);
        setMessages([
          ...newMessages,
          {
            sender: 'bot',
            text: fallbackText,
            actions: [
              { label: 'View All Schemes', path: '/dashboard/schemes' },
              { label: 'Report Issue', path: '/dashboard/report' },
              { label: 'Nearby Offices', path: '/dashboard/offices' },
            ],
            timestamp: new Date(),
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    const lastUser = [...messages].reverse().find(m => m.sender === 'user');
    if (lastUser) {
      setRetryCount(r => r + 1);
      handleSendMessage(lastUser.text);
    }
  };

  const handleActionClick = (act) => {
    if (act.url) {
      try {
        const url = new URL(act.url, window.location.origin);
        if (url.protocol !== 'https:' && url.origin !== window.location.origin) {
          toast.error('This link uses an unsupported protocol.');
          return;
        }
        window.open(url.href, '_blank', 'noopener,noreferrer');
      } catch {
        toast.error('This link is invalid.');
      }
    } else if (act.path) {
      navigate(act.path);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in pb-4 max-w-5xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 6.5rem)' }}>
      
      {/* Page Header */}
      <PageHeader
        title="Smart Bharat AI Assistant"
        description="Explore government-service catalog links and get assistance in English, Hindi, or Hinglish. Confirm current requirements with the linked authority."
        icon={Bot}
        badge="Gemini + Knowledge Base"
      />

      {/* Location Context Banner */}
      {selectedLocation?.state && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-xs font-semibold text-blue-800 dark:text-blue-300">
          <MapPin size={13} className="text-blue-500 shrink-0" />
          <span>Location context active: <strong>{selectedLocation.displayName}</strong> — I'll include {selectedLocation.state}-specific information.</span>
        </div>
      )}

      {/* Main Chat Container */}
      <Card className="flex-1 flex flex-col overflow-hidden p-0 border border-slate-200 dark:border-navy-800 min-h-0">
        
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50 dark:bg-navy-950/30">
          {messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            return (
              <div key={idx} className={`flex gap-3 ${isUser ? 'ml-auto flex-row-reverse max-w-xl' : 'mr-auto max-w-3xl'}`}>
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                  isUser ? 'bg-navy-800 text-white' : 'bg-saffron-500 text-white'
                }`}>
                  {isUser ? <User size={16} /> : <Bot size={16} />}
                </div>

                {/* Bubble */}
                <div className="space-y-2 min-w-0">
                  <div className={`p-4 rounded-2xl shadow-sm ${
                    isUser
                      ? 'bg-navy-800 text-white rounded-tr-none text-xs'
                      : 'bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-tl-none'
                  }`}>
                    {isUser ? (
                      <p className="text-xs font-medium">{msg.text}</p>
                    ) : (
                      <FormatMessage text={msg.text} />
                    )}

                    {!isUser && (
                      <button
                        onClick={() => handleSpeakText(msg.text)}
                        className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-bold text-saffron-600 dark:text-saffron-400 hover:underline"
                      >
                        <Volume2 size={11} /> Read Aloud
                      </button>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {!isUser && msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {msg.actions.map((act, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => handleActionClick(act)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-saffron-500 hover:bg-saffron-600 text-white text-[11px] font-bold transition-all shadow-sm"
                        >
                          {act.url ? <ExternalLink size={11} /> : <ArrowRight size={11} />}
                          {act.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  {msg.timestamp && (
                    <p className="text-[10px] text-slate-400 px-1">
                      {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex gap-3 max-w-md mr-auto animate-pulse">
              <div className="w-9 h-9 rounded-xl bg-saffron-500 text-white flex items-center justify-center shrink-0">
                <Bot size={16} />
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-xs font-semibold text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 bg-saffron-500 rounded-full animate-ping" />
                Smart Bharat AI is researching your query...
              </div>
            </div>
          )}

          {/* API Error retry */}
          {apiError && !loading && (
            <div className="flex justify-center">
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold hover:bg-amber-100 transition-all"
              >
                <RefreshCw size={13} /> AI server unavailable — retry with knowledge base
              </button>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length <= 1 && (
          <div className="px-4 py-3 border-t border-slate-100 dark:border-navy-800 bg-slate-50 dark:bg-navy-950/50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Suggested Questions</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.slice(0, 6).map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(q)}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:border-saffron-400 hover:text-saffron-600 transition-all flex items-center gap-1"
                >
                  <ChevronRight size={10} className="text-saffron-400" />
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 bg-white dark:bg-navy-900 border-t border-slate-200 dark:border-navy-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMic}
              className={`p-3 rounded-xl transition-all shrink-0 ${
                isListening
                  ? 'bg-red-600 text-white animate-bounce'
                  : 'bg-slate-100 dark:bg-navy-950 text-slate-500 hover:text-saffron-500'
              }`}
              title="Voice input"
            >
              {isListening ? <MicOff size={17} /> : <Mic size={17} />}
            </button>

            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="Ask about government documents, schemes, complaints... (English/Hindi/Hinglish)"
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
              disabled={loading}
            />

            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={loading || !inputText.trim()}
              className="p-3 rounded-xl bg-saffron-500 hover:bg-saffron-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
              title="Send message"
            >
              <Send size={17} />
            </button>
          </div>

          <p className="text-[10px] text-slate-400 text-center mt-2">
            ⚠️ Always verify information on official government portals (.gov.in). Smart Bharat AI does not share OTPs, passwords, or handle actual government submissions.
          </p>
        </div>
      </Card>
    </div>
  );
}

// ─── Generic fallback responses ───────────────────────────────────────────
function buildGenericFallback(q, language, selectedLocation) {
  const state = selectedLocation?.state ? `In **${selectedLocation.state}**, ` : '';

  if (q.includes('pothole') || q.includes('road') || q.includes('garbage') || q.includes('sewage') || q.includes('light')) {
    return `## Civic issue guidance\n\n${state}use the Report Issue wizard to prepare a report for Smart Bharat's internal tracker, or contact the responsible municipal authority through its official website. A Smart Bharat report is not submitted to a government portal. The correct external route depends on the local authority and issue type; confirm it before filing.\n\n_For an immediate emergency, call 112._`;
  }

  if (q.includes('scheme') || q.includes('yojana') || q.includes('benefit') || q.includes('subsidy')) {
    return `## Government schemes discovery\n\nBrowse the Smart Bharat catalog for scheme descriptions and available source links. Its rules may be incomplete or out of date, so confirm current eligibility, benefits, dates, and application availability on the relevant official portal before applying.\n\nYou can also explore [myScheme](https://www.myscheme.gov.in/), India's government scheme discovery portal. ${state}a potential catalog match is not an eligibility decision or approval.`;
  }

  return `## Smart Bharat AI Assistant\n\nI could not find a matching catalog entry, and the AI service is unavailable. Try asking about a specific document, scheme, or service, or search the official government portal for your jurisdiction. Catalog information can be incomplete or outdated; confirm requirements and links with the responsible authority before acting.\n\n_Selected language: ${language}. Selected state: ${selectedLocation?.state || 'not set'}._`;
}
