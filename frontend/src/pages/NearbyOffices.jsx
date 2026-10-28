import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { useToast } from '../context/ToastContext';
import {
  MapPin, Compass, Navigation, Phone, Clock, Landmark, AlertCircle,
  Building2, Shield, Flame, Mail, GraduationCap, Building, PhoneOff,
  RefreshCw, Search, ExternalLink, Info, Wifi, WifiOff, Loader2
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardBody } from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import LocationSelector from '../components/ui/LocationSelector';

// ─── Category metadata ─────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'All', icon: Landmark, osmTag: null },
  { name: 'Hospitals', icon: Building2, osmTag: 'amenity=hospital', label: 'hospital' },
  { name: 'Police Stations', icon: Shield, osmTag: 'amenity=police', label: 'police' },
  { name: 'Fire Stations', icon: Flame, osmTag: 'amenity=fire_station', label: 'fire_station' },
  { name: 'Post Offices', icon: Mail, osmTag: 'amenity=post_office', label: 'post_office' },
  { name: 'Government Offices', icon: Landmark, osmTag: 'office=government', label: 'government' },
  { name: 'Government Schools', icon: GraduationCap, osmTag: 'amenity=school', label: 'school' },
  { name: 'Banks', icon: Building, osmTag: 'amenity=bank', label: 'bank' },
];

// Overpass API query builder
function buildOverpassQuery(lat, lng, radiusMeters, osmTag) {
  const [key, value] = osmTag.split('=');
  return `
    [out:json][timeout:25];
    (
      node["${key}"="${value}"](around:${radiusMeters},${lat},${lng});
      way["${key}"="${value}"](around:${radiusMeters},${lat},${lng});
      relation["${key}"="${value}"](around:${radiusMeters},${lat},${lng});
    );
    out center tags;
  `.trim();
}

// Haversine distance between two lat/lng points (in km)
function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Extract best display name from OSM tags
function getDisplayName(tags) {
  return tags?.name || tags?.['name:en'] || tags?.['name:hi'] || 'Unnamed Facility';
}

// Get phone from OSM tags
function getPhone(tags) {
  return tags?.phone || tags?.['contact:phone'] || tags?.['phone:mobile'] || '';
}

// Get opening hours from OSM tags
function getHours(tags) {
  return tags?.opening_hours || tags?.['opening_hours:signed'] || '';
}

export default function NearbyOffices() {
  const { profile } = useAuth();
  const { selectedLocation, hasCoordinates, detecting, detectCurrentLocation, getGoogleMapsSearchUrl } = useLocation();
  const toast = useToast();

  const [selectedCategory, setSelectedCategory] = useState('Hospitals');
  const [activeOffice, setActiveOffice] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchText, setSearchText] = useState('');
  const [radiusKm, setRadiusKm] = useState(5);
  const [dataSource, setDataSource] = useState(''); // URL or fallback indicator

  const isOnline = navigator.onLine;

  // ── Fetch from Overpass API (OpenStreetMap) ──────────────────────────────
  const fetchNearbyFacilities = useCallback(async (cat) => {
    if (!hasCoordinates) {
      setError('Please select a location first to find nearby facilities.');
      return;
    }

    const { lat, lng } = selectedLocation;
    setLoading(true);
    setError('');
    setFacilities([]);
    setActiveOffice(null);
    setDataSource('');

    // Collect OSM tags for the selected category
    const catsToFetch = cat === 'All'
      ? CATEGORIES.filter(c => c.osmTag)
      : CATEGORIES.filter(c => c.name === cat && c.osmTag);

    if (catsToFetch.length === 0) {
      setLoading(false);
      return;
    }

    const radiusMeters = radiusKm * 1000;
    const allResults = [];
    const failedCategories = [];

    for (const catInfo of catsToFetch) {
      try {
        const query = buildOverpassQuery(lat, lng, radiusMeters, catInfo.osmTag);
        const response = await fetch(
          `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
          { signal: AbortSignal.timeout(15000) }
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        const elements = data.elements || [];
        elements.forEach(el => {
          const elLat = el.lat ?? el.center?.lat;
          const elLng = el.lon ?? el.center?.lon;
          if (!elLat || !elLng) return;

          const distance = getDistanceKm(lat, lng, elLat, elLng);
          allResults.push({
            id: el.id,
            name: getDisplayName(el.tags),
            category: catInfo.name,
            address: [
              el.tags?.['addr:housename'],
              el.tags?.['addr:housenumber'],
              el.tags?.['addr:street'],
              el.tags?.['addr:locality'] || el.tags?.['addr:city'],
              el.tags?.['addr:district'],
              el.tags?.['addr:state'],
            ].filter(Boolean).join(', ') || selectedLocation.displayName,
            phone: getPhone(el.tags),
            hours: getHours(el.tags),
            lat: elLat,
            lng: elLng,
            distance,
            tags: el.tags,
            website: el.tags?.website || el.tags?.['contact:website'] || '',
          });
        });

        setDataSource('OpenStreetMap (Overpass API)');
      } catch (err) {
        console.warn(`Overpass fetch failed for ${catInfo.name}:`, err.message);
        failedCategories.push(catInfo.name);
      }
    }

    // Sort by distance
    allResults.sort((a, b) => a.distance - b.distance);
    setFacilities(allResults);

    if (allResults.length === 0 && failedCategories.length === catsToFetch.length) {
      setError('Nearby facility data could not be retrieved. Check your connection and try again.');
    } else if (allResults.length === 0) {
      setError(`No ${cat === 'All' ? 'facilities' : cat.toLowerCase()} found within ${radiusKm} km of ${selectedLocation.displayName}. Try increasing the search radius or changing location.`);
    } else if (failedCategories.length > 0) {
      setError(`Partial results: data for ${failedCategories.join(', ')} could not be retrieved.`);
    }

    setLoading(false);
  }, [hasCoordinates, selectedLocation, radiusKm]);

  // Fetch when category or location changes
  useEffect(() => {
    if (hasCoordinates) {
      fetchNearbyFacilities(selectedCategory);
    }
  }, [selectedCategory, selectedLocation.lat, selectedLocation.lng, radiusKm]);

  // Filter by search text
  const displayFacilities = searchText
    ? facilities.filter(f =>
        f.name.toLowerCase().includes(searchText.toLowerCase()) ||
        f.address.toLowerCase().includes(searchText.toLowerCase())
      )
    : facilities;

  const handleDetect = async () => {
    const result = await detectCurrentLocation();
    if (!result.success) {
      toast.error(result.error || 'Location detection failed.');
    } else {
      toast.success(`Location: ${result.location.displayName}`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">

      {/* Page Header */}
      <PageHeader
        title="Nearby Government Offices & Services"
        description="Search OpenStreetMap records for facilities near your selected location. Coverage and data freshness vary by area."
        icon={MapPin}
        actions={
          <div className="flex gap-2">
            <Button
              variant="saffron"
              size="sm"
              onClick={handleDetect}
              isLoading={detecting}
              icon={Compass}
            >
              Detect My Location
            </Button>
            {hasCoordinates && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNearbyFacilities(selectedCategory)}
                isLoading={loading}
                icon={RefreshCw}
              >
                Refresh
              </Button>
            )}
          </div>
        }
      />

      {/* Location & Radius Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="flex-1">
          <LocationSelector showLabel className="w-full" />
        </div>

        <div className="flex flex-col gap-1 shrink-0">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Search Radius
          </label>
          <select
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
          >
            <option value={2}>2 km</option>
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={20}>20 km</option>
          </select>
        </div>
      </div>

      {/* Current Location Banner */}
      {hasCoordinates && (
        <div className="p-3.5 rounded-xl bg-saffron-500/10 border border-saffron-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-saffron-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-saffron-500" />
            </span>
            <span>
              <strong>Searching near:</strong> {selectedLocation.displayName}
              {' '}(Lat: {selectedLocation.lat?.toFixed(4)}, Lng: {selectedLocation.lng?.toFixed(4)})
            </span>
          </div>
          <div className="flex items-center gap-2">
            {selectedLocation.source === 'gps' && <Badge variant="success" size="sm">GPS</Badge>}
            {selectedLocation.source === 'manual' && <Badge variant="info" size="sm">Manual</Badge>}
          </div>
        </div>
      )}

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => {
                setSelectedCategory(cat.name);
                setActiveOffice(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 border ${
                isSelected
                  ? 'bg-saffron-500 text-white border-saffron-500 shadow-md'
                  : 'bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-navy-800 hover:bg-slate-50 dark:hover:bg-navy-850'
              }`}
            >
              <Icon size={15} />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      {facilities.length > 0 && (
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Filter results by name or address..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
          />
        </div>
      )}

      {/* No location selected prompt */}
      {!hasCoordinates && (
        <Alert variant="info" title="Location Required">
          Please detect your GPS location or select a city using the location selector above to discover nearby government facilities.
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Facilities List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Loader2 size={32} className="animate-spin text-saffron-500" />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Fetching nearby {selectedCategory.toLowerCase()} from OpenStreetMap...
              </p>
              <p className="text-xs text-slate-400">This may take a few seconds</p>
            </div>
          ) : error && !loading ? (
            <div className="space-y-4">
              <Alert variant="warning" title="No Results Found">
                {error}
              </Alert>

              {/* Fallback Google Maps Search */}
              {hasCoordinates && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-3">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Search on Google Maps instead:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['Government Hospital', 'Police Station', 'Post Office', 'Passport Office'].map(type => (
                      <a
                        key={type}
                        href={getGoogleMapsSearchUrl(type)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-saffron-500 hover:text-saffron-600 transition-all flex items-center gap-1.5"
                      >
                        <ExternalLink size={12} />
                        {type}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : displayFacilities.length === 0 && !loading && hasCoordinates ? (
            <EmptyState
              icon={Building}
              title="No Facilities Found"
              description={`No ${selectedCategory.toLowerCase()} found matching your search. Try a different filter or expand the radius.`}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayFacilities.map((facility) => (
                <Card
                  key={facility.id}
                  hoverable
                  onClick={() => setActiveOffice(facility)}
                  className={`p-5 space-y-3 flex flex-col justify-between ${
                    activeOffice?.id === facility.id ? 'border-2 border-saffron-500 bg-saffron-500/5' : ''
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-sm font-bold text-navy-800 dark:text-white leading-snug">{facility.name}</h4>
                      <Badge variant="neutral" size="sm">{facility.category}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{facility.address}</p>
                    {facility.hours && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                        <Clock size={11} /> {facility.hours}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-saffron-600 dark:text-saffron-400 flex items-center gap-1">
                      <Compass size={13} /> {facility.distance.toFixed(1)} km away
                    </span>

                    <div className="flex items-center gap-2">
                      {facility.phone ? (
                        <a href={`tel:${facility.phone}`} onClick={(e) => e.stopPropagation()}>
                          <Button variant="saffron" size="sm" icon={Phone}>Call</Button>
                        </a>
                      ) : (
                        <Button variant="ghost" size="sm" isDisabled icon={PhoneOff}>No Phone</Button>
                      )}

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="outline" size="sm" icon={Navigation}>Directions</Button>
                      </a>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Data Source Attribution */}
          {dataSource && facilities.length > 0 && (
            <p className="text-[10px] text-slate-400 text-center mt-2 flex items-center justify-center gap-1">
              <Info size={11} />
              Data from {dataSource} • May not include all facilities •
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">© OpenStreetMap contributors</a>
            </p>
          )}
        </div>

        {/* Selected Facility Details Panel */}
        <Card className="lg:col-span-1 space-y-4 h-fit sticky top-20">
          <CardHeader>
            <CardTitle icon={Landmark}>Facility Details</CardTitle>
          </CardHeader>

          <CardBody>
            {activeOffice ? (
              <div className="space-y-4 text-xs">
                <h3 className="text-base font-bold text-navy-800 dark:text-white font-outfit">{activeOffice.name}</h3>

                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Category</span>
                  <Badge variant="saffron" size="sm" className="mt-1">{activeOffice.category}</Badge>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Address</span>
                  <p className="text-slate-700 dark:text-slate-200 mt-0.5 leading-relaxed">{activeOffice.address}</p>
                </div>

                {activeOffice.hours && (
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Operating Hours</span>
                    <p className="text-emerald-600 dark:text-emerald-400 mt-0.5 font-semibold flex items-center gap-1">
                      <Clock size={13} /> {activeOffice.hours}
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Contact</span>
                  {activeOffice.phone ? (
                    <a href={`tel:${activeOffice.phone}`} className="text-saffron-600 dark:text-saffron-400 font-bold text-sm hover:underline block mt-0.5">
                      {activeOffice.phone}
                    </a>
                  ) : (
                    <span className="text-slate-400 italic mt-0.5 block">No phone listed in OSM data</span>
                  )}
                </div>

                {activeOffice.website && (
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Website</span>
                    <a
                      href={activeOffice.website.startsWith('http') ? activeOffice.website : `https://${activeOffice.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-saffron-600 dark:text-saffron-400 font-bold hover:underline text-xs flex items-center gap-1 mt-0.5"
                    >
                      <ExternalLink size={11} /> Visit Website
                    </a>
                  </div>
                )}

                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Distance</span>
                  <p className="font-bold text-saffron-600 dark:text-saffron-400 mt-0.5">{activeOffice.distance.toFixed(2)} km from {selectedLocation.displayName}</p>
                </div>

                <div className="pt-3 space-y-2 border-t border-slate-100 dark:border-navy-800">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${activeOffice.lat},${activeOffice.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="saffron" className="w-full" icon={Navigation}>
                      Get Directions (Google Maps)
                    </Button>
                  </a>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${activeOffice.lat}&mlon=${activeOffice.lng}#map=17/${activeOffice.lat}/${activeOffice.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="w-full" icon={MapPin} size="sm">
                      View on OpenStreetMap
                    </Button>
                  </a>
                </div>

                <p className="text-[10px] text-slate-400 italic">
                  Data from OpenStreetMap. Always verify contact details before visiting.
                </p>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 space-y-2">
                <Compass size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-xs">
                  {hasCoordinates
                    ? 'Click any facility card to view its details, contact, and directions.'
                    : 'Select a location to start searching for nearby government facilities.'
                  }
                </p>
              </div>
            )}
          </CardBody>
        </Card>

      </div>

    </div>
  );
}
