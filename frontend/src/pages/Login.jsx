import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { LogIn, UserPlus, Key, Mail, User, Phone, MapPin, AlertCircle, ArrowLeft, ShieldCheck, RefreshCw, CheckCircle } from 'lucide-react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, signup, sendOtp, verifyOtp, resendOtp, loginWithGoogle, currentUser } = useAuth();
  const { INDIAN_STATES } = useLocation();

  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // OTP Verification Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');
  const [demoOtpCode, setDemoOtpCode] = useState('');
  const [resendTimer, setResendTimer] = useState(60);

  // Read URL query tab parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'signup' || tab === 'login') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Redirect to dashboard if logged in & verified (or let user complete OTP if unverified)
  useEffect(() => {
    if (currentUser && !showOtpModal) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate, showOtpModal]);

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer;
    if (showOtpModal && resendTimer > 0) {
      timer = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [showOtpModal, resendTimer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (activeTab === 'login') {
        await login(email, password);
        navigate('/dashboard');
      } else {
        if (!displayName) {
          throw new Error('Please enter your full name.');
        }
        if (!phone || phone.length < 10) {
          throw new Error('Please enter a valid 10-digit mobile number.');
        }
        if (password !== confirmPassword) {
          throw new Error('Password and Confirm Password do not match.');
        }

        await signup(email, password, displayName, phone, state);
        setShowOtpModal(true);
        setResendTimer(60);
        setOtpError('');
        try {
          const otpRes = await sendOtp(email);
          if (otpRes && otpRes.demoOtp) {
            setDemoOtpCode(otpRes.demoOtp);
          }
        } catch (otpErr) {
          setOtpError(otpErr.message || 'Account created, but the verification code could not be generated. Try resending.');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setOtpError("Please enter a valid 6-digit OTP code.");
      return;
    }

    setOtpError('');
    setOtpVerifying(true);

    try {
      const res = await verifyOtp(email, otpCode);
      setOtpSuccessMsg("Account verified successfully! Redirecting...");
      setTimeout(() => {
        setShowOtpModal(false);
        navigate('/dashboard');
      }, 1200);
    } catch (err) {
      setOtpError(err.message || "Invalid OTP code. Please try again.");
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleResendOtpClick = async () => {
    setOtpError('');
    setOtpSuccessMsg('');
    try {
      const res = await resendOtp(email);
      if (res && res.demoOtp) {
        setDemoOtpCode(res.demoOtp);
      }
      setResendTimer(60);
      setOtpSuccessMsg('A new development verification code was generated. No email was sent.');
    } catch (err) {
      setOtpError("Failed to resend OTP.");
    }
  };

  const handleGoogleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
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
              <>
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
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 focus:border-saffron-500 focus:outline-none text-sm transition-colors text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mobile Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Phone size={18} />
                    </span>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 focus:border-saffron-500 focus:outline-none text-sm transition-colors text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">State / Union Territory</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <MapPin size={18} />
                    </span>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 focus:border-saffron-500 focus:outline-none text-sm transition-colors text-slate-900 dark:text-slate-100"
                    >
                      <option value="">Select your registered state / UT</option>
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 focus:border-saffron-500 focus:outline-none text-sm transition-colors text-slate-900 dark:text-slate-100"
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 focus:border-saffron-500 focus:outline-none text-sm transition-colors text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {activeTab === 'signup' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Confirm Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Key size={18} />
                  </span>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 focus:border-saffron-500 focus:outline-none text-sm transition-colors text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            )}

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
                  <UserPlus size={18} /> Register & Verify Account
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
            type="button"
            onClick={handleGoogleLogin}
            disabled
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
            Google Sign-In (not configured)
          </button>
        </div>

        <div className="text-center p-3.5 glass bg-saffron-50 dark:bg-saffron-500/5 rounded-xl border border-saffron-200/50 dark:border-saffron-500/10">
          <p className="text-xs text-saffron-700 dark:text-saffron-400 font-semibold leading-relaxed">
            Accounts require the configured backend. Administrator access is provisioned separately and cannot be granted by choosing an email address.
          </p>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <Modal
          isOpen={showOtpModal}
          onClose={() => setShowOtpModal(false)}
          title="Account Verification"
          subtitle={`Enter the 6-digit development verification code for ${email}`}
        >
          <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
            {otpError && (
              <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle size={16} /> <span>{otpError}</span>
              </div>
            )}

            {otpSuccessMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle size={16} /> <span>{otpSuccessMsg}</span>
              </div>
            )}

            {demoOtpCode && (
              <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 rounded-lg text-xs text-center space-y-1">
                <span className="font-bold">Development-only verification code:</span>
                <span className="block font-mono text-base font-extrabold tracking-widest text-saffron-600 dark:text-saffron-400">{demoOtpCode}</span>
                <span className="text-[10px] text-slate-500">This code is available only when development OTP mode is explicitly enabled.</span>
              </div>
            )}

            <div className="space-y-1 text-center">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="1 2 3 4 5 6"
                className="w-full text-center tracking-[0.5em] text-xl font-mono font-extrabold py-3 px-4 rounded-xl border border-slate-300 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 focus:border-saffron-500 focus:outline-none text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex justify-between items-center text-xs pt-2">
              <span className="text-slate-400">
                {resendTimer > 0 ? `Resend available in ${resendTimer}s` : 'Did not receive code?'}
              </span>
              <button
                type="button"
                disabled={resendTimer > 0}
                onClick={handleResendOtpClick}
                className="text-saffron-500 hover:underline font-bold disabled:opacity-40"
              >
                Resend OTP
              </button>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <Button variant="ghost" type="button" onClick={() => setShowOtpModal(false)}>
                Cancel
              </Button>
              <Button variant="saffron" type="submit" isLoading={otpVerifying} icon={ShieldCheck}>
                Verify Account
              </Button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}
