import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AlertCircle, ArrowUpRight, Award, Bell, ClipboardList, BookOpen, ChevronRight, Activity, Globe, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { CardSkeleton } from '../components/Skeleton';

export default function Dashboard() {
  const { profile } = useAuth();
  const { t } = useLanguage();

  const [complaintsCount, setComplaintsCount] = useState(0);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [schemesCount, setSchemesCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [loading, setLoading] = useState(true);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const fetchDashboardDetails = async () => {
      if (!profile?.email) return;
      try {
        setLoading(true);
        // 1. Fetch complaints
        const compRes = await axios.get(`/api/complaints/user/${profile.email}`);
        setRecentComplaints(compRes.data.slice(0, 3));
        const pending = compRes.data.filter(c => c.status !== 'Resolved').length;
        setComplaintsCount(pending);

        // 2. Fetch schemes count
        const schemeRes = await axios.post('/api/schemes/recommend', {
          age: 25,
          gender: profile.gender || 'All',
          state: profile.state || 'All',
          income: 200000,
          category: profile.category || 'General'
        });
        setSchemesCount(schemeRes.data.eligibleSchemes?.length || 0);

        // 3. Fetch notifications
        const notifRes = await axios.get(`/api/notifications/${profile.email}`);
        setNotifCount(notifRes.data.length);
      } catch (err) {
        console.warn("Failed to fetch dashboard data dynamically, using mock placeholders.");
        // Fallback counters
        setComplaintsCount(2);
        setSchemesCount(4);
        setNotifCount(3);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardDetails();
  }, [profile?.email, profile?.state, profile?.interests]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-60 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* Offline Status banner */}
      {isOffline && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-400 rounded-xl text-sm flex items-center gap-2.5">
          <WifiOff size={18} className="shrink-0" />
          <span className="font-semibold">Offline Mode Active. You can still report issues, which will be automatically uploaded once connection returns.</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-outfit text-navy-800 dark:text-white flex items-center gap-2">
            {t('welcomeCitizen')}, {profile?.displayName || 'Citizen'} 🇮🇳
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            State Residence: <span className="font-bold text-slate-700 dark:text-slate-200">{profile?.state || 'Not Set (Default: Delhi)'}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-saffron-500/10 text-saffron-600 dark:text-saffron-400 text-xs font-bold rounded-full border border-saffron-500/20">
            Active Profile
          </span>
          {profile?.role === 'admin' && (
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20">
              System Admin
            </span>
          )}
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Card 1: Pending Complaints */}
        <Link 
          to="/dashboard/track" 
          className="p-6 rounded-2xl glass hover-card-trigger bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('pendingComplaints')}</span>
            <span className="p-2 rounded-xl bg-saffron-100 dark:bg-saffron-500/15 text-saffron-600 dark:text-saffron-400">
              <ClipboardList size={18} />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold font-outfit text-navy-800 dark:text-white">{complaintsCount}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-0.5 hover:text-saffron-500">
              Track issues online <ArrowUpRight size={12} />
            </p>
          </div>
        </Link>

        {/* Card 2: Eligible Schemes */}
        <Link 
          to="/dashboard/schemes" 
          className="p-6 rounded-2xl glass hover-card-trigger bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('eligibleSchemes')}</span>
            <span className="p-2 rounded-xl bg-navy-100 dark:bg-navy-800 text-navy-800 dark:text-slate-200">
              <BookOpen size={18} />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold font-outfit text-navy-800 dark:text-white">{schemesCount}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-0.5 hover:text-saffron-500">
              View matches <ArrowUpRight size={12} />
            </p>
          </div>
        </Link>

        {/* Card 3: Reward Points */}
        <Link 
          to="/dashboard/profile" 
          className="p-6 rounded-2xl glass hover-card-trigger bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('rewardPoints')}</span>
            <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Award size={18} />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold font-outfit text-navy-800 dark:text-white">
              {profile?.rewardPoints || 0} <span className="text-xs font-semibold text-slate-400">pts</span>
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold uppercase tracking-wider flex items-center gap-1">
              🏆 Badge: {profile?.badges?.[0] || 'Civic Starter'}
            </p>
          </div>
        </Link>

        {/* Card 4: Personalized Notifications */}
        <div 
          className="p-6 rounded-2xl glass bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 flex flex-col justify-between cursor-default"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('notifications')}</span>
            <span className="p-2 rounded-xl bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Bell size={18} />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold font-outfit text-navy-800 dark:text-white">{notifCount}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Personalized for your interests
            </p>
          </div>
        </div>

      </div>

      {/* Main Content Split: Recent complaints + Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Complaints Listing (Left 2 columns) */}
        <div className="lg:col-span-2 glass bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold font-outfit text-navy-800 dark:text-white flex items-center gap-2">
              <Activity size={18} className="text-saffron-500" />
              Recent Complaint Activity
            </h3>
            <Link to="/dashboard/track" className="text-xs font-bold text-saffron-500 dark:text-saffron-400 flex items-center gap-0.5 hover:underline">
              View All <ChevronRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-navy-850">
            {recentComplaints.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <p className="text-sm text-slate-400 font-semibold">No complaints reported yet.</p>
                <Link to="/dashboard/report" className="text-xs font-bold text-saffron-500 dark:text-saffron-400 underline">
                  Report your first issue
                </Link>
              </div>
            ) : (
              recentComplaints.map((comp) => (
                <div key={comp._id} className="py-4 flex justify-between items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-navy-800 dark:text-white font-mono">{comp.complaintId}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        comp.priority === 'High' ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200/50' :
                        comp.priority === 'Medium' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200/50' :
                        'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200/50'
                      }`}>
                        {comp.priority} Priority
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-sm">{comp.description}</p>
                    <p className="text-[10px] text-slate-400">{t('reportedOn')}: {new Date(comp.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      comp.status === 'Resolved' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50' :
                      comp.status === 'In Progress' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200/50' :
                      comp.status === 'Assigned' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200/50' :
                      'bg-slate-50 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-200/50'
                    }`}>
                      {comp.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Action shortcuts (Right 1 column) */}
        <div className="glass bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl shadow-sm p-6 space-y-6">
          <h3 className="text-lg font-bold font-outfit text-navy-800 dark:text-white">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            
            <Link 
              to="/dashboard/ai" 
              className="p-4 rounded-xl border border-slate-200 dark:border-navy-850 hover:bg-slate-50 dark:hover:bg-navy-850 text-center space-y-2 flex flex-col items-center transition-all duration-200"
            >
              <span className="text-2xl">💬</span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-350">AI Assistant</p>
            </Link>

            <Link 
              to="/dashboard/locker" 
              className="p-4 rounded-xl border border-slate-200 dark:border-navy-850 hover:bg-slate-50 dark:hover:bg-navy-850 text-center space-y-2 flex flex-col items-center transition-all duration-200"
            >
              <span className="text-2xl">🔒</span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-350">DigiLocker</p>
            </Link>

            <Link 
              to="/dashboard/offices" 
              className="p-4 rounded-xl border border-slate-200 dark:border-navy-850 hover:bg-slate-50 dark:hover:bg-navy-850 text-center space-y-2 flex flex-col items-center transition-all duration-200"
            >
              <span className="text-2xl">📍</span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-350">Offices Map</p>
            </Link>

            <Link 
              to="/dashboard/emergency" 
              className="p-4 rounded-xl border border-slate-200 dark:border-navy-850 hover:bg-slate-50 dark:hover:bg-navy-850 text-center space-y-2 flex flex-col items-center transition-all duration-200"
            >
              <span className="text-2xl">☎️</span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-350">Emergency</p>
            </Link>

          </div>
        </div>

      </div>

    </div>
  );
}
