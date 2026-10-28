import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Compass, Search, X, ChevronDown, Navigation, Loader2 } from 'lucide-react';
import { useLocation } from '../../context/LocationContext';
import { useToast } from '../../context/ToastContext';

/**
 * LocationSelector - Reusable location selection component.
 * Shows current location, allows GPS detection, and manual city/state search.
 *
 * Props:
 *   className        - additional class names for wrapper
 *   showLabel        - whether to show "Current Location" label
 *   compact          - if true, renders a compact pill version for the Navbar
 */
export default function LocationSelector({ className = '', showLabel = true, compact = false }) {
  const {
    selectedLocation,
    detecting,
    permissionDenied,
    locationSaveError,
    detectCurrentLocation,
    setLocationByCity,
    setLocationManually,
    POPULAR_CITIES,
    CITY_STATE_MAP,
    INDIAN_STATES,
  } = useLocation();
  const toast = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [manualState, setManualState] = useState('');
  const [manualPincode, setManualPincode] = useState('');
  const [mode, setMode] = useState('search'); // 'search' | 'manual'
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleDetectGPS = async () => {
    const result = await detectCurrentLocation();
    if (result.success) {
      toast.success(`Location detected: ${result.location.displayName}`);
      setIsOpen(false);
    } else {
      toast.error(result.error || 'Could not detect location.');
    }
  };

  const handleCitySelect = (city) => {
    const result = setLocationByCity(city);
    if (result) {
      toast.success(`Location set to ${result.displayName}`);
      setIsOpen(false);
      setSearchQuery('');
    } else {
      toast.error('City not found in database. Please try manual entry.');
    }
  };

  const handleManualSave = async () => {
    if (!manualCity.trim() || !manualState.trim()) {
      toast.error('Please enter both city/area and state.');
      return;
    }
    const result = await setLocationManually(
      manualCity.trim(),
      manualState.trim(),
      null,
      null,
      '',
      manualPincode.trim()
    );
    if (!result.coordinatesFound) {
      toast.info('Location selected, but coordinates were not found. Nearby facilities need a more specific city or PIN code.');
    } else {
      toast.success(`Location set to ${result.displayName}`);
    }
    if (result.saveError) toast.error(result.saveError);
    setIsOpen(false);
    setManualCity('');
    setManualState('');
    setManualPincode('');
    setMode('search');
  };

  // Filter cities based on search query
  const filteredCities = searchQuery
    ? Object.keys(CITY_STATE_MAP).filter(city =>
        city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        CITY_STATE_MAP[city].state.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10)
    : POPULAR_CITIES.slice(0, 10);

  const hasLocation = selectedLocation.city || selectedLocation.state;
  const displayText = hasLocation ? selectedLocation.displayName : 'Select Location';

  if (compact) {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all"
          title="Change location"
        >
          <MapPin size={13} className={hasLocation ? 'text-saffron-500' : 'text-slate-400'} />
          <span className="max-w-[120px] truncate">{displayText}</span>
          {detecting ? <Loader2 size={11} className="animate-spin" /> : <ChevronDown size={11} />}
        </button>

        {isOpen && (
          <LocationDropdown
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredCities={filteredCities}
            mode={mode}
            setMode={setMode}
            manualCity={manualCity}
            setManualCity={setManualCity}
            manualState={manualState}
            setManualState={setManualState}
            manualPincode={manualPincode}
            setManualPincode={setManualPincode}
            INDIAN_STATES={INDIAN_STATES}
            handleDetectGPS={handleDetectGPS}
            handleCitySelect={handleCitySelect}
            handleManualSave={handleManualSave}
            detecting={detecting}
            permissionDenied={permissionDenied}
            CITY_STATE_MAP={CITY_STATE_MAP}
            inputRef={inputRef}
            onClose={() => setIsOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {showLabel && (
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
          Current Location
        </p>
      )}
      {locationSaveError && (
        <p role="status" className="mb-2 text-xs text-amber-700 dark:text-amber-400">
          Location is saved on this device, but account sync failed: {locationSaveError}
        </p>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
          hasLocation
            ? 'border-saffron-500/50 bg-saffron-50 dark:bg-saffron-500/10 text-slate-800 dark:text-slate-100'
            : 'border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 text-slate-500'
        }`}
      >
        <div className="flex items-center gap-2">
          <MapPin size={16} className={hasLocation ? 'text-saffron-500' : 'text-slate-400'} />
          <span>{displayText}</span>
          {selectedLocation.source === 'gps' && (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-full">GPS</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {detecting && <Loader2 size={14} className="animate-spin text-saffron-500" />}
          <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <LocationDropdown
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredCities={filteredCities}
          mode={mode}
          setMode={setMode}
          manualCity={manualCity}
          setManualCity={setManualCity}
          manualState={manualState}
          setManualState={setManualState}
          manualPincode={manualPincode}
          setManualPincode={setManualPincode}
          INDIAN_STATES={INDIAN_STATES}
          handleDetectGPS={handleDetectGPS}
          handleCitySelect={handleCitySelect}
          handleManualSave={handleManualSave}
          detecting={detecting}
          permissionDenied={permissionDenied}
          CITY_STATE_MAP={CITY_STATE_MAP}
          inputRef={inputRef}
          onClose={() => setIsOpen(false)}
          className="top-full mt-2"
        />
      )}
    </div>
  );
}

function LocationDropdown({
  searchQuery, setSearchQuery, filteredCities, mode, setMode,
  manualCity, setManualCity, manualState, setManualState,
  manualPincode, setManualPincode,
  INDIAN_STATES, handleDetectGPS, handleCitySelect, handleManualSave,
  detecting, permissionDenied, CITY_STATE_MAP, inputRef, onClose, className = 'top-full mt-2'
}) {
  return (
    <div className={`absolute ${className} left-0 z-50 w-80 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-2xl shadow-xl overflow-hidden`}>
      {/* Header */}
      <div className="p-3 border-b border-slate-100 dark:border-navy-800 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Set Location</span>
        <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-navy-800">
          <X size={14} className="text-slate-400" />
        </button>
      </div>

      {/* GPS Button */}
      <div className="p-3 border-b border-slate-100 dark:border-navy-800">
        <button
          onClick={handleDetectGPS}
          disabled={detecting}
          className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-saffron-50 dark:bg-saffron-500/10 border border-saffron-200 dark:border-saffron-500/20 text-saffron-700 dark:text-saffron-400 text-xs font-bold hover:bg-saffron-100 transition-all disabled:opacity-60"
        >
          {detecting ? (
            <Loader2 size={16} className="animate-spin shrink-0" />
          ) : (
            <Navigation size={16} className="shrink-0" />
          )}
          <span>{detecting ? 'Detecting location...' : 'Use Current GPS Location'}</span>
        </button>

        {permissionDenied && (
          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2 font-medium">
            ⚠️ Location permission was denied. Please select city manually below.
          </p>
        )}
      </div>

      {/* Mode Toggle */}
      <div className="px-3 pt-3 flex gap-2">
        <button
          onClick={() => setMode('search')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'search' ? 'bg-navy-800 dark:bg-saffron-500 text-white' : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
        >
          Search City
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'manual' ? 'bg-navy-800 dark:bg-saffron-500 text-white' : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
        >
          Manual Entry
        </button>
      </div>

      {mode === 'search' ? (
        <>
          {/* Search Input */}
          <div className="p-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city, district, state..."
                className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <X size={12} className="text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* City List */}
          <div className="max-h-52 overflow-y-auto px-3 pb-3 space-y-1">
            {!searchQuery && (
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Popular Cities</p>
            )}
            {filteredCities.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No cities found. Try manual entry.</p>
            ) : (
              filteredCities.map(city => (
                <button
                  key={city}
                  onClick={() => handleCitySelect(city)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-800 text-left transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <MapPin size={13} className="text-saffron-500 shrink-0" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{city}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{CITY_STATE_MAP[city]?.state}</span>
                </button>
              ))
            )}
          </div>
        </>
      ) : (
        /* Manual Entry Form */
        <div className="p-3 space-y-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              City / Area / District
            </label>
            <input
              type="text"
              value={manualCity}
              onChange={(e) => setManualCity(e.target.value)}
              placeholder="e.g. Mathura, Noida Sector 18..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              State / UT
            </label>
            <select
              value={manualState}
              onChange={(e) => setManualState(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
            >
              <option value="">Select state...</option>
              {INDIAN_STATES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              PIN Code (optional)
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={manualPincode}
              onChange={(e) => setManualPincode(e.target.value.replace(/\D/g, ''))}
              placeholder="Six-digit PIN code"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
            />
          </div>
          <button
            onClick={handleManualSave}
            className="w-full py-2 bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Set This Location
          </button>
        </div>
      )}
    </div>
  );
}
