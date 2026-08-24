import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Home, Bot, BookOpen, AlertTriangle, Search, ShieldAlert,
  MapPin, Shield, User, Settings, Lock
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { profile } = useAuth();
  const { t } = useLanguage();

  const links = [
    { to: '/dashboard', label: t('home'), icon: Home },
    { to: '/dashboard/ai', label: t('aiAssistant'), icon: Bot },
    { to: '/dashboard/schemes', label: t('govSchemes'), icon: BookOpen },
    { to: '/dashboard/report', label: t('reportIssue'), icon: AlertTriangle },
    { to: '/dashboard/track', label: t('complaintTracker'), icon: Search },
    { to: '/dashboard/locker', label: t('docAssistant'), icon: Lock },
    { to: '/dashboard/offices', label: t('nearbyOffices'), icon: MapPin },
    { to: '/dashboard/emergency', label: t('emergencyServices'), icon: ShieldAlert },
    { to: '/dashboard/profile', label: t('profile'), icon: User },
    { to: '/dashboard/settings', label: t('settings'), icon: Settings },
  ];

  const adminLink = { to: '/dashboard/admin', label: t('adminPanel'), icon: Shield };

  const linkClass = ({ isActive }) => {
    return `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
      isActive 
        ? 'bg-navy-800 dark:bg-saffron-500 text-white shadow-md' 
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-900/50 hover:text-navy-800 dark:hover:text-white'
    }`;
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      {/* Sidebar Drawer Container */}
      <aside className={`fixed top-16 bottom-0 left-0 w-64 z-30 bg-white dark:bg-navy-950 border-r border-slate-200 dark:border-navy-900 flex flex-col justify-between py-6 px-4 transition-all duration-300 md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Navigation Items */}
        <nav className="space-y-1.5 overflow-y-auto max-h-[80vh]">
          {links.map((link) => (
            <NavLink 
              key={link.to} 
              to={link.to} 
              end={link.to === '/dashboard'}
              className={linkClass}
              onClick={onClose}
            >
              <link.icon size={18} />
              <span>{link.label}</span>
            </NavLink>
          ))}

          {/* Conditional Admin Panel */}
          {profile?.role === 'admin' && (
            <NavLink 
              to={adminLink.to} 
              className={linkClass}
              onClick={onClose}
            >
              <adminLink.icon size={18} className="text-saffron-500 dark:text-teal-400" />
              <span className="text-saffron-600 dark:text-teal-400">{adminLink.label}</span>
            </NavLink>
          )}
        </nav>

        {/* Footer Credit */}
        <div className="px-4 text-center">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Smart Bharat v1.0 (PWA)</p>
          <div className="flex justify-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-saffron-500" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="w-1.5 h-1.5 rounded-full bg-tricolor-green" />
          </div>
        </div>

      </aside>
    </>
  );
}
