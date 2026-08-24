import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, Key, Mail, User, AlertCircle, ArrowLeft } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, signup, loginWithGoogle, currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Read URL query tab parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'signup' || tab === 'login') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // If already logged in, redirect straight to dashboard
  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (activeTab === 'login') {
        await login(email, password);
      } else {
        if (!displayName) {
          throw new Error('Please enter your full name');
        }
        await signup(email, password, displayName);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setSubmitting(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Google Sign-In failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      
      {/* Back button */}
      <button 
        onClick={() => navigate('/')} 
        className="absolute top-6 left-6 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-navy-800 dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={16} /> Back to Home
      </button>

      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <span className="text-4xl">🇮🇳</span>
          <h2 className="mt-4 text-3xl font-extrabold font-outfit text-navy-800 dark:text-white">
            Smart Bharat Portal
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Access secure government utilities & personalized schemes
          </p>
        </div>

        {/* Form Container */}
        <div className="glass bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl shadow-xl overflow-hidden p-8 space-y-6">
          
          {/* Tabs header */}
          <div className="flex border-b border-slate-200 dark:border-navy-800">
            <button
              onClick={() => { setActiveTab('login'); setError(''); }}
              className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-all ${
                activeTab === 'login'
                  ? 'border-saffron-500 text-saffron-500'
                  : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab('signup'); setError(''); }}
              className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-all ${
                activeTab === 'signup'
                  ? 'border-saffron-500 text-saffron-500'
                  : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Errors display */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-lg text-sm flex items-start gap-2 animate-shake">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {activeTab === 'signup' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <User size={18} />
                  </span>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 focus:border-saffron-500 focus:outline-none text-sm transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@government.in"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 focus:border-saffron-500 focus:outline-none text-sm transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Key size={18} />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 focus:border-saffron-500 focus:outline-none text-sm transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-navy-800 dark:bg-saffron-500 hover:bg-navy-900 dark:hover:bg-saffron-600 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : activeTab === 'login' ? (
                <>
                  <LogIn size={18} /> Sign In
                </>
              ) : (
                <>
                  <UserPlus size={18} /> Register Profile
                </>
              )}
            </button>
          </form>

          {/* Social Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-navy-800"></div>
            <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">or continue with</span>
            <div className="flex-grow border-t border-slate-200 dark:border-navy-800"></div>
          </div>

          {/* Google Auth Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={submitting}
            className="w-full py-2.5 bg-white dark:bg-navy-950 text-slate-700 dark:text-slate-200 font-bold border border-slate-200 dark:border-navy-800 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-navy-900 transition-all flex items-center justify-center gap-2.5 text-sm"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.28 1.5-.1.83-2.04 2.12v1.76h3.29c1.92-1.77 3.03-4.38 3.03-7.24z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.29-1.76c-.91.61-2.08.97-3.64.97-3.11 0-5.74-2.11-6.68-4.96H1.05v1.82C3.03 21.08 7.18 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.32 15.34c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V8.58H1.05C.38 9.91 0 11.4 0 13s.38 3.09 1.05 4.42l4.27-2.08z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.08 15.24 0 12 0 7.18 0 3.03 2.92 1.05 6.76l4.27 2.08c.94-2.85 3.57-4.96 6.68-4.96z"
              />
            </svg>
            Google Single Sign-In
          </button>
        </div>

        {/* Backdoor Tip */}
        <div className="text-center p-3.5 glass bg-saffron-50 dark:bg-saffron-500/5 rounded-xl border border-saffron-200/50 dark:border-saffron-500/10">
          <p className="text-xs text-saffron-700 dark:text-saffron-400 font-semibold leading-relaxed">
            💡 Developer Sandbox Tip: Log in using <code className="bg-saffron-100 dark:bg-navy-950 px-1.5 py-0.5 rounded font-mono">admin@smartbharat.gov.in</code> (any password) to inspect the administrative control panel features!
          </p>
        </div>
      </div>
    </div>
  );
}
