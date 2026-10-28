import React, { useState } from 'react';
import {
  ShieldAlert, PhoneCall, AlertCircle, HeartPulse, Flame, Siren,
  HelpingHand, Car, UserCheck, Wheat, Baby, ExternalLink, Info,
  CheckCircle2, Shield
} from 'lucide-react';
import { EMERGENCY_CONTACTS } from '../data/governmentKnowledge';

// Icon map from string name to component
const ICON_MAP = {
  Siren, ShieldAlert, HeartPulse, Flame, HelpingHand, AlertCircle,
  Car, UserCheck, Wheat, Baby, Shield,
};

const ICON_COLORS = {
  'bg-red-600': 'bg-red-600',
  'bg-blue-700': 'bg-blue-700',
  'bg-emerald-600': 'bg-emerald-600',
  'bg-orange-600': 'bg-orange-600',
  'bg-pink-600': 'bg-pink-600',
  'bg-yellow-600': 'bg-yellow-600',
  'bg-slate-700': 'bg-slate-700',
  'bg-yellow-700': 'bg-yellow-700',
  'bg-purple-700': 'bg-purple-700',
  'bg-green-700': 'bg-green-700',
};

export default function Emergency() {
  const [activeTab, setActiveTab] = useState('emergency'); // 'emergency' | 'nonemergency'

  const emergencyContacts = EMERGENCY_CONTACTS.filter(c => !c.isNonEmergency);
  const nonEmergencyContacts = EMERGENCY_CONTACTS.filter(c => c.isNonEmergency);

  return (
    <div className="space-y-8 animate-fade-in pb-12">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold font-outfit text-navy-800 dark:text-white flex items-center gap-2">
          <Siren className="text-red-500 animate-pulse" />
          Emergency Helplines
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-2xl">
          Call 112 for police, fire or medical emergencies. Other service-specific numbers are omitted until their current official coverage can be verified.
        </p>
      </div>

      {/* Critical Banner */}
      <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border-2 border-red-200 dark:border-red-500/30 flex items-start gap-3">
        <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shrink-0">
          <Siren size={20} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-extrabold text-red-800 dark:text-red-300">
            National Emergency: <span className="text-2xl font-mono">112</span>
          </p>
          <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
            India's national emergency response number. Availability and response may vary by location.
          </p>
          <a
            href="tel:112"
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-lg text-xs transition-colors"
          >
            <PhoneCall size={14} /> Call 112 Now
          </a>
        </div>
      </div>

      {/* Tab Switch */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('emergency')}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all border ${
            activeTab === 'emergency'
              ? 'bg-red-600 text-white border-red-600 shadow-md'
              : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
          }`}
        >
          🚨 Emergency Helplines
        </button>
        {nonEmergencyContacts.length > 0 && (
          <button
            onClick={() => setActiveTab('nonemergency')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeTab === 'nonemergency'
                ? 'bg-navy-800 text-white border-navy-800 shadow-md'
                : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            📞 Government Helplines
          </button>
        )}
      </div>

      {/* Contact Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(activeTab === 'emergency' ? emergencyContacts : nonEmergencyContacts).map((contact) => {
          const IconComp = ICON_MAP[contact.icon] || ShieldAlert;
          const colorClass = contact.color || 'bg-slate-700';

          return (
            <div
              key={contact.id}
              className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 hover:shadow-lg transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className={`w-10 h-10 rounded-xl ${colorClass} text-white flex items-center justify-center shadow-md`}>
                    <IconComp size={20} />
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold font-outfit text-slate-700 dark:text-slate-200 font-mono tracking-tight">
                      {contact.number}
                    </span>
                    {contact.verified && (
                      <div className="flex items-center gap-1 justify-end mt-0.5">
                        <CheckCircle2 size={11} className="text-emerald-500" />
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Verified</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-navy-800 dark:text-white font-outfit">{contact.title}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {contact.description}
                  </p>
                  {contact.note && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1.5 flex items-start gap-1 font-medium">
                      <Info size={10} className="shrink-0 mt-0.5" /> {contact.note}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                  <Shield size={10} />
                  <span>{contact.coverage}</span>
                  {contact.source && <span>• {contact.source}</span>}
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <a
                  href={`tel:${contact.number}`}
                  className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white font-extrabold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <PhoneCall size={13} /> Call {contact.number}
                </a>

                {contact.website && (
                  <a
                    href={contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 border border-slate-200 dark:border-navy-800 text-slate-600 dark:text-slate-300 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-navy-800"
                  >
                    <ExternalLink size={12} /> Official Website
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Source note */}
      <div className="flex items-start gap-2 p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
        <Info size={15} className="text-slate-400 shrink-0 mt-0.5" />
        <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          <strong>Emergency note:</strong> 112 is India's national emergency response number. Local availability may vary. Service-specific helpline numbers are not shown because their current coverage could not be independently verified.
        </div>
      </div>

      {/* First Aid Quick Reference */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 space-y-5">
        <h3 className="text-base font-bold font-outfit text-navy-800 dark:text-white flex items-center gap-1.5">
          🚑 Quick First-Response Guidelines
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="space-y-2">
            <p className="text-navy-800 dark:text-saffron-400 font-bold uppercase tracking-wider text-[10px]">🔥 Fire Emergency</p>
            <ol className="list-decimal list-inside pl-1 space-y-1">
              <li>Call 112 for emergency assistance.</li>
              <li>Evacuate — do NOT use elevators.</li>
              <li>Crawl low under smoke.</li>
              <li>Feel doors before opening (back of hand).</li>
              <li>If clothes catch fire: Stop, Drop, Roll.</li>
            </ol>
          </div>

          <div className="space-y-2">
            <p className="text-navy-800 dark:text-saffron-400 font-bold uppercase tracking-wider text-[10px]">🏥 Medical Emergency</p>
            <ol className="list-decimal list-inside pl-1 space-y-1">
              <li>Call 112 for emergency assistance.</li>
              <li>Check breathing and pulse.</li>
              <li>Apply firm pressure to bleeding wounds.</li>
              <li>Keep patient warm and calm.</li>
              <li>Do NOT move spinal injury patients.</li>
            </ol>
          </div>

          <div className="space-y-2">
            <p className="text-navy-800 dark:text-saffron-400 font-bold uppercase tracking-wider text-[10px]">🌊 Natural Disaster</p>
            <ol className="list-decimal list-inside pl-1 space-y-1">
              <li>For immediate danger, call 112. Otherwise follow local administration alerts.</li>
              <li>Move to higher ground (floods).</li>
              <li>Drop, Cover, Hold (earthquake).</li>
              <li>Follow local administration alerts.</li>
              <li>Avoid downed power lines.</li>
            </ol>
          </div>
        </div>
      </div>

    </div>
  );
}
