import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AlertTriangle, Camera, MapPin, CheckCircle, UploadCloud, RefreshCw, Sparkles, WifiOff } from 'lucide-react';
import axios from 'axios';

export default function ReportIssue() {
  const { profile } = useAuth();
  const { t } = useLanguage();

  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [address, setAddress] = useState('');
  
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiReportDetails, setAiReportDetails] = useState(null);
  
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [syncingOffline, setSyncingOffline] = useState(false);

  // Monitor offline queue size
  useEffect(() => {
    const queue = JSON.parse(localStorage.getItem('sb_offline_reports')) || [];
    setOfflineQueueCount(queue.length);
  }, []);

  // HTML5 Location Pinning
  const handlePinLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(6));
        setLng(position.coords.longitude.toFixed(6));
        // Mock reverse address tagging for display
        setAddress(`Municipal Ward 14, Near Coordinates: ${position.coords.latitude.toFixed(4)}N, ${position.coords.longitude.toFixed(4)}E`);
        setLocating(false);
      },
      (err) => {
        console.error(err);
        // Fallback mock coordinates
        setLat("28.613912");
        setLng("77.209012");
        setAddress("Connaught Place, New Delhi, Delhi 110001");
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!description) return;

    setLoading(true);
    setAiReportDetails(null);

    const isOnline = navigator.onLine;

    // A. Offline Queue Handler
    if (!isOnline) {
      const offlineReport = {
        description,
        lat,
        lng,
        address,
        photoBase64: photoPreview, // Save base64 image representation
        photoName: photo ? photo.name : 'issue_photo.jpg',
        citizenEmail: profile?.email || 'guest@gmail.com',
        timestamp: new Date().toISOString()
      };

      const queue = JSON.parse(localStorage.getItem('sb_offline_reports')) || [];
      queue.push(offlineReport);
      localStorage.setItem('sb_offline_reports', JSON.stringify(queue));
      setOfflineQueueCount(queue.length);

      setLoading(false);
      setDescription('');
      setPhoto(null);
      setPhotoPreview('');
      setLat('');
      setLng('');
      setAddress('');
      alert("📡 Offline Mode detected. Your civic report is saved locally and queued. It will sync automatically once connectivity returns!");
      return;
    }

    // B. Online Submit Handler
    const formData = new FormData();
    formData.append('description', description);
    formData.append('citizenEmail', profile?.email || 'guest@gmail.com');
    if (photo) {
      formData.append('photo', photo);
    }
    formData.append('lat', lat);
    formData.append('lng', lng);
    formData.append('address', address);

    try {
      const res = await axios.post('/api/complaints/report', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setAiReportDetails(res.data.complaint);
        // Clear form
        setDescription('');
        setPhoto(null);
        setPhotoPreview('');
        setLat('');
        setLng('');
        setAddress('');
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit issue report. Check server configuration.");
    } finally {
      setLoading(false);
    }
  };

  // Sync Offline Queue to Backend
  const handleSyncOffline = async () => {
    if (!navigator.onLine) {
      alert("Cannot sync: device is still offline.");
      return;
    }

    setSyncingOffline(true);
    const queue = JSON.parse(localStorage.getItem('sb_offline_reports')) || [];
    let syncedCount = 0;

    for (let report of queue) {
      const formData = new FormData();
      formData.append('description', report.description);
      formData.append('citizenEmail', report.citizenEmail);
      formData.append('lat', report.lat);
      formData.append('lng', report.lng);
      formData.append('address', report.address);

      if (report.photoBase64) {
        // Convert base64 back to file blob
        try {
          const resBlob = await fetch(report.photoBase64);
          const blob = await resBlob.blob();
          formData.append('photo', blob, report.photoName);
        } catch (e) {
          console.warn("Could not attach photo during offline sync, sending description only.");
        }
      }

      try {
        await axios.post('/api/complaints/report', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        syncedCount++;
      } catch (err) {
        console.error("Failed to sync offline item:", err);
      }
    }

    // Clear synced items
    const remainingQueue = queue.slice(syncedCount);
    localStorage.setItem('sb_offline_reports', JSON.stringify(remainingQueue));
    setOfflineQueueCount(remainingQueue.length);
    setSyncingOffline(false);
    alert(`✅ Successfully synced ${syncedCount} queued reports in the background!`);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold font-outfit text-navy-800 dark:text-white flex items-center gap-2">
          <AlertTriangle className="text-saffron-500 animate-pulse" />
          AI Public Civic Issue Reporting
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          Report road damage, garbage dumps, leaking sewer lines, or street light issues. Gemini AI will analyze your photo & details to route it to the proper department.
        </p>
      </div>

      {/* Offline Sync Banner Alerts */}
      {offlineQueueCount > 0 && (
        <div className="p-4 bg-navy-800 text-white rounded-2xl flex justify-between items-center shadow-lg border border-navy-900 animate-slide-in">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-spin">📡</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-saffron-400">Offline Reports Pending</p>
              <p className="text-xs text-slate-200 mt-0.5">You have {offlineQueueCount} reported issues saved in your local sync queue.</p>
            </div>
          </div>
          <button
            onClick={handleSyncOffline}
            disabled={syncingOffline}
            className="px-4 py-2 bg-saffron-500 hover:bg-saffron-600 rounded-lg text-xs font-extrabold text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={syncingOffline ? 'animate-spin' : ''} />
            {syncingOffline ? 'Syncing...' : 'Sync Queue Now'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form panel (Left 2 columns) */}
        <form onSubmit={handleReportSubmit} className="lg:col-span-2 glass bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl shadow-sm p-6 space-y-6">
          <h3 className="text-base font-bold font-outfit text-navy-800 dark:text-white border-b border-slate-100 dark:border-navy-800 pb-2">
            File Civic Complaint
          </h3>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Detailed Description</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a description of the issue. E.g., 'A deep pothole has formed in the middle of sector-4 market road, causing vehicles to skid at night...'"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-250 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 focus:border-saffron-500 focus:outline-none text-sm transition-colors"
            />
          </div>

          {/* Photo uploader */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Upload Civic Photo</label>
              <div className="border-2 border-dashed border-slate-200 dark:border-navy-800 rounded-2xl p-6 text-center space-y-3 bg-slate-50/50 dark:bg-navy-950/20 hover:border-saffron-500/50 transition-colors flex flex-col justify-center items-center">
                <UploadCloud size={32} className="text-slate-400" />
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span className="text-saffron-500 hover:underline cursor-pointer font-bold relative">
                    Browse File
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={handlePhotoChange}
                    />
                  </span>
                  &nbsp;or drag here
                </div>
                <p className="text-[10px] text-slate-400">Supports JPG, PNG (Max 5MB)</p>
              </div>
            </div>

            {/* Photo preview */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Photo Preview</label>
              <div className="h-36 rounded-2xl border border-slate-200 dark:border-navy-800 overflow-hidden bg-slate-50 dark:bg-navy-950 flex items-center justify-center text-slate-400 text-xs">
                {photoPreview ? (
                  <img src={photoPreview} alt="Issue preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="flex items-center gap-1.5"><Camera size={16} /> No photo uploaded</span>
                )}
              </div>
            </div>

          </div>

          {/* GPS Coordinates tagging */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border-t border-slate-100 dark:border-navy-800 pt-4">
            
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Latitude</label>
              <input 
                type="text" 
                readOnly 
                value={lat} 
                placeholder="28.6139" 
                className="w-full px-3 py-2 border border-slate-200 dark:border-navy-800 rounded-lg bg-slate-100 dark:bg-navy-950 text-slate-500 text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Longitude</label>
              <input 
                type="text" 
                readOnly 
                value={lng} 
                placeholder="77.2090" 
                className="w-full px-3 py-2 border border-slate-200 dark:border-navy-800 rounded-lg bg-slate-100 dark:bg-navy-950 text-slate-500 text-xs focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handlePinLocation}
              disabled={locating}
              className="py-2.5 px-4 bg-white dark:bg-navy-950 hover:bg-slate-50 dark:hover:bg-navy-850 text-slate-700 dark:text-slate-250 border border-slate-200 dark:border-navy-800 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              {locating ? <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" /> : <><MapPin size={14} className="text-saffron-500" /> Pin My Current GPS</>}
            </button>

          </div>

          {address && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              📍 Tagged Location: <span className="text-slate-700 dark:text-slate-200">{address}</span>
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-navy-800 dark:bg-saffron-500 hover:bg-navy-900 dark:hover:bg-saffron-600 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>AI Categorizing & Assigning Priority...</span>
              </div>
            ) : (
              <>Report Civic Issue</>
            )}
          </button>
        </form>

        {/* AI Auto-Detection Results panel (Right 1 column) */}
        <div className="lg:col-span-1 space-y-6">
          {aiReportDetails ? (
            <div className="glass bg-white dark:bg-navy-900 border-2 border-emerald-500/50 rounded-2xl p-6 shadow-md animate-scale-up space-y-6">
              
              <div className="text-center space-y-2 border-b border-slate-100 dark:border-navy-800 pb-4">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full mx-auto flex items-center justify-center">
                  <CheckCircle size={28} />
                </div>
                <h4 className="text-base font-extrabold font-outfit text-navy-800 dark:text-white">Lodge Successful!</h4>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Complaint ID: <span className="font-extrabold text-navy-900 dark:text-saffron-500">{aiReportDetails.complaintId}</span></p>
              </div>

              <div className="space-y-4 text-xs font-semibold text-slate-500">
                <div className="flex justify-between items-center">
                  <span>AI CATEGORY:</span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-navy-950 text-navy-800 dark:text-slate-100 font-bold border border-slate-200/50">
                    {aiReportDetails.category}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span>AI ASSIGNED PRIORITY:</span>
                  <span className={`px-2 py-0.5 rounded font-bold border ${
                    aiReportDetails.priority === 'High' ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200/50' :
                    aiReportDetails.priority === 'Medium' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/50' :
                    'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/50'
                  }`}>
                    {aiReportDetails.priority}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span>ROUTED TO:</span>
                  <span className="text-slate-800 dark:text-slate-100 text-right">{aiReportDetails.department}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>SLA RESOLUTION SPEED:</span>
                  <span className="text-slate-800 dark:text-slate-100">{new Date(aiReportDetails.expectedResolution).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="p-3 bg-saffron-500/5 rounded-xl border border-saffron-500/10 space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={12} className="text-saffron-500 animate-pulse" /> Gemini Summary
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">
                  "{aiReportDetails.description.substring(0, 150)}..."
                </p>
              </div>

              <div className="text-center">
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  🎉 Resolving this high priority report awards you 150 Civic Points!
                </p>
              </div>

            </div>
          ) : (
            <div className="p-8 text-center glass bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl flex flex-col items-center justify-center space-y-3 h-full min-h-[300px]">
              <span className="text-4xl animate-pulse">🤖</span>
              <h4 className="text-sm font-bold text-navy-800 dark:text-white">AI Classification Awaiting</h4>
              <p className="text-xs text-slate-400 max-w-xs">Fill out the complaint description, tag coordinates, and click submit. The Gemini model automatically parses details and assigns resolution departments.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
