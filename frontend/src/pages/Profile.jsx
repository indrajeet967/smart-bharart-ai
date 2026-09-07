import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  User, Award, ShieldCheck, ClipboardList, Lock, Sparkles, Star, 
  CheckCircle2, Trophy, Flame, ChevronRight, Activity 
} from 'lucide-react';
import axios from 'axios';
import Card, { CardHeader, CardTitle, CardBody } from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import StatusBadge from '../components/ui/StatusBadge';
import Alert from '../components/ui/Alert';

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

  const rewardPoints = profile?.rewardPoints || 0;
  const currentLevel = Math.floor(rewardPoints / 100) + 1;
  const nextLevelPoints = currentLevel * 100;
  const levelProgress = Math.min(100, Math.round(((rewardPoints % 100) / 100) * 100));

  const allBadges = [
    { title: 'Civic Starter', minPoints: 10, desc: 'Welcome bonus for joining Smart Bharat AI' },
    { title: 'Active Reporter', minPoints: 100, desc: 'Logged valid civic complaints to help the city' },
    { title: 'Civic Guardian', minPoints: 300, desc: 'Helped resolve municipal hazards in your ward' },
    { title: 'Community Legend', minPoints: 600, desc: 'Top tier citizen contributor in regional scoreboards' }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Page Header */}
      <PageHeader
        title="Citizen Profile & Civic Rewards"
        description="Review your registered demographic settings, inspect earned badge milestones, and view activity history."
        icon={User}
        badge={profile?.role === 'admin' ? 'Administrator' : `Level ${currentLevel} Citizen`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Card & Level Progress (1 Column) */}
        <div className="lg:col-span-1 space-y-6">
          
          <Card className="text-center space-y-4">
            {profile?.photoURL ? (
              <img 
                src={profile.photoURL} 
                alt="Profile" 
                className="w-24 h-24 rounded-full object-cover border-4 border-saffron-500/20 mx-auto"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-navy-950 flex items-center justify-center text-slate-400 border-4 border-slate-200/50 mx-auto">
                <User size={44} />
              </div>
            )}

            <div>
              <h2 className="text-xl font-extrabold font-outfit text-navy-800 dark:text-white">{profile?.displayName || 'Citizen of India'}</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{profile?.email}</p>
            </div>

            <div className="flex justify-center gap-2">
              <Badge variant="saffron" size="md">State: {profile?.state || 'Delhi'}</Badge>
              <Badge variant={profile?.role === 'admin' ? 'danger' : 'info'} size="md">
                {profile?.role === 'admin' ? 'Admin' : 'Citizen'}
              </Badge>
            </div>

            {/* Level & Points Progress Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-3">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-saffron-600 dark:text-saffron-400 flex items-center gap-1">
                  <Trophy size={16} /> Level {currentLevel}
                </span>
                <span className="text-navy-800 dark:text-white">{rewardPoints} / {nextLevelPoints} pts</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-slate-200 dark:bg-navy-850 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-saffron-500 rounded-full transition-all duration-500" 
                  style={{ width: `${levelProgress}%` }}
                />
              </div>

              <p className="text-[10px] text-slate-400 font-medium">
                Earn {nextLevelPoints - rewardPoints} more points by logging issues or completing document verifications to reach Level {currentLevel + 1}!
              </p>
            </div>
          </Card>

          {/* Interests Tags */}
          <Card className="space-y-3">
            <CardHeader>
              <CardTitle icon={Sparkles}>Personalized Interests</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="flex flex-wrap gap-2">
                {profile?.interests?.length > 0 ? (
                  profile.interests.map((interest, idx) => (
                    <Badge key={idx} variant="neutral" size="md">{interest}</Badge>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">No interests configured. Set them in Settings.</span>
                )}
              </div>
            </CardBody>
          </Card>

        </div>

        {/* Badges Cabinet & Activity History (Right 2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Badges Cabinet */}
          <Card className="space-y-4">
            <CardHeader>
              <CardTitle icon={Award}>Civic Badges & Milestones</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {allBadges.map((badge) => {
                  const unlocked = rewardPoints >= badge.minPoints || (profile?.badges || []).includes(badge.title);
                  return (
                    <div
                      key={badge.title}
                      className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                        unlocked
                          ? 'bg-saffron-500/10 dark:bg-saffron-500/15 border-saffron-500/30'
                          : 'bg-slate-50/50 dark:bg-navy-950/20 border-slate-200 dark:border-navy-800 opacity-60'
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl text-white shrink-0 ${unlocked ? 'bg-saffron-500' : 'bg-slate-300 dark:bg-navy-800'}`}>
                        <Trophy size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-navy-800 dark:text-white">{badge.title}</h4>
                          {unlocked && <CheckCircle2 size={14} className="text-saffron-500" />}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{badge.desc}</p>
                        <span className="text-[10px] font-bold text-slate-400 mt-1 block">Requires {badge.minPoints} pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* Activity Logs */}
          <Card className="space-y-4">
            <CardHeader>
              <CardTitle icon={Activity}>My Platform Activity</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-center">
                  <span className="text-2xl font-extrabold font-outfit text-navy-800 dark:text-white">{complaints.length}</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mt-1">Complaints Reported</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-center">
                  <span className="text-2xl font-extrabold font-outfit text-navy-800 dark:text-white">{documents.length}</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mt-1">Locker Documents</span>
                </div>
              </div>
            </CardBody>
          </Card>

        </div>

      </div>

    </div>
  );
}
