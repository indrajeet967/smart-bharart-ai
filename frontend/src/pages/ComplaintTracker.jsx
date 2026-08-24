import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Search, ClipboardList, Clock, ShieldCheck, HelpCircle, MapPin, CheckCircle } from 'lucide-react';
import axios from 'axios';

export default function ComplaintTracker() {
  const { t } = useLanguage();

  const [searchId, setSearchId] = useState('');
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setLoading(true);
    setError('');
    setComplaint(null);

    try {
      const res = await axios.get(`/api/complaints/track/${searchId.trim()}`);
      setComplaint(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Complaint ID not found. Verify format (e.g. SB-XXXXXX-2026).');
    } finally {
      setLoading(false);
    }
  };

  // Determine status step indices (0, 1, 2, 3)
  const getStatusStep = (status) => {
    const steps = ['Pending', 'Assigned', 'In Progress', 'Resolved'];
    const idx = steps.indexOf(status);
    return idx !== -1 ? idx : 0;
  };

  const statusStep = complaint ? getStatusStep(complaint.status) : 0;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold font-outfit text-navy-800 dark:text-white flex items-center gap-2">
          <Search className="text-saffron-500" />
          National Complaint Tracker
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          Enter your unique complaint ID (e.g. `SB-123456-2026`) to track department allocation, expected resolution dates, and active process logs.
        </p>
      </div>

      {/* Search Input bar */}
      <div className="glass bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl shadow-sm p-6 max-w-2xl mx-auto">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <ClipboardList size={18} />
            </span>
            <input
              type="text"
              required
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter Complaint ID (e.g., SB-923841-2026)"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-250 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 focus:border-saffron-500 focus:outline-none text-sm transition-colors font-mono font-bold"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-navy-800 dark:bg-saffron-500 hover:bg-navy-900 dark:hover:bg-saffron-600 text-white font-bold rounded-xl shadow transition-all shrink-0 text-sm disabled:opacity-50"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Track Issue</>}
          </button>
        </form>

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-3 font-semibold text-center">{error}</p>
        )}
      </div>

      {/* Complaint detail timeline result */}
      {complaint && (
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 animate-scale-up">
          
          {/* Metadata Card (1 column) */}
          <div className="md:col-span-1 glass bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 shadow-sm space-y-5 h-fit">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Complaint ID</p>
              <h3 className="text-base font-bold text-navy-800 dark:text-saffron-400 font-mono">{complaint.complaintId}</h3>
            </div>
            
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Category</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{complaint.category}</p>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Department</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{complaint.department}</p>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Priority Level</p>
              <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full mt-1 border ${
                complaint.priority === 'High' ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200/50' :
                complaint.priority === 'Medium' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/50' :
                'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/50'
              }`}>
                {complaint.priority} Priority
              </span>
            </div>

            <div className="border-t border-slate-100 dark:border-navy-850 pt-4">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Clock size={12} /> Expected Resolution
              </p>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 mt-1">
                {new Date(complaint.expectedResolution).toLocaleDateString()} (7-Day SLA)
              </p>
            </div>

            {complaint.imageUrl && (
              <div className="border-t border-slate-100 dark:border-navy-850 pt-4">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Submitted Photo</p>
                <div className="h-28 rounded-xl border border-slate-150 dark:border-navy-800 overflow-hidden">
                  <img src={complaint.imageUrl} alt="Complaint preview" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </div>

          {/* Timeline & Progress (2 columns) */}
          <div className="md:col-span-2 glass bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 shadow-sm space-y-8">
            
            {/* Horizontal progress bar steps */}
            <div className="space-y-4">
              <h3 className="text-base font-bold font-outfit text-navy-800 dark:text-white">Resolution Flow Progress</h3>
              
              <div className="relative pt-4">
                {/* Connector line */}
                <div className="absolute top-7 left-0 right-0 h-1 bg-slate-200 dark:bg-navy-950 -z-10 rounded" />
                <div 
                  className="absolute top-7 left-0 h-1 bg-saffron-500 -z-10 rounded transition-all duration-500" 
                  style={{ width: `${(statusStep / 3) * 100}%` }}
                />

                <div className="flex justify-between items-center text-center">
                  {['Pending', 'Assigned', 'In Progress', 'Resolved'].map((step, idx) => (
                    <div key={idx} className="space-y-2 flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border transition-all ${
                        idx <= statusStep
                          ? 'bg-saffron-500 border-saffron-500 text-white shadow-md shadow-saffron-500/10'
                          : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-800 text-slate-400'
                      }`}>
                        {idx + 1}
                      </div>
                      <span className={`text-[10px] font-bold ${
                        idx <= statusStep ? 'text-navy-800 dark:text-saffron-400' : 'text-slate-450'
                      }`}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Vertical timeline details logs */}
            <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-navy-850">
              <h3 className="text-base font-bold font-outfit text-navy-800 dark:text-white">Department Action Log</h3>
              
              <div className="space-y-6 relative border-l-2 border-slate-200 dark:border-navy-950 ml-4 pl-6">
                {complaint.timeline.map((log, idx) => (
                  <div key={idx} className="relative space-y-1">
                    {/* Timeline bullet pin */}
                    <span className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-navy-900 bg-saffron-500" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-navy-800 dark:text-white">{log.status}</span>
                      <span className="text-[9px] text-slate-400 font-semibold">{new Date(log.date).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-350">{log.note}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Default placeholder info */}
      {!complaint && (
        <div className="max-w-md mx-auto p-8 text-center glass bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 space-y-3 flex flex-col items-center justify-center">
          <span className="text-4xl animate-pulse">🔍</span>
          <h3 className="text-sm font-bold text-navy-800 dark:text-white">No Track Target Loaded</h3>
          <p className="text-xs text-slate-400">Search using a valid Complaint ID above. Note: you can find your reported complaint ID in your user Profile page.</p>
        </div>
      )}

    </div>
  );
}
