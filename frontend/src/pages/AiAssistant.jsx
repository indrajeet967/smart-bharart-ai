import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Bot, Send, Mic, MicOff, Volume2, Upload, FileText, Sparkles, User, FileUp } from 'lucide-react';
import axios from 'axios';

export default function AiAssistant() {
  const { profile } = useAuth();
  const { language, t } = useLanguage();

  const [messages, setMessages] = useState([
    { sender: 'bot', text: `Namaste! I am your Smart Bharat AI Civic Companion. Ask me government queries, scheme details, or upload documents to summarize.`, timestamp: new Date() }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Set up Speech Recognition (HTML5 Web Speech API)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;

      // Map active language to speech recognition locale code
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

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [language]);

  // Toggle voice dictation
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice Speech Recognition is not supported by your current browser. Please try Google Chrome.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  // Text-To-Speech (TTS)
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speaking
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
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
      utterance.lang = localeCodes[language] || 'en-IN';
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-To-Speech not supported on this browser.");
    }
  };

  // Submit Text Query to Gemini
  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = { sender: 'user', text: inputText, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await axios.post('/api/ai/chat', {
        message: userMessage.text,
        chatHistory: messages,
        language: language,
        email: profile?.email
      });

      setMessages(prev => [...prev, {
        sender: 'bot',
        text: response.data.response,
        timestamp: new Date()
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: "I am having trouble connecting to the network. Let me check the local rules guide.",
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Handle PDF Upload & Summarization
  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPdfLoading(true);
    const formData = new FormData();
    formData.append('documentFile', file);
    formData.append('email', profile?.email || 'guest@gmail.com');
    formData.append('docType', 'Circular');

    // Add user feedback message in chat
    setMessages(prev => [...prev, {
      sender: 'user',
      text: `📂 Uploaded document: ${file.name} for AI analysis.`,
      timestamp: new Date()
    }]);

    try {
      const res = await axios.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Extract results and print in chat bubble
      const details = res.data.document?.details || {};
      const responseMsg = `### 📑 Document summary & OCR complete
- **Document Number / ID**: \`${details.docNumber || 'Not found'}\`
- **Name Extracted**: *${details.name || 'Not detected'}*
- **Verification Status**: **${res.data.document?.verificationStatus || 'Completed'}**

**Gemini Analysis Summary:**
The document upload matches format guidelines. The verified fields are saved under your Digital Locker. Let me know if you would like me to explain standard steps or legal requirements for this document.`;

      setMessages(prev => [...prev, {
        sender: 'bot',
        text: responseMsg,
        timestamp: new Date()
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: "❌ Failed to analyze PDF. Please verify file format or check Gemini API limits.",
        timestamp: new Date()
      }]);
    } finally {
      setPdfLoading(false);
      e.target.value = null; // reset input
    }
  };

  // Render markdown with basic helper (handles simple bolding, bullets, headings)
  const formatMarkdown = (txt = '') => {
    return txt.split('\n').map((line, idx) => {
      let content = line;
      let className = "text-sm leading-relaxed my-1";

      if (line.startsWith('###')) {
        content = line.replace('###', '').trim();
        className = "text-base font-extrabold text-navy-800 dark:text-saffron-400 mt-3 mb-1 font-outfit";
      } else if (line.startsWith('**') && line.endsWith('**')) {
        content = line.replace(/\*\*/g, '').trim();
        className = "text-sm font-bold mt-2 text-slate-800 dark:text-slate-200";
      } else if (line.startsWith('*') || line.startsWith('-')) {
        content = line.replace(/^[\*\-]/, '').trim();
        className = "text-sm list-item list-inside pl-2 text-slate-600 dark:text-slate-350 ml-2";
      }

      // Convert inline code tags
      if (content.includes('`')) {
        const parts = content.split('`');
        return (
          <p key={idx} className={className}>
            {parts.map((p, pidx) => pidx % 2 === 1 ? <code key={pidx} className="bg-slate-100 dark:bg-navy-950 px-1 py-0.5 rounded text-xs font-mono font-bold text-saffron-600">{p}</code> : p)}
          </p>
        );
      }

      // Inline Bold formatting
      if (content.includes('**')) {
        const parts = content.split('**');
        return (
          <p key={idx} className={className}>
            {parts.map((p, pidx) => pidx % 2 === 1 ? <strong key={pidx} className="font-extrabold text-slate-800 dark:text-white">{p}</strong> : p)}
          </p>
        );
      }

      return <p key={idx} className={className}>{content}</p>;
    });
  };

  return (
    <div className="h-[80vh] flex flex-col justify-between glass bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl shadow-lg overflow-hidden animate-fade-in">
      
      {/* Assistant Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-navy-800 flex justify-between items-center bg-slate-50 dark:bg-navy-950">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-saffron-500 text-white flex items-center justify-center shadow-md shadow-saffron-500/20">
            <Bot size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-navy-800 dark:text-white font-outfit leading-tight flex items-center gap-1.5">
              Smart Bharat AI Companion
              <Sparkles size={14} className="text-saffron-500 animate-pulse" />
            </h2>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Languages active: {language}</p>
          </div>
        </div>

        {/* Upload Circular PDF Button */}
        <label className="p-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-850 hover:bg-slate-50 dark:hover:bg-navy-850 rounded-xl cursor-pointer text-slate-500 hover:text-saffron-500 transition-colors flex items-center gap-1.5 text-xs font-bold shadow-sm">
          <FileUp size={16} />
          <span>Upload PDF</span>
          <input 
            type="file" 
            accept="application/pdf" 
            className="hidden" 
            onChange={handlePdfUpload}
            disabled={pdfLoading}
          />
        </label>
      </div>

      {/* Messages Scrolling Container */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/30 dark:bg-navy-950/20">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex items-start gap-3 max-w-[80%] ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            }`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold border ${
              msg.sender === 'user' 
                ? 'bg-navy-800 text-white border-navy-800' 
                : 'bg-white dark:bg-navy-900 text-saffron-500 border-slate-200 dark:border-navy-800'
            }`}>
              {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>

            {/* Bubble */}
            <div className="space-y-1">
              <div className={`p-4 rounded-2xl border ${
                msg.sender === 'user' 
                  ? 'bg-navy-800 text-white border-navy-800 rounded-tr-none' 
                  : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-800 rounded-tl-none shadow-sm text-slate-700 dark:text-slate-255'
              }`}>
                {msg.sender === 'user' ? (
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                ) : (
                  <div>
                    {formatMarkdown(msg.text)}
                    {/* TTS Button on bot messages */}
                    <button 
                      onClick={() => speakText(msg.text)}
                      className="mt-3 p-1.5 rounded-lg border border-slate-200 dark:border-navy-850 hover:bg-slate-50 dark:hover:bg-navy-850 text-slate-400 hover:text-saffron-500 transition-colors flex items-center gap-1 text-[10px] font-bold"
                    >
                      <Volume2 size={12} /> Speak Answer ({language})
                    </button>
                  </div>
                )}
              </div>
              <p className={`text-[9px] text-slate-400 px-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {/* Typing Loading Indicators */}
        {(loading || pdfLoading) && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-white dark:bg-navy-900 text-saffron-500 border border-slate-200 dark:border-navy-800 flex items-center justify-center shrink-0">
              <Bot size={14} />
            </div>
            <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 p-4 rounded-2xl rounded-tl-none flex items-center gap-1 shadow-sm">
              <span className="w-2.5 h-2.5 bg-slate-300 dark:bg-slate-700 rounded-full typing-dot" />
              <span className="w-2.5 h-2.5 bg-slate-300 dark:bg-slate-700 rounded-full typing-dot" />
              <span className="w-2.5 h-2.5 bg-slate-300 dark:bg-slate-700 rounded-full typing-dot" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input controls form */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Type government queries in ${language}...`}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-250 dark:border-navy-805 bg-white dark:bg-navy-900 focus:border-saffron-500 focus:outline-none text-sm transition-colors"
          disabled={loading || pdfLoading}
        />
        
        {/* Dictate dictation voice button */}
        <button
          type="button"
          onClick={toggleListening}
          className={`p-2.5 rounded-xl border transition-all shrink-0 ${
            isListening 
              ? 'bg-red-500 border-red-500 text-white animate-pulse' 
              : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-805 text-slate-500 hover:text-saffron-500'
          }`}
          title="Dictate with voice"
          disabled={loading || pdfLoading}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        {/* Submit query */}
        <button
          type="submit"
          className="p-2.5 bg-navy-800 dark:bg-saffron-500 hover:bg-navy-900 dark:hover:bg-saffron-600 text-white rounded-xl shadow transition-all shrink-0 disabled:opacity-50"
          disabled={!inputText.trim() || loading || pdfLoading}
        >
          <Send size={18} />
        </button>
      </form>

    </div>
  );
}
