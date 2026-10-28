import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const LocationContext = createContext();
export const useLocation = () => useContext(LocationContext);

// Comprehensive list of Indian states and major cities/districts
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
  'Andaman & Nicobar Islands', 'Dadra & Nagar Haveli', 'Daman & Diu', 'Lakshadweep'
];

// Major city/district to state mapping for quick lookup
export const CITY_STATE_MAP = {
  // Uttar Pradesh
  'Mathura': { state: 'Uttar Pradesh', lat: 27.4924, lng: 77.6737 },
  'Agra': { state: 'Uttar Pradesh', lat: 27.1767, lng: 78.0081 },
  'Lucknow': { state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  'Varanasi': { state: 'Uttar Pradesh', lat: 25.3176, lng: 82.9739 },
  'Kanpur': { state: 'Uttar Pradesh', lat: 26.4499, lng: 80.3319 },
  'Prayagraj': { state: 'Uttar Pradesh', lat: 25.4358, lng: 81.8463 },
  'Meerut': { state: 'Uttar Pradesh', lat: 28.9845, lng: 77.7064 },
  'Ghaziabad': { state: 'Uttar Pradesh', lat: 28.6692, lng: 77.4538 },
  'Noida': { state: 'Uttar Pradesh', lat: 28.5355, lng: 77.3910 },
  'Gorakhpur': { state: 'Uttar Pradesh', lat: 26.7606, lng: 83.3732 },
  'Aligarh': { state: 'Uttar Pradesh', lat: 27.8974, lng: 78.0880 },
  'Moradabad': { state: 'Uttar Pradesh', lat: 28.8386, lng: 78.7733 },
  'Bareilly': { state: 'Uttar Pradesh', lat: 28.3670, lng: 79.4304 },

  // Delhi
  'Delhi': { state: 'Delhi', lat: 28.6139, lng: 77.2090 },
  'New Delhi': { state: 'Delhi', lat: 28.6139, lng: 77.2090 },
  'Dwarka': { state: 'Delhi', lat: 28.5821, lng: 77.0560 },
  'Rohini': { state: 'Delhi', lat: 28.7347, lng: 77.1148 },

  // Maharashtra
  'Mumbai': { state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
  'Pune': { state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  'Nagpur': { state: 'Maharashtra', lat: 21.1458, lng: 79.0882 },
  'Thane': { state: 'Maharashtra', lat: 19.2183, lng: 72.9781 },
  'Nashik': { state: 'Maharashtra', lat: 19.9975, lng: 73.7898 },
  'Aurangabad': { state: 'Maharashtra', lat: 19.8762, lng: 75.3433 },

  // Karnataka
  'Bangalore': { state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  'Bengaluru': { state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  'Mysuru': { state: 'Karnataka', lat: 12.2958, lng: 76.6394 },
  'Hubli': { state: 'Karnataka', lat: 15.3647, lng: 75.1240 },
  'Mangalore': { state: 'Karnataka', lat: 12.9141, lng: 74.8560 },

  // Tamil Nadu
  'Chennai': { state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  'Coimbatore': { state: 'Tamil Nadu', lat: 11.0168, lng: 76.9558 },
  'Madurai': { state: 'Tamil Nadu', lat: 9.9252, lng: 78.1198 },
  'Salem': { state: 'Tamil Nadu', lat: 11.6643, lng: 78.1460 },

  // Rajasthan
  'Jaipur': { state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  'Jodhpur': { state: 'Rajasthan', lat: 26.2389, lng: 73.0243 },
  'Udaipur': { state: 'Rajasthan', lat: 24.5854, lng: 73.7125 },
  'Kota': { state: 'Rajasthan', lat: 25.2138, lng: 75.8648 },

  // Madhya Pradesh
  'Bhopal': { state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126 },
  'Indore': { state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
  'Gwalior': { state: 'Madhya Pradesh', lat: 26.2183, lng: 78.1828 },
  'Jabalpur': { state: 'Madhya Pradesh', lat: 23.1815, lng: 79.9864 },

  // Gujarat
  'Ahmedabad': { state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  'Surat': { state: 'Gujarat', lat: 21.1702, lng: 72.8311 },
  'Vadodara': { state: 'Gujarat', lat: 22.3072, lng: 73.1812 },
  'Rajkot': { state: 'Gujarat', lat: 22.3039, lng: 70.8022 },

  // West Bengal
  'Kolkata': { state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  'Howrah': { state: 'West Bengal', lat: 22.5958, lng: 88.2636 },
  'Durgapur': { state: 'West Bengal', lat: 23.5204, lng: 87.3119 },

  // Telangana
  'Hyderabad': { state: 'Telangana', lat: 17.3850, lng: 78.4867 },
  'Warangal': { state: 'Telangana', lat: 17.9689, lng: 79.5941 },

  // Punjab
  'Amritsar': { state: 'Punjab', lat: 31.6340, lng: 74.8723 },
  'Ludhiana': { state: 'Punjab', lat: 30.9010, lng: 75.8573 },
  'Chandigarh': { state: 'Chandigarh', lat: 30.7333, lng: 76.7794 },

  // Bihar
  'Patna': { state: 'Bihar', lat: 25.5941, lng: 85.1376 },
  'Gaya': { state: 'Bihar', lat: 24.7955, lng: 84.9994 },

  // Odisha
  'Bhubaneswar': { state: 'Odisha', lat: 20.2961, lng: 85.8245 },
  'Cuttack': { state: 'Odisha', lat: 20.4625, lng: 85.8828 },

  // Kerala
  'Thiruvananthapuram': { state: 'Kerala', lat: 8.5241, lng: 76.9366 },
  'Kochi': { state: 'Kerala', lat: 9.9312, lng: 76.2673 },
  'Kozhikode': { state: 'Kerala', lat: 11.2588, lng: 75.7804 },

  // Andhra Pradesh
  'Visakhapatnam': { state: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185 },
  'Vijayawada': { state: 'Andhra Pradesh', lat: 16.5062, lng: 80.6480 },

  // Assam
  'Guwahati': { state: 'Assam', lat: 26.1445, lng: 91.7362 },

  // Haryana
  'Gurugram': { state: 'Haryana', lat: 28.4595, lng: 77.0266 },
  'Faridabad': { state: 'Haryana', lat: 28.4089, lng: 77.3178 },

  // Jharkhand
  'Ranchi': { state: 'Jharkhand', lat: 23.3441, lng: 85.3096 },
  'Jamshedpur': { state: 'Jharkhand', lat: 22.8046, lng: 86.2029 },

  // Uttarakhand
  'Dehradun': { state: 'Uttarakhand', lat: 30.3165, lng: 78.0322 },
  'Haridwar': { state: 'Uttarakhand', lat: 29.9457, lng: 78.1642 },

  // Chhattisgarh
  'Raipur': { state: 'Chhattisgarh', lat: 21.2514, lng: 81.6296 },

  // Himachal Pradesh
  'Shimla': { state: 'Himachal Pradesh', lat: 31.1048, lng: 77.1734 },

  // Goa
  'Panaji': { state: 'Goa', lat: 15.4909, lng: 73.8278 },
};

// Popular city suggestions for the search dropdown
export const POPULAR_CITIES = [
  'Mathura', 'Agra', 'Lucknow', 'Varanasi', 'Delhi', 'Mumbai', 'Bangalore',
  'Chennai', 'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Bhopal',
  'Patna', 'Bhubaneswar', 'Chandigarh', 'Kochi', 'Guwahati', 'Dehradun',
];

const DEFAULT_LOCATION = {
  city: '',
  state: '',
  district: '',
  pincode: '',
  lat: null,
  lng: null,
  source: 'default', // 'gps' | 'manual' | 'default'
  displayName: 'Select Location',
};

export const LocationProvider = ({ children }) => {
  const { profile, updatePreferredLocation } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('sb_selected_location');
      return saved ? JSON.parse(saved) : DEFAULT_LOCATION;
    } catch {
      return DEFAULT_LOCATION;
    }
  });
  const [detecting, setDetecting] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [locationSaveError, setLocationSaveError] = useState('');

  // Persist location changes to localStorage
  useEffect(() => {
    if (selectedLocation.city || selectedLocation.state) {
      localStorage.setItem('sb_selected_location', JSON.stringify(selectedLocation));
    }
  }, [selectedLocation]);

  useEffect(() => {
    const savedLocation = profile?.preferredLocation;
    if (savedLocation && (savedLocation.city || savedLocation.state)) {
      const location = { ...DEFAULT_LOCATION, ...savedLocation, source: 'manual' };
      setSelectedLocation(location);
      localStorage.setItem('sb_selected_location', JSON.stringify(location));
    }
  }, [profile?.email]);

  const savePreferredLocation = useCallback(async (location) => {
    if (!profile || !updatePreferredLocation) return;
    try {
      await updatePreferredLocation({
        city: location.city,
        state: location.state,
        district: location.district,
        pincode: location.pincode,
        lat: location.lat,
        lng: location.lng,
        displayName: location.displayName
      });
      setLocationSaveError('');
      return '';
    } catch (error) {
      const message = error.message || 'Could not save your preferred location to your account.';
      setLocationSaveError(message);
      return message;
    }
  }, [profile, updatePreferredLocation]);

  /**
   * Detect current GPS location using browser Geolocation API.
   * Uses reverse geocoding via nominatim (OpenStreetMap) - free, no API key required.
   */
  const detectCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      return { success: false, error: 'Geolocation not supported by this browser.' };
    }

    setDetecting(true);
    setPermissionDenied(false);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          try {
            // Use Nominatim reverse geocoding (OpenStreetMap, free, no key required)
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
              { headers: { 'Accept-Language': 'en' }, signal: AbortSignal.timeout(8000) }
            );
            if (!response.ok) throw new Error(`Reverse geocoding failed (${response.status}).`);
            const data = await response.json();
            const addr = data.address || {};

            const city = addr.city || addr.town || addr.village || addr.hamlet || addr.county || '';
            const state = addr.state || '';
            const district = addr.state_district || addr.county || '';
            const pincode = addr.postcode || '';
            const displayName = city ? `${city}, ${state}` : state || `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;

            const newLocation = {
              city,
              state,
              district,
              pincode,
              lat,
              lng,
              source: 'gps',
              displayName,
              detectedAt: new Date().toISOString(),
            };

            setSelectedLocation(newLocation);
            setDetecting(false);
            resolve({ success: true, location: newLocation });
          } catch (geoErr) {
            // Reverse geocoding failed but we have coordinates
            const newLocation = {
              city: '',
              state: '',
              district: '',
              pincode: '',
              lat,
              lng,
              source: 'gps',
              displayName: `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`,
              detectedAt: new Date().toISOString(),
            };
            setSelectedLocation(newLocation);
            setDetecting(false);
            resolve({ success: true, location: newLocation, warning: 'Address lookup failed, using coordinates only.' });
          }
        },
        (err) => {
          setDetecting(false);
          if (err.code === 1) {
            setPermissionDenied(true);
            resolve({ success: false, error: 'Location permission denied. Please use manual selection.' });
          } else {
            resolve({ success: false, error: 'Could not detect location. Please try again or select manually.' });
          }
        },
        { timeout: 10000, maximumAge: 60000 }
      );
    });
  }, []);

  /**
   * Set location by city name (looks up in CITY_STATE_MAP).
   */
  const setLocationByCity = useCallback((cityName) => {
    const cityData = CITY_STATE_MAP[cityName];
    if (cityData) {
      const newLocation = {
        city: cityName,
        state: cityData.state,
        district: cityName,
        pincode: '',
        lat: cityData.lat,
        lng: cityData.lng,
        source: 'manual',
        displayName: `${cityName}, ${cityData.state}`,
        setAt: new Date().toISOString(),
      };
      setSelectedLocation(newLocation);
      void savePreferredLocation(newLocation);
      return newLocation;
    }
    return null;
  }, [savePreferredLocation]);

  /**
   * Set location by custom input (city + state + optional coords).
   */
  const setLocationManually = useCallback(async (city, state, lat = null, lng = null, district = '', pincode = '') => {
    let resolvedLat = lat;
    let resolvedLng = lng;
    let resolvedCity = city;
    let resolvedDistrict = district || city;

    if (resolvedLat === null || resolvedLng === null) {
      try {
        const query = [city, district, pincode, state, 'India'].filter(Boolean).join(', ');
        const response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`,
          { signal: AbortSignal.timeout(8000) }
        );
        if (!response.ok) throw new Error(`Location search failed (${response.status}).`);
        const data = await response.json();
        const result = data.features?.find((feature) => {
          const properties = feature.properties || {};
          return properties.country === 'India' &&
            (!properties.state || properties.state.toLowerCase() === state.toLowerCase());
        });
        if (result) {
          const [resultLng, resultLat] = result.geometry.coordinates;
          resolvedLat = resultLat;
          resolvedLng = resultLng;
          resolvedCity = result.properties.city || result.properties.name || city;
          resolvedDistrict = result.properties.county || district || city;
        }
      } catch (error) {
        console.warn('Manual location geocoding failed:', error.message);
      }
    }

    const newLocation = {
      city: resolvedCity,
      state,
      district: resolvedDistrict,
      pincode,
      lat: resolvedLat,
      lng: resolvedLng,
      source: 'manual',
      displayName: city ? `${city}, ${state}` : state,
      setAt: new Date().toISOString(),
    };
    setSelectedLocation(newLocation);
    const saveError = await savePreferredLocation(newLocation);
    return {
      ...newLocation,
      coordinatesFound: Number.isFinite(resolvedLat) && Number.isFinite(resolvedLng),
      saveError
    };
  }, [savePreferredLocation]);

  /**
   * Clear location selection and reset to default.
   */
  const clearLocation = useCallback(() => {
    localStorage.removeItem('sb_selected_location');
    setSelectedLocation(DEFAULT_LOCATION);
    setPermissionDenied(false);
  }, []);

  /**
   * Whether the current location has coordinates we can use.
   */
  const hasCoordinates = Number.isFinite(selectedLocation.lat) && Number.isFinite(selectedLocation.lng);

  /**
   * Get a Google Maps search URL for the selected location.
   */
  const getGoogleMapsSearchUrl = (query = '') => {
    if (hasCoordinates) {
      return `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${selectedLocation.lat},${selectedLocation.lng},13z`;
    }
    if (selectedLocation.displayName && selectedLocation.displayName !== 'Select Location') {
      return `https://www.google.com/maps/search/${encodeURIComponent(`${query} near ${selectedLocation.displayName}`)}`;
    }
    return `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
  };

  /**
   * Get OpenStreetMap overpass nearby search URL.
   */
  const getNominatimSearchUrl = (query) => {
    if (selectedLocation.city) {
      return `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ' ' + selectedLocation.city)}&format=json&limit=10&addressdetails=1`;
    }
    return null;
  };

  const value = {
    selectedLocation,
    detecting,
    permissionDenied,
    locationSaveError,
    hasCoordinates,
    detectCurrentLocation,
    setLocationByCity,
    setLocationManually,
    clearLocation,
    getGoogleMapsSearchUrl,
    getNominatimSearchUrl,
    INDIAN_STATES,
    CITY_STATE_MAP,
    POPULAR_CITIES,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
