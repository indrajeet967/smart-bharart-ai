import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { User, Award, ShieldCheck, ClipboardList, Lock, Sparkles, Star } from 'lucide-react';
import axios from 'axios';

export default function Profile() {
  const { profile } = useAuth();
  const { t } = useLanguage();

  const [complaints, setComplaints] = useState([]);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!profile?.email) return;
      try {
        const compRes = await axios.get(`/api/complaints/user/${profile.email}`);
        setComplaints(compRes.data);

        const docRes = await axios.get(`/api/documents/user/${profile.email}`);
        setDocuments(docRes.data);
      } catch (e) {
        console.warn("Could not retrieve user profile records.");
      }
    };
    fetchUserData();
  }, [profile?.email]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold font-outfit text-navy-800 dark:text-white flex items-center gap-2">
          <User className="text-saffron-500" />
          Citizen Profile & Cabinet
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          View your registered demographic profile, review badge milestones, inspect files cabinet, and track reward allocations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Card & Rewards progress (1 column) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Main User Meta info */}
          <div className="glass bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl shadow-sm p-6 text-center space-y-4">
            {profile?.photoURL ? (
              <img 
                src={profile.photoURL} 
                alt="Profile" 
                className="w-24 h-24 rounded-full object-cover border-4 border-saffron-500/20 mx-auto"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-navy-950 flex items-center justify-center text-slate-400 border-4 border-slate-200/50 mx-auto">
                <User size={48} />
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold font-outfit text-navy-800 dark:text-white">{profile?.displayName || 'Citizen of India'}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{profile?.email}</p>
            </div>
            
            <div className="pt-2 border-t border-slate-100 dark:border-navy-850 text-left space-y-2 text-[10px] font-bold text-slate-450 uppercase">
              <p>State: <span className="text-slate-700 dark:text-slate-200">{profile?.state || 'Delhi'}</span></p>
              <div className="flex flex-wrap gap-1 mt-1 items-center">
                <span>Interests: </span>
                {profile?.interests && profile.interests.length > 0 ? (
                  profile.interests.map(i => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-navy-950 text-navy-800 dark:text-slate-350 text-[9px] border border-slate-200/50">
                      {i}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400">None selected</span>
                )}
              </div>
            </div>
          </div>

          {/* Gamified Rewards points & badges */}
          <div className="glass bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl shadow-sm p-6 space-y-4">
            <h4 className="text-sm font-bold font-outfit text-navy-800 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-navy-850 pb-2">
              <Award className="text-saffron-500" /> Reward Progress
            </h4>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-500">CURRENT CIVIC POINTS</span>
                <span className="text-saffron-500 font-extrabold">{profile?.rewardPoints || 0} Points</span>
              </div>
              
              {/* Progress bar to next badge */}
              <div className="h-2 bg-slate-150 dark:bg-navy-950 rounded overflow-hidden">
                <div 
                  className="h-full bg-saffron-500 transition-all duration-300"
                  style={{ width: `${Math.min(((profile?.rewardPoints || 0) / 300) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[9px] font-semibold text-slate-450 uppercase">
                <span>0 pts</span>
                <span>Next Badge: 300 pts</span>
              </div>
            </div>

            {/* Cabinet Badges Showcase */}
            <div className="border-t border-slate-100 dark:border-navy-850 pt-4 space-y-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Unlocked Badges Cabinet</p>
              
              <div className="flex flex-wrap gap-2.5">
                {profile?.badges && profile.badges.length > 0 ? (
                  profile.badges.map((badge, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 font-bold text-[10px] shadow-sm animate-scale-up"
                    >
                      <Star size={12} className="fill-amber-500 text-amber-500" />
                      <span>{badge}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-navy-850 text-slate-400 font-bold text-[10px]">
                    <span>Civic Starter (Default)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Complaints and locker overview list (Right 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Complaints Cabinet */}
          <div className="glass bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold font-outfit text-navy-800 dark:text-white flex items-center gap-2">
              <ClipboardList className="text-saffron-500" />
              Locker Civic Complaints Registry ({complaints.length})
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-navy-850">
              {complaints.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No reported issues found</p>
              ) : (
                complaints.map((comp) => (
                  <div key={comp._id} className="py-3 flex justify-between items-center gap-4 text-xs">
                    <div>
                      <p className="font-bold text-navy-800 dark:text-saffron-400 font-mono">{comp.complaintId}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{comp.description}</p>
                    </div>
                    <div>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold ${
                        comp.status === 'Resolved' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50' :
                        comp.status === 'In Progress' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200/50' :
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

          {/* Identity docs Cabinet */}
          <div className="glass bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold font-outfit text-navy-800 dark:text-white flex items-center gap-2">
              <Lock className="text-saffron-500" />
              Locker Identity Credentials ({documents.length})
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-navy-850">
              {documents.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No uploaded identity credentials found</p>
              ) : (
                documents.map((doc) => (
                  <div key={doc._id} className="py-3 flex justify-between items-center gap-4 text-xs font-semibold">
                    <div>
                      <p className="text-slate-800 dark:text-white font-bold">{doc.docType}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {doc.details?.docNumber}</p>
                    </div>
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 text-[10px]">
                        {doc.verificationStatus}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
