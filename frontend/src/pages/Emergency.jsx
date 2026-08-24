import React from 'react';
import { ShieldAlert, PhoneCall, AlertCircle, HeartPulse, Flame, Siren, HelpingHand } from 'lucide-react';

export default function Emergency() {
  const contacts = [
    {
      title: 'National Emergency Response (All-in-One)',
      number: '112',
      desc: 'Immediate dispatch for police, medical assistance, or fire alerts across India.',
      icon: Siren,
      color: 'bg-red-500',
    },
    {
      title: 'Police Support',
      number: '100',
      desc: 'Direct line to municipal/city police control rooms for security incidents.',
      icon: ShieldAlert,
      color: 'bg-blue-600',
    },
    {
      title: 'Ambulance & Medical Services',
      number: '108',
      desc: 'Dispatches emergency paramedics and municipal trauma vehicles.',
      icon: HeartPulse,
      color: 'bg-emerald-600',
    },
    {
      title: 'Fire Control Department',
      number: '101',
      desc: 'Direct alert to local town/district fire houses for active fire incidents.',
      icon: Flame,
      color: 'bg-amber-600',
    },
    {
      title: 'Women Helpline',
      number: '1091',
      desc: '24/7 dedicated support desk for women safety, counsel, and protection services.',
      icon: HelpingHand,
      color: 'bg-purple-600',
    },
    {
      title: 'National Disaster Helpline (NDMA)',
      number: '1078',
      desc: 'Contact for flood, earthquake, cyclone response, or disaster relief coordinates.',
      icon: AlertCircle,
      color: 'bg-slate-700',
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold font-outfit text-navy-800 dark:text-white flex items-center gap-2">
          <Siren className="text-red-500 animate-pulse" />
          Emergency Direct Helpline
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          Access immediate click-to-call links for key government helplines. These services are available offline and require no active internet connection.
        </p>
      </div>

      {/* Grid of contact cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contacts.map((contact) => (
          <div 
            key={contact.number} 
            className="p-6 rounded-2xl glass bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 hover-card-trigger flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className={`w-10 h-10 rounded-xl ${contact.color} text-white flex items-center justify-center shadow-md`}>
                  <contact.icon size={20} />
                </div>
                <span className="text-2xl font-extrabold font-outfit text-slate-700 dark:text-slate-300 font-mono">
                  {contact.number}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-navy-800 dark:text-white font-outfit">{contact.title}</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{contact.desc}</p>
              </div>
            </div>

            <a 
              href={`tel:${contact.number}`}
              className="mt-6 w-full py-2.5 bg-red-500 hover:bg-red-600 text-white font-extrabold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-red-500/10"
            >
              <PhoneCall size={14} /> Call Helpline Now ({contact.number})
            </a>
          </div>
        ))}
      </div>

      {/* Basic Incident Instructions (Offline-friendly) */}
      <div className="glass bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 shadow-sm space-y-4 max-w-4xl">
        <h3 className="text-base font-bold font-outfit text-navy-800 dark:text-white flex items-center gap-1.5">
          🚨 First Aid & Safety Quick Guidelines
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">
          <div className="space-y-2">
            <p className="text-navy-800 dark:text-saffron-400 font-bold uppercase tracking-wider">Fire Incident Steps</p>
            <ul className="list-decimal list-inside pl-2 space-y-1">
              <li>Crawl low under smoke to stay below toxic fumes.</li>
              <li>Feel doors with the back of your hand before opening.</li>
              <li>In case of clothes catching fire: Stop, Drop, and Roll.</li>
              <li>Evacuate immediately without gathering items.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-navy-800 dark:text-saffron-400 font-bold uppercase tracking-wider">Medical Trauma Steps</p>
            <ul className="list-decimal list-inside pl-2 space-y-1">
              <li>Verify breathing and pulse before attempting movement.</li>
              <li>Apply direct pressure to open wounds with clean cloth.</li>
              <li>Keep injured citizens warm and calm until paramedics arrive.</li>
              <li>Do not supply water to unconscious individuals.</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}
