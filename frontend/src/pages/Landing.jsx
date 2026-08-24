import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, ShieldCheck, HelpCircle, MapPin, AlertTriangle, Gift, BookOpen, ChevronRight, FileText, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Landing() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold tracking-tight font-outfit text-navy-800 dark:text-saffron-500 flex items-center gap-2">
                🇮🇳 Smart <span className="text-saffron-500 dark:text-white">Bharat</span>
              </span>
              <span className="hidden md:inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-navy-100 text-navy-800 dark:bg-navy-900/50 dark:text-navy-200 border border-navy-200 dark:border-navy-800">
                Civic Companion
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login" className="px-4 py-2 text-sm font-semibold text-navy-800 dark:text-white hover:text-saffron-500 transition-colors">
                Sign In
              </Link>
              <Link to="/login?tab=signup" className="px-4 py-2 text-sm font-semibold text-white bg-navy-800 dark:bg-saffron-500 hover:bg-navy-900 dark:hover:bg-saffron-600 rounded-lg shadow-md transition-all duration-200">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-b from-saffron-50/50 via-white to-navy-50/20 dark:from-navy-950 dark:via-navy-900/40 dark:to-navy-950">
        <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-saffron-500/20 rounded-full blur-3xl" />
          <div className="absolute top-80 -left-40 w-96 h-96 bg-navy-800/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-saffron-100 text-saffron-700 dark:bg-saffron-500/10 dark:text-saffron-400 mb-6 border border-saffron-200/50 dark:border-saffron-500/20">
            <span className="w-2 h-2 rounded-full bg-saffron-500 animate-ping" />
            AI-Powered Digital Governance Portal
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight font-outfit text-navy-800 dark:text-white leading-tight">
            Empowering Citizens, <br />
            <span className="bg-gradient-to-r from-saffron-500 to-navy-800 dark:from-saffron-400 dark:to-teal-400 bg-clip-text text-transparent">
              Elevating Governance
            </span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-300">
            Lodge complaints, discover eligible government schemes, manage your certificates securely in our AI Digital Locker, and interact with our multilingual assistant.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to="/login?tab=signup" className="flex items-center gap-2 px-8 py-3 text-base font-semibold text-white bg-navy-800 dark:bg-saffron-500 hover:bg-navy-900 dark:hover:bg-saffron-600 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200">
              Lodge a Complaint <ChevronRight size={18} />
            </Link>
            <Link to="/login" className="flex items-center gap-2 px-8 py-3 text-base font-semibold text-navy-800 dark:text-slate-200 bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-navy-800 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-navy-900 transition-all duration-200">
              Talk to AI Assistant
            </Link>
          </div>
        </div>
      </header>

      {/* Dynamic Statistics Panel */}
      <section className="py-12 bg-white dark:bg-navy-900 border-y border-slate-200 dark:border-navy-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <p className="text-4xl md:text-5xl font-extrabold font-outfit text-saffron-500">12,450+</p>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">Issues Resolved</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl md:text-5xl font-extrabold font-outfit text-navy-800 dark:text-white">85,000+</p>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">Active Citizens</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl md:text-5xl font-extrabold font-outfit text-emerald-600 dark:text-emerald-400">₹4.2 Cr+</p>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">Scheme Fundings Claimed</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl md:text-5xl font-extrabold font-outfit text-saffron-500">48 Hours</p>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">Average Response Time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-outfit text-navy-800 dark:text-white">Empowerment at Your Fingertips</h2>
          <p className="mt-4 text-slate-500 dark:text-slate-400 max-w-xl mx-auto">Explore the range of custom services designed to deliver smooth municipal governance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Multilingual AI Chat */}
          <div className="p-6 rounded-2xl glass hover-card-trigger bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-saffron-100 dark:bg-saffron-500/10 text-saffron-600 dark:text-saffron-400 flex items-center justify-center mb-6">
                <Bot size={24} />
              </div>
              <h3 className="text-xl font-bold text-navy-800 dark:text-white">Multilingual AI Chatbot</h3>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Ask government questions, translate guidelines, and apply for passports, licences, and cards in your regional language with voice commands.
              </p>
            </div>
            <Link to="/login" className="mt-6 text-sm font-semibold text-saffron-500 dark:text-saffron-400 flex items-center gap-1 hover:gap-2 transition-all">
              Launch Assistant <ChevronRight size={16} />
            </Link>
          </div>

          {/* Card 2: AI Public Issue Report */}
          <div className="p-6 rounded-2xl glass hover-card-trigger bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-navy-100 dark:bg-navy-800 text-navy-800 dark:text-slate-200 flex items-center justify-center mb-6">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-navy-800 dark:text-white">AI Issue Reporting</h3>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Snap a photo of garbage or road damage. Our AI auto-categorizes, tags your GPS coordinates, and assigns department priority levels instantly.
              </p>
            </div>
            <Link to="/login" className="mt-6 text-sm font-semibold text-saffron-500 dark:text-saffron-400 flex items-center gap-1 hover:gap-2 transition-all">
              File Report <ChevronRight size={16} />
            </Link>
          </div>

          {/* Card 3: Secure Digital Locker */}
          <div className="p-6 rounded-2xl glass hover-card-trigger bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold text-navy-800 dark:text-white">AI Digital Locker</h3>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Securely store documents. Upload photos of Aadhaar or PAN, and let Gemini execute OCR, auto-verify formats, and flag expirations.
              </p>
            </div>
            <Link to="/login" className="mt-6 text-sm font-semibold text-saffron-500 dark:text-saffron-400 flex items-center gap-1 hover:gap-2 transition-all">
              Open Locker <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Citizen Rewards Showcase */}
      <section className="py-20 bg-gradient-to-br from-navy-800 to-navy-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
          <div className="max-w-xl space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-saffron-500 text-white border border-saffron-400/50">
              <Gift size={12} />
              Gamified Civic Participation
            </span>
            <h2 className="text-3xl md:text-4xl font-bold font-outfit">Citizen Rewards System</h2>
            <p className="text-slate-200 text-base leading-relaxed">
              Earn reward points directly to your civic profile when issues you report are marked as resolved by city administrators. Redeem points for verified discounts and display badges representing your local service.
            </p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-saffron-500" size={18} />
                <span className="text-sm font-medium">Earn up to 150 points per report</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-saffron-500" size={18} />
                <span className="text-sm font-medium">Unlock badges & titles</span>
              </div>
            </div>
          </div>
          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-6">
            {/* Mock Badges Card */}
            <div className="p-6 rounded-2xl glass bg-white/10 border border-white/20 text-center w-60">
              <div className="w-20 h-20 rounded-full bg-saffron-500/20 text-saffron-400 mx-auto flex items-center justify-center mb-4 border border-saffron-500/30">
                🎖️
              </div>
              <p className="font-bold text-lg font-outfit">Civic Guardian</p>
              <p className="text-xs text-slate-300 mt-1">Awarded at 300 points</p>
            </div>
            <div className="p-6 rounded-2xl glass bg-white/10 border border-white/20 text-center w-60">
              <div className="w-20 h-20 rounded-full bg-teal-500/20 text-teal-400 mx-auto flex items-center justify-center mb-4 border border-teal-500/30">
                🌱
              </div>
              <p className="font-bold text-lg font-outfit">Eco Hero</p>
              <p className="text-xs text-slate-300 mt-1">Awarded for sanitation reports</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-100 dark:bg-navy-950 border-t border-slate-200 dark:border-navy-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <p className="text-xl font-bold font-outfit text-navy-800 dark:text-white">🇮🇳 Smart Bharat</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Connecting citizens and municipal corporations via cutting edge artificial intelligence models.
          </p>
          <div className="text-xs text-slate-400 dark:text-slate-500 space-y-1">
            <p>© {new Date().getFullYear()} Smart Bharat Portal. All rights reserved.</p>
            <p>Built with React + Node.js + MongoDB + Google Gemini AI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
