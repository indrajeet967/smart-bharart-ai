import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Bell, Sun, Moon, LogOut, Menu, User, Settings, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function Navbar({ onMenuToggle }) {
  const { profile, logout } = useAuth();
  const { language, setLanguage, t, languagesList } = useLanguage();
  const { darkMode, toggleDarkMode } = useTheme();
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  // Fetch dynamic government notification feed (personalized)
  useEffect(() => {
    const fetchNotifs = async () => {
      if (!profile?.email) return;
      try {
        const res = await axios.get(`/api/notifications/${profile.email}`);
        setNotifications(res.data);
      } catch (err) {
        console.warn("Could not fetch notifications feed dynamically");
      }
    };
    fetchNotifs();
  }, [profile?.email]);

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 z-30 glass shadow-sm flex items-center justify-between px-6 border-b border-slate-200 dark:border-navy-800 transition-colors duration-300">
      
      {/* Brand & Mobile Hamburger */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuToggle}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-900 md:hidden transition-colors"
        >
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight font-outfit text-navy-800 dark:text-saffron-500 flex items-center gap-1.5">
            🇮🇳 Smart <span className="text-saffron-500 dark:text-white">Bharat</span>
          </span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-4 relative">
        
        {/* Language Switcher */}
        <div className="relative">
          <button 
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-navy-800 hover:bg-slate-50 dark:hover:bg-navy-900 transition-colors bg-white dark:bg-navy-950 flex items-center gap-1.5"
          >
            🌐 {language}
          </button>
          
          {showLangDropdown && (
            <div className="absolute right-0 mt-2 w-40 glass rounded-xl border border-slate-200 dark:border-navy-800 shadow-lg py-1.5 bg-white dark:bg-navy-900 z-50 animate-fade-in">
              {languagesList.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.name);
                    setShowLangDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors ${
                    language === lang.name ? 'text-saffron-500' : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-900 transition-colors bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-800"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun size={18} className="text-saffron-500" /> : <Moon size={18} />}
        </button>

        {/* Personalized Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-900 transition-colors bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-800 relative"
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-saffron-500 rounded-full animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 glass rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xl py-3 bg-white dark:bg-navy-900 z-50 animate-fade-in max-h-96 overflow-y-auto">
              <div className="px-4 pb-2 border-b border-slate-150 dark:border-navy-800 flex justify-between items-center">
                <span className="text-xs font-bold text-navy-800 dark:text-saffron-500 uppercase tracking-wider">{t('notifications')}</span>
                <span className="text-[10px] bg-slate-100 dark:bg-navy-950 px-2 py-0.5 rounded font-mono text-slate-500">{notifications.length} Alerts</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-navy-850">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No recent notices found</p>
                ) : (
                  notifications.map((notif, idx) => (
                    <div key={idx} className="p-3 hover:bg-slate-50 dark:hover:bg-navy-850 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-bold text-navy-800 dark:text-white leading-tight">{notif.title}</span>
                        <span className="text-[9px] bg-saffron-500/10 text-saffron-600 dark:text-saffron-400 px-1.5 py-0.5 rounded font-semibold shrink-0">
                          {notif.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-350 mt-1 leading-relaxed">{notif.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Info & Logout */}
        <div className="flex items-center gap-3 border-l border-slate-250 dark:border-navy-800 pl-4">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{profile?.displayName || 'Citizen'}</p>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{profile?.role === 'admin' ? 'Admin' : 'Citizen'}</p>
          </div>
          {profile?.photoURL ? (
            <img 
              src={profile.photoURL} 
              alt="User profile" 
              className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-navy-800"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-navy-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-navy-800">
              <User size={16} />
            </div>
          )}
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            title="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>

      </div>
    </nav>
  );
}
