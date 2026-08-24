import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MapPin, Compass, Navigation, Phone, Clock, Landmark, AlertCircle } from 'lucide-react';

export default function NearbyOffices() {
  const { profile } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('Hospital');
  const [activeOffice, setActiveOffice] = useState(null);
  const [showDirections, setShowDirections] = useState(false);

  const officesData = {
    Hospital: [
      { name: 'Dr. Ram Manohar Lohia Hospital', distance: '1.2 km', address: 'Baba Kharak Singh Marg, Connaught Place, New Delhi', tel: '+91-11-23365525', hours: '24 Hours Open', lat: 28.6253, lng: 77.2085, directions: ['Head west on Baba Kharak Singh Marg toward Pandit Pant Marg', 'Turn left after 500m at the roundabout', 'RML Hospital main gate will be on your left'] },
      { name: 'Lok Nayak Jai Prakash Hospital', distance: '2.5 km', address: 'Jawaharlal Nehru Marg, Near Delhi Gate, Delhi', tel: '+91-11-23232400', hours: '24 Hours Open', lat: 28.6358, lng: 77.2403, directions: ['Head east toward Jawaharlal Nehru Marg', 'Take second exit at Delhi Gate crossing', 'LNJP hospital entrance is on your right'] }
    ],
    'Police Station': [
      { name: 'Connaught Place Police Station', distance: '0.8 km', address: 'Radial Road 4, Connaught Place, New Delhi', tel: '+91-11-23340050', hours: '24 Hours Open', lat: 28.6304, lng: 77.2177, directions: ['Walk toward Outer Circle, Connaught Place', 'Take Radial Road 4 heading south', 'CP police station is adjacent to the block post'] },
      { name: 'Parliament Street Police Station', distance: '1.4 km', address: 'Parliament Street, New Delhi', tel: '+91-11-23361100', hours: '24 Hours Open', lat: 28.6231, lng: 77.2131, directions: ['Head south on Sansad Marg / Parliament Street', 'Cross Patel Chowk traffic junction', 'Police station is next to the post office building'] }
    ],
    'Passport Office': [
      { name: 'Regional Passport Seva Kendra (PSK)', distance: '3.1 km', address: 'Herald House, Bahadur Shah Zafar Marg, ITO, New Delhi', tel: '1800-258-1800', hours: '9:00 AM - 5:00 PM', lat: 28.6309, lng: 77.2435, directions: ['Take Vikas Marg heading toward ITO crossing', 'Turn left onto Bahadur Shah Zafar Marg', 'PSK is located on the ground floor of Herald House'] }
    ],
    'Municipal Office': [
      { name: 'NDMC Municipal Corporation Headquarters', distance: '1.1 km', address: 'Palika Kendra, Parliament Street, New Delhi', tel: '+91-11-23742781', hours: '9:30 AM - 6:00 PM', lat: 28.6288, lng: 77.2185, directions: ['Walk along Parliament Street toward Regal Building', 'Palika Kendra high rise building will be on your left', 'Enter via Gate 2 for civic enquiries'] }
    ]
  };

  const categories = ['Hospital', 'Police Station', 'Passport Office', 'Municipal Office'];

  const handleOfficeSelect = (office) => {
    setActiveOffice(office);
    setShowDirections(false);
  };

  const list = officesData[selectedCategory] || [];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold font-outfit text-navy-800 dark:text-white flex items-center gap-2">
          <MapPin className="text-saffron-500" />
          Nearby Civic Offices & Navigation
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          Select office types below to find nearby police departments, passport kendras, hospitals, or municipality offices. Includes step-by-step route directions.
        </p>
      </div>

      {/* Categories Toggle buttons */}
      <div className="flex flex-wrap gap-2.5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setSelectedCategory(cat);
              setActiveOffice(null);
              setShowDirections(false);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              selectedCategory === cat
                ? 'bg-navy-800 dark:bg-saffron-500 text-white border-navy-800 dark:border-saffron-500 shadow-md'
                : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-850 text-slate-650 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Office list (1 column) */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-base font-bold font-outfit text-navy-800 dark:text-white border-b border-slate-100 dark:border-navy-850 pb-2">
            Centers Found ({list.length})
          </h3>

          <div className="space-y-4">
            {list.map((office, idx) => (
              <div
                key={idx}
                onClick={() => handleOfficeSelect(office)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  activeOffice?.name === office.name
                    ? 'border-saffron-500 bg-saffron-500/5 shadow-md shadow-saffron-500/5'
                    : 'border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 hover:border-slate-300'
                }`}
              >
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-navy-800 dark:text-white">{office.name}</h4>
                  <p className="text-slate-400 font-semibold flex items-center gap-1"><Compass size={12} /> Distance: {office.distance}</p>
                  <p className="text-slate-500 dark:text-slate-350 leading-relaxed font-semibold">{office.address}</p>
                </div>
                <div className="mt-3 flex justify-between items-center text-[10px] font-bold text-slate-450 uppercase border-t border-slate-100 dark:border-navy-850 pt-2.5">
                  <span className="text-emerald-600 flex items-center gap-0.5"><Clock size={10} /> {office.hours}</span>
                  <span className="text-saffron-500 flex items-center gap-0.5"><Navigation size={10} /> Get Directions</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visual Map Fallback & directions (Right 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {activeOffice ? (
            <div className="space-y-6">
              
              {/* Mock map renderer (interactive visual) */}
              <div className="relative h-80 rounded-2xl border border-slate-200 dark:border-navy-800 overflow-hidden bg-slate-100 dark:bg-navy-950 flex flex-col justify-between p-6">
                
                {/* Simulated Map Grid Background */}
                <div className="absolute inset-0 bg-slate-200 dark:bg-navy-950/40 bg-grid-pattern opacity-40 pointer-events-none" />
                
                {/* Points on map */}
                <div className="absolute top-1/2 left-1/3 flex flex-col items-center">
                  <span className="text-2xl animate-pulse">🔵</span>
                  <span className="bg-navy-800 text-white font-bold text-[9px] px-1.5 py-0.5 rounded shadow mt-1">My Location</span>
                </div>

                <div className="absolute top-1/3 left-2/3 flex flex-col items-center">
                  <span className="text-2xl animate-bounce">📍</span>
                  <span className="bg-saffron-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded shadow mt-1">{activeOffice.name}</span>
                </div>

                {/* Map Directions path overlay */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <path 
                    d="M 280 180 L 320 180 L 320 120 L 520 120 L 520 100" 
                    fill="none" 
                    stroke="#FF9933" 
                    strokeWidth="3.5" 
                    strokeDasharray="6" 
                    className="animate-dash" 
                  />
                </svg>

                <div className="z-10 bg-white/95 dark:bg-navy-900/95 p-4 rounded-xl border border-slate-200 dark:border-navy-800 shadow-lg w-72 text-xs">
                  <h4 className="font-extrabold text-navy-850 dark:text-white leading-snug">{activeOffice.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{activeOffice.address}</p>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-navy-850 flex gap-4 text-slate-500 font-bold">
                    <a href={`tel:${activeOffice.tel}`} className="flex items-center gap-1 hover:text-saffron-500"><Phone size={12} /> Call</a>
                    <button 
                      onClick={() => setShowDirections(!showDirections)}
                      className="flex items-center gap-1 text-saffron-600 hover:underline"
                    >
                      <Navigation size={12} /> Route Directions
                    </button>
                  </div>
                </div>

                <p className="z-10 ml-auto bg-navy-800 text-white font-extrabold px-3 py-1 rounded-full text-[10px] border border-white/10 shadow uppercase tracking-wider">
                  Coordinates: {activeOffice.lat.toFixed(4)}N, {activeOffice.lng.toFixed(4)}E
                </p>
              </div>

              {/* Turn-by-turn Directions path */}
              {showDirections && (
                <div className="p-6 rounded-2xl glass bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4 animate-scale-up">
                  <h4 className="text-sm font-bold font-outfit text-navy-800 dark:text-white flex items-center gap-1.5">
                    🗺️ Turn-by-Turn Navigation Guide
                  </h4>
                  <div className="space-y-3 pl-4 relative border-l border-slate-200 dark:border-navy-850 text-xs font-semibold text-slate-600 dark:text-slate-350">
                    {activeOffice.directions.map((step, sidx) => (
                      <div key={sidx} className="relative py-0.5">
                        <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-saffron-500" />
                        <p>{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="h-80 rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 flex flex-col items-center justify-center text-center p-8 space-y-3">
              <span className="text-4xl animate-bounce">🗺️</span>
              <h3 className="text-base font-bold text-navy-800 dark:text-white">Locator Map Uninitialized</h3>
              <p className="text-xs text-slate-400 max-w-sm">Select one of the government departments or healthcare centers on the left to verify coordinates and compute route steps.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
