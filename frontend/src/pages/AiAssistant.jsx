import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { 
  Bot, Send, Mic, MicOff, Volume2, Upload, FileText, Sparkles, User, FileUp, 
  ExternalLink, ArrowRight, ShieldCheck, HelpCircle 
} from 'lucide-react';
import axios from 'axios';
import Card, { CardHeader, CardTitle, CardBody } from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';

export default function AiAssistant() {
  const { profile } = useAuth();
  const { language, t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `Namaste! I am your Smart Bharat AI Civic Companion. Ask me questions about schemes, report civic issues, check DigiLocker files, or find nearby government offices.`,
      actions: [
        { action: 'REPORT_ISSUE', label: 'Report Civic Issue', path: '/dashboard/report' },
        { action: 'GOVERNMENT_SCHEMES', label: 'Explore Schemes', path: '/dashboard/schemes' },
        { action: 'NEARBY_OFFICES', label: 'Nearby Offices', path: '/dashboard/offices' }
      ],
      timestamp: new Date()
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Pending action for confirmation modal
  const [pendingAction, setPendingAction] = useState(null);

  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto scroll to bottom
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
        English: 'en-IN',
        Hindi: 'hi-IN',
        Tamil: 'ta-IN',
        Telugu: 'te-IN',
        Marathi: 'mr-IN',
        Bengali: 'bn-IN',
        Gujarati: 'gu-IN',
        Punjabi: 'pa-IN'
      };
      rec.lang = localeCodes[language] || 'en-IN';

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      rec.onerror = (e) => {
        console.error("Speech Recognition Error:", e);
        setIsListening(false);
      };

      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, [language]);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported in this browser.");
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
      toast.error("Text-To-Speech is not supported in your browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const userQuery = inputText.trim();
    setInputText('');

    const newMessages = [
      ...messages,
      { sender: 'user', text: userQuery, timestamp: new Date() }
    ];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await axios.post('/api/ai/chat', {
        message: userQuery,
        email: profile?.email || 'guest@gmail.com',
        language
      }, { timeout: 3000 });

      setMessages([
        ...newMessages,
        {
          sender: 'bot',
          text: res.data.response,
          actions: res.data.actions || [],
          timestamp: new Date()
        }
      ]);
    } catch (err) {
      console.warn("API server unavailable, using AI smart fallback engine.");
      const q = userQuery.toLowerCase();
      let replyText = `### 🇮🇳 Smart Bharat AI Assistant (${language})\n\nI am ready to assist you with government services:\n\n- **Passports & Driving Licences**: Requirements, fees, portal links.\n- **Civic Complaints**: Report potholes, garbage, or street lights with photo & GPS.\n- **Schemes**: PM-Kisan, Ayushman Bharat health insurance, PM Awas.\n\nAsk me any question!`;
      let actions = [
        { label: 'Report Civic Issue', path: '/dashboard/report' },
        { label: 'Explore Schemes', path: '/dashboard/schemes' },
        { label: 'Nearby Offices', path: '/dashboard/offices' }
      ];

      if (q.includes('passport')) {
        replyText = `### 🛂 Indian Passport Application Guide (${language})\n\n1. **Eligibility**: Citizen of India (Age 18+ for adult, <18 for minor).\n2. **Required Documents**:\n   - **Address Proof**: Water/Electricity bill, Bank passbook, Aadhaar card, or Rent Agreement.\n   - **DOB Proof**: Birth Certificate, School Transfer Certificate, or PAN Card.\n   - **Non-ECR**: 10th Standard passing certificate.\n3. **Fees**: ₹1,500 (Normal 36 pages) / ₹3,500 (Tatkaal).\n4. **Official Steps**:\n   - Register on *passportindia.gov.in* -> Fill online form & pay fee.\n   - Book appointment at nearest PSK (Passport Seva Kendra).\n   - Attend appointment for biometrics and document verification.\n   - Passport is delivered via Speed Post after police verification.`;
      } else if (q.includes('license') || q.includes('licence') || q.includes('dl')) {
        replyText = `### 🚗 Driving Licence (DL) Application Guide (${language})\n\n1. **Eligibility**: Age 18+ (16+ for gearless 50cc). Must hold valid Learner's Licence first.\n2. **Required Documents**:\n   - Learner's Licence (LL).\n   - Passport photos, Age Proof (PAN/Aadhaar), Address Proof.\n3. **Fees**: ₹200 for LL computer test + ₹700–1,000 for Permanent DL drive test.\n4. **Official Steps**:\n   - Apply on Sarathi Parivahan portal (*sarathi.parivahan.gov.in*).\n   - Book LL slot and pass computer test at RTO.\n   - Apply permanent DL 30 days after LL issue and pass physical driving test.`;
      } else if (q.includes('pothole') || q.includes('garbage') || q.includes('report') || q.includes('road') || q.includes('issue')) {
        replyText = `### ⚠️ Report Civic Issue & Municipal Complaints\n\nYou can lodge a formal complaint with photo evidence and GPS location coordinates directly on our portal. Submitting a complaint awards **+20 Civic Points** to your profile!`;
        actions = [{ label: 'Report Civic Issue Now', path: '/dashboard/report' }];
      } else if (q.includes('scheme') || q.includes('kisan') || q.includes('ayushman') || q.includes('pension')) {
        replyText = `### 🌾 Government Welfare Schemes Portal\n\nWe provide eligibility matching for central and state schemes:\n- **PM-KISAN**: ₹6,000/yr direct income support for farmers.\n- **Ayushman Bharat (PM-JAY)**: ₹5 Lakh cashless health cover per family.\n- **PM Awas Yojana**: Housing interest subsidy up to 6.5%.`;
        actions = [{ label: 'Calculate Scheme Eligibility', path: '/dashboard/schemes' }];
      }

      setMessages([
        ...newMessages,
        {
          sender: 'bot',
          text: replyText,
          actions: actions,
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handle action click with confirmation if needed
  const handleActionClick = (act) => {
    if (act.requiresConfirmation) {
      setPendingAction(act);
    } else if (act.path) {
      navigate(act.path);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10 max-w-5xl mx-auto flex flex-col h-[calc(100vh-6rem)]">
      
      {/* Page Header */}
      <PageHeader
        title="Smart Bharat AI Assistant"
        description="Ask questions about schemes, track complaints, or trigger platform actions in natural language."
        icon={Bot}
        badge="Gemini 1.5 Flash Powered"
      />

      {/* Main Chat Container */}
      <Card className="flex-1 flex flex-col overflow-hidden p-0 border border-slate-200 dark:border-navy-800">
        
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-navy-950/30">
          {messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={idx}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                  isUser ? 'bg-navy-800 text-white' : 'bg-saffron-500 text-white'
                }`}>
                  {isUser ? <User size={18} /> : <Bot size={18} />}
                </div>

                {/* Bubble */}
                <div className="space-y-3">
                  <div className={`p-4 rounded-2xl text-xs leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-navy-800 text-white rounded-tr-none'
                      : 'glass bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-slate-800 dark:text-slate-100 rounded-tl-none'
                  }`}>
                    <div className="whitespace-pre-line font-medium">{msg.text}</div>
                    
                    {!isUser && (
                      <button
                        onClick={() => handleSpeakText(msg.text)}
                        className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-bold text-saffron-600 dark:text-saffron-400 hover:underline"
                      >
                        <Volume2 size={12} /> Read Aloud
                      </button>
                    )}
                  </div>

                  {/* Controlled Navigation Action Buttons */}
                  {!isUser && msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {msg.actions.map((act, aIdx) => (
                        <Button
                          key={aIdx}
                          variant="saffron"
                          size="sm"
                          icon={ArrowRight}
                          iconPosition="right"
                          onClick={() => handleActionClick(act)}
                        >
                          {act.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 max-w-md mr-auto animate-pulse">
              <div className="w-9 h-9 rounded-xl bg-saffron-500 text-white flex items-center justify-center shrink-0">
                <Bot size={18} />
              </div>
              <div className="p-4 rounded-2xl glass bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-xs font-semibold text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 bg-saffron-500 rounded-full animate-ping" /> Smart Bharat AI is thinking...
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white dark:bg-navy-900 border-t border-slate-200 dark:border-navy-800">
          <form onSubmit={handleSendMessage} className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleMic}
              className={`p-3 rounded-xl transition-all ${
                isListening
                  ? 'bg-red-600 text-white animate-bounce'
                  : 'bg-slate-100 dark:bg-navy-950 text-slate-500 hover:text-saffron-500'
              }`}
              title="Voice Dictation"
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask anything (e.g., 'Report a pothole in my area' or 'What is Ayushman Bharat?')..."
              className="flex-1 py-3 px-4 rounded-xl border border-slate-250 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
            />

            <Button variant="saffron" type="submit" isLoading={loading} icon={Send}>
              Send
            </Button>
          </form>
        </div>

      </Card>

      {/* Confirmation Dialog for Action Execution */}
      {pendingAction && (
        <ConfirmationDialog
          isOpen={!!pendingAction}
          onClose={() => setPendingAction(null)}
          onConfirm={() => {
            const p = pendingAction.path;
            setPendingAction(null);
            if (p) navigate(p);
          }}
          title="Confirm Navigation Action"
          message={`Are you sure you want to navigate to "${pendingAction.label}"?`}
          confirmText="Proceed"
        />
      )}

    </div>
  );
}
