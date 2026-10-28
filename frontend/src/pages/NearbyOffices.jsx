import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  MapPin, Compass, Navigation, Phone, Clock, Landmark, AlertCircle, 
  Building2, Shield, Flame, Mail, GraduationCap, Building, PhoneOff 
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardBody } from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';

export default function NearbyOffices() {
  const { profile } = useAuth();
  const toast = useToast();

  const [selectedCategory, setSelectedCategory] = useState('Hospitals');
  const [activeOffice, setActiveOffice] = useState(null);
  const [showDirections, setShowDirections] = useState(false);
  const [userCoords, setUserCoords] = useState({ lat: 28.6139, lng: 77.2090 });
  const [locating, setLocating] = useState(false);

  const officesData = {
    Hospitals: [
      { name: 'Dr. Ram Manohar Lohia Hospital', distance: '1.2 km', address: 'Baba Kharak Singh Marg, Connaught Place, New Delhi', tel: '+911123365525', hours: '24 Hours Open', status: 'Open', lat: 28.6253, lng: 77.2085, directions: ['Head west on Baba Kharak Singh Marg toward Pandit Pant Marg', 'Turn left after 500m at the roundabout', 'RML Hospital main gate will be on your left'] },
      { name: 'Lok Nayak Jai Prakash Hospital', distance: '2.5 km', address: 'Jawaharlal Nehru Marg, Near Delhi Gate, Delhi', tel: '+911123232400', hours: '24 Hours Open', status: 'Open', lat: 28.6358, lng: 77.2403, directions: ['Head east toward Jawaharlal Nehru Marg', 'Take second exit at Delhi Gate crossing', 'LNJP hospital entrance is on your right'] }
    ],
    'Police Stations': [
      { name: 'Connaught Place Police Station', distance: '0.8 km', address: 'Radial Road 4, Connaught Place, New Delhi', tel: '+911123340050', hours: '24 Hours Open', status: 'Open', lat: 28.6304, lng: 77.2177, directions: ['Walk toward Outer Circle, Connaught Place', 'Take Radial Road 4 heading south', 'CP police station is adjacent to the block post'] },
      { name: 'Parliament Street Police Station', distance: '1.4 km', address: 'Parliament Street, New Delhi', tel: '+911123361100', hours: '24 Hours Open', status: 'Open', lat: 28.6231, lng: 77.2131, directions: ['Head south on Sansad Marg / Parliament Street', 'Cross Patel Chowk traffic junction', 'Police station is next to the post office building'] }
    ],
    'Fire Stations': [
      { name: 'Connaught Place Fire Station', distance: '1.0 km', address: 'Connaught Circus, Block M, CP, New Delhi', tel: '101', hours: '24 Hours Open', status: 'Open', lat: 28.6321, lng: 77.2195, directions: ['Head toward Outer Circle Connaught Place Block M', 'Fire station facility is situated next to the metro station exit'] }
    ],
    'Post Offices': [
      { name: 'Eastern Court Head Post Office', distance: '1.5 km', address: 'Janpath, Connaught Place, New Delhi', tel: '+911123321482', hours: '9:00 AM - 6:00 PM', status: 'Open', lat: 28.6245, lng: 77.2188, directions: ['Head south on Janpath Road', 'Cross BSNL Building', 'Eastern Court GPO entrance will be on your left'] }
    ],
    'Government Offices': [
      { name: 'NDMC Municipal Corporation Headquarters', distance: '1.1 km', address: 'Palika Kendra, Parliament Street, New Delhi', tel: '+911123742781', hours: '9:30 AM - 6:00 PM', status: 'Open', lat: 28.6288, lng: 77.2185, directions: ['Walk along Parliament Street toward Regal Building', 'Palika Kendra high rise building will be on your left', 'Enter via Gate 2 for civic enquiries'] },
      { name: 'Regional Passport Seva Kendra (PSK)', distance: '3.1 km', address: 'Herald House, Bahadur Shah Zafar Marg, ITO, New Delhi', tel: '18002581800', hours: '9:00 AM - 5:00 PM', status: 'Open', lat: 28.6309, lng: 77.2435, directions: ['Take Vikas Marg heading toward ITO crossing', 'Turn left onto Bahadur Shah Zafar Marg', 'PSK is located on the ground floor of Herald House'] }
    ],
    'Government Schools': [
      { name: 'Sarvodaya Kanya Vidyalaya', distance: '1.8 km', address: 'Gole Market, New Delhi', tel: '', hours: '7:30 AM - 1:30 PM', status: 'Closed Now', lat: 28.6291, lng: 77.2045, directions: ['Head west toward Gole Market circle', 'School campus entrance is adjacent to St. Columba\'s'] }
    ],
    Banks: [
      { name: 'State Bank of India (Main Branch)', distance: '0.6 km', address: '11 Sansad Marg, New Delhi', tel: '+911123374211', hours: '10:00 AM - 4:00 PM', status: 'Open', lat: 28.6275, lng: 77.2150, directions: ['Walk along Parliament Street', 'SBI main heritage building will be on the right'] }
    ]
  };

  const categories = [
    { name: 'Hospitals', icon: Building2 },
    { name: 'Police Stations', icon: Shield },
    { name: 'Fire Stations', icon: Flame },
    { name: 'Post Offices', icon: Mail },
    { name: 'Government Offices', icon: Landmark },
    { name: 'Government Schools', icon: GraduationCap },
    { name: 'Banks', icon: Building }
  ];

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success("Location updated successfully!");
      },
      (err) => {
        setLocating(false);
        toast.info("Using default Delhi sector location.");
      }
    );
  };

  const list = officesData[selectedCategory] || [];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Page Header */}
      <PageHeader
        title="Nearby Government Offices & Maps"
        description="Find verified emergency services, police stations, municipality offices, and passport kendras near your current location."
        icon={MapPin}
        actions={
          <Button variant="outline" size="sm" onClick={detectLocation} isLoading={locating} icon={Compass}>
            Update My Location
          </Button>
        }
      />

      {/* Category Pills Bar */}
      <div className="flex flex-wrap gap-2.5">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => {
                setSelectedCategory(cat.name);
                setActiveOffice(null);
                setShowDirections(false);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 border ${
                isSelected
                  ? 'bg-saffron-500 text-white border-saffron-500 shadow-md'
                  : 'bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-navy-800 hover:bg-slate-50 dark:hover:bg-navy-850'
              }`}
            >
              <Icon size={16} />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Map & Office Listing Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Office List Cards (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          {list.length === 0 ? (
            <EmptyState
              icon={Building}
              title="No Facilities Found"
              description={`There are no registered ${selectedCategory} in this immediate range.`}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {list.map((office, idx) => (
                <Card
                  key={idx}
                  hoverable
                  onClick={() => {
                    setActiveOffice(office);
                    setShowDirections(false);
                  }}
                  className={`p-5 space-y-3 flex flex-col justify-between ${
                    activeOffice?.name === office.name ? 'border-2 border-saffron-500 bg-saffron-500/5' : ''
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-bold text-navy-800 dark:text-white leading-snug">{office.name}</h4>
                      <Badge variant={office.status === 'Open' ? 'success' : 'neutral'} size="sm">
                        {office.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{office.address}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-150 dark:border-navy-800 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-saffron-600 dark:text-saffron-400 flex items-center gap-1">
                      <Compass size={14} /> {office.distance}
                    </span>

                    <div className="flex items-center gap-2">
                      {office.tel ? (
                        <a href={`tel:${office.tel}`} onClick={(e) => e.stopPropagation()}>
                          <Button variant="saffron" size="sm" icon={Phone}>
                            Call
                          </Button>
                        </a>
                      ) : (
                        <Button variant="ghost" size="sm" isDisabled icon={PhoneOff}>
                          Call
                        </Button>
                      )}

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${office.lat},${office.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="outline" size="sm" icon={Navigation}>
                          Directions
                        </Button>
                      </a>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Selected Facility Details Panel (Right 1 Column) */}
        <Card className="lg:col-span-1 space-y-4">
          <CardHeader>
            <CardTitle icon={Landmark}>Facility Details</CardTitle>
          </CardHeader>

          <CardBody>
            {activeOffice ? (
              <div className="space-y-4 text-xs">
                <h3 className="text-base font-bold text-navy-800 dark:text-white font-outfit">{activeOffice.name}</h3>
                
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Address</span>
                  <p className="text-slate-700 dark:text-slate-200 mt-0.5">{activeOffice.address}</p>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Operating Hours</span>
                  <p className="text-slate-700 dark:text-slate-200 mt-0.5 flex items-center gap-1 font-semibold">
                    <Clock size={14} className="text-saffron-500" /> {activeOffice.hours}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Contact Helpline</span>
                  {activeOffice.tel ? (
                    <a href={`tel:${activeOffice.tel}`} className="text-saffron-600 dark:text-saffron-400 font-bold text-sm hover:underline block mt-0.5">
                      {activeOffice.tel}
                    </a>
                  ) : (
                    <span className="text-slate-400 italic mt-0.5 block">No direct phone listed</span>
                  )}
                </div>

                {/* Step-by-Step Directions */}
                <div className="pt-3 border-t border-slate-150 dark:border-navy-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Step-by-Step Route</span>
                    <button
                      onClick={() => setShowDirections(!showDirections)}
                      className="text-saffron-500 hover:underline font-bold text-[11px]"
                    >
                      {showDirections ? 'Hide Route' : 'Show Route'}
                    </button>
                  </div>

                  {showDirections && (
                    <ol className="list-decimal pl-4 space-y-1.5 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                      {activeOffice.directions.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  )}
                </div>

                <div className="pt-2">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${activeOffice.lat},${activeOffice.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button variant="saffron" className="w-full" icon={Navigation}>
                      Open Driving Directions
                    </Button>
                  </a>
                </div>

              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs space-y-1">
                <Compass size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="font-semibold">Select any facility on the left to view opening hours, verified contact numbers, and turn-by-turn route directions.</p>
              </div>
            )}
          </CardBody>
        </Card>

      </div>

    </div>
  );
}
