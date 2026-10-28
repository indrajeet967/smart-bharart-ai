import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLocation as useAppLocation } from '../context/LocationContext';
import { Settings as SettingsIcon, Check, Save, MapPin } from 'lucide-react';

export default function Settings() {
  const { profile, updateProfilePreferences } = useAuth();
  const { t } = useLanguage();
  const { INDIAN_STATES } = useAppLocation();

  const [stateName, setStateName] = useState(profile?.state || '');
  const [selectedInterests, setSelectedInterests] = useState(profile?.interests || []);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const interestOptions = [
    'Agriculture', 'Healthcare', 'Education',
    'Services', 'Housing', 'Welfare', 'Employment', 'Farmer Services'
  ];

  const handleInterestToggle = (interest) => {
    setSelectedInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await updateProfilePreferences(stateName, selectedInterests);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      alert('Failed to update preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12 max-w-2xl mx-auto">
      
      <div>
        <h1 className="text-3xl font-extrabold font-outfit text-navy-800 dark:text-white flex items-center gap-2">
          <SettingsIcon className="text-saffron-500" /> {t('settings')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          Configure your residential state and fields of interest to personalise scheme recommendations, complaint routing, and service discovery.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl shadow-sm p-8 space-y-6">

        {/* State Preference — proper select dropdown */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin size={13} className="text-saffron-500" /> Residential State / UT
          </label>
          <select
            required
            value={stateName}
            onChange={(e) => setStateName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 focus:border-saffron-500 focus:outline-none text-sm transition-colors font-semibold"
          >
            <option value="">Select your state / UT...</option>
            {INDIAN_STATES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400 leading-normal">
            Used as your registered residential state for state-specific services. Your current search location is managed separately in the location selector.
          </p>
        </div>

        {/* Interests Grid */}
        <div className="space-y-3 border-t border-slate-100 dark:border-navy-850 pt-5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Government Feed Interests</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                      : 'bg-slate-50 dark:bg-navy-950 border-slate-200 dark:border-navy-855 text-slate-600 hover:bg-slate-100 dark:hover:bg-navy-850'
                  }`}
                >
                  <span>{option}</span>
                  {active && <Check size={13} className="shrink-0" />}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-400 leading-normal">
            Filters AI responses and notification feed with relevant updates for selected categories.
          </p>
        </div>

        {success && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold text-center">
            🎉 Preferences updated for your registered residence: {stateName}.
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 bg-navy-800 dark:bg-saffron-500 hover:bg-navy-900 dark:hover:bg-saffron-600 text-white font-extrabold rounded-lg shadow text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          {saving
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <><Save size={16} /> Save Preference Settings</>
          }
        </button>
      </form>
    </div>
  );
}
