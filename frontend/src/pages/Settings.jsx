import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Settings as SettingsIcon, Check, Save } from 'lucide-react';

export default function Settings() {
  const { profile, updateProfilePreferences, syncProfile } = useAuth();
  const { t } = useLanguage();

  const [stateName, setStateName] = useState(profile?.state || 'Delhi');
  const [selectedInterests, setSelectedInterests] = useState(profile?.interests || []);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const interestOptions = [
    'Agriculture',
    'Healthcare',
    'Education',
    'Services',
    'Housing',
    'Welfare'
  ];

  const handleInterestToggle = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(prev => prev.filter(i => i !== interest));
    } else {
      setSelectedInterests(prev => [...prev, interest]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      await updateProfilePreferences(stateName, selectedInterests);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert("Failed to update preferences.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12 max-w-2xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold font-outfit text-navy-800 dark:text-white flex items-center gap-2">
          <SettingsIcon className="text-saffron-500" />
          {t('settings')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          Configure your regional jurisdiction state and fields of interest to filter personalized scheme recommendations and notification feeds.
        </p>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="glass bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl shadow-sm p-8 space-y-6">
        
        {/* State Preference */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Demographic State Residence</label>
          <input
            type="text"
            required
            value={stateName}
            onChange={(e) => setStateName(e.target.value)}
            placeholder="E.g., Maharashtra, Delhi, Madhya Pradesh"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-250 dark:border-navy-805 bg-slate-50 dark:bg-navy-950 focus:border-saffron-500 focus:outline-none text-sm transition-colors font-semibold"
          />
          <p className="text-[10px] text-slate-400 leading-normal">
            Used to load specific state schemes (e.g. Ladli Behna Scheme in Madhya Pradesh).
          </p>
        </div>

        {/* Interests Grid */}
        <div className="space-y-2 border-t border-slate-100 dark:border-navy-850 pt-4">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Government Feed Interests</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {interestOptions.map((option) => {
              const active = selectedInterests.includes(option);
              return (
                <button
                  type="button"
                  key={option}
                  onClick={() => handleInterestToggle(option)}
                  className={`p-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-between ${
                    active
                      ? 'bg-navy-800 dark:bg-saffron-500/10 border-navy-800 dark:border-saffron-500/30 text-white dark:text-saffron-400'
                      : 'bg-slate-50 dark:bg-navy-950 border-slate-200 dark:border-navy-855 text-slate-650 hover:bg-slate-100'
                  }`}
                >
                  <span>{option}</span>
                  {active && <Check size={14} className="shrink-0" />}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-400 leading-normal">
            Filters your notifications feed with agricultural updates, health camp reminders, or scholarship announcements.
          </p>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold text-center">
            🎉 Preferences updated and dynamic feeds re-aligned successfully!
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 bg-navy-800 dark:bg-saffron-500 hover:bg-navy-900 dark:hover:bg-saffron-600 text-white font-extrabold rounded-lg shadow text-xs flex items-center justify-center gap-1.5"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Save size={16} /> Save Preference Settings
            </>
          )}
        </button>

      </form>

    </div>
  );
}
