import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Shield, BarChart3, AlertTriangle, CheckCircle, Clock, Map, Clipboard, HelpCircle } from 'lucide-react';
import axios from 'axios';

export default function Admin() {
  const { profile } = useAuth();
  const { t } = useLanguage();

  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState('Pending');
  const [noteUpdate, setNoteUpdate] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Analytics counters
  const [analytics, setAnalytics] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0
  });

  const fetchAllComplaints = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/complaints/admin/all');
      setComplaints(res.data);
      
      // Calculate analytics
      const total = res.data.length;
      const pending = res.data.filter(c => c.status === 'Pending').length;
      const inProgress = res.data.filter(c => c.status === 'In Progress' || c.status === 'Assigned').length;
      const resolved = res.data.filter(c => c.status === 'Resolved').length;

      setAnalytics({ total, pending, inProgress, resolved });
    } catch (e) {
      console.warn("Could not retrieve admin complaints, using mock database.");
      // Fallback mocks
      const mockList = [
        {
          _id: 'c_mock_1',
          complaintId: 'SB-289410-2026',
          citizenEmail: 'citizen.bharat@gmail.com',
          description: 'Large garbage pile left uncleared next to park entrance for 3 days.',
          category: 'Garbage',
          priority: 'Medium',
          status: 'Pending',
          department: 'Garbage Department',
          expectedResolution: new Date(),
          timeline: [{ status: 'Pending', date: new Date(), note: 'Lodge successful' }]
        },
        {
          _id: 'c_mock_2',
          complaintId: 'SB-892415-2026',
          citizenEmail: 'citizen.bharat@gmail.com',
          description: 'Exposed live wires hanging low over footpath outside public school.',
          category: 'Electricity',
          priority: 'High',
          status: 'In Progress',
          department: 'Electricity Department',
          expectedResolution: new Date(),
          timeline: [{ status: 'Pending', date: new Date(), note: 'Lodge successful' }]
        }
      ];
      setComplaints(mockList);
      setAnalytics({ total: 2, pending: 1, inProgress: 1, resolved: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllComplaints();
  }, []);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setUpdating(true);
    try {
      const res = await axios.post(`/api/complaints/admin/update/${selectedComplaint.complaintId}`, {
        status: statusUpdate,
        note: noteUpdate
      });

      if (res.data.success) {
        alert(`Status updated successfully. Points rewarded if Resolved: ${res.data.pointsAwarded}`);
        setSelectedComplaint(null);
        setNoteUpdate('');
        fetchAllComplaints();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold font-outfit text-navy-800 dark:text-white flex items-center gap-2">
            <Shield className="text-saffron-500" />
            National Administration Control
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Resolve citizen reports, review geographic complaint density heatmaps, and audit average response times.
          </p>
        </div>
        <span className="px-3.5 py-1 bg-red-500 text-white font-extrabold rounded-full text-xs border border-white/10 uppercase tracking-widest animate-pulse shadow">
          Live Admin Session
        </span>
      </div>

      {/* Analytics Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl glass bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Reports logged</p>
          <h3 className="text-3xl font-extrabold font-outfit mt-2 text-navy-800 dark:text-white">{analytics.total}</h3>
        </div>
        <div className="p-6 rounded-2xl glass bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Audit</p>
          <h3 className="text-3xl font-extrabold font-outfit mt-2 text-saffron-500">{analytics.pending}</h3>
        </div>
        <div className="p-6 rounded-2xl glass bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active In Progress</p>
          <h3 className="text-3xl font-extrabold font-outfit mt-2 text-blue-500">{analytics.inProgress}</h3>
        </div>
        <div className="p-6 rounded-2xl glass bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Issues Resolved</p>
          <h3 className="text-3xl font-extrabold font-outfit mt-2 text-emerald-600 dark:text-emerald-400">{analytics.resolved}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Complaints List (Left 2 columns) */}
        <div className="lg:col-span-2 glass bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl shadow-sm p-6 space-y-6">
          <h3 className="text-base font-bold font-outfit text-navy-800 dark:text-white border-b border-slate-100 dark:border-navy-850 pb-2">
            Active Citizen Complaints Registry
          </h3>

          {loading ? (
            <p className="text-xs text-slate-400">Loading complaints registry...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-500 font-semibold">
                <thead className="text-[10px] text-slate-400 uppercase border-b border-slate-150 dark:border-navy-850">
                  <tr>
                    <th className="py-3 px-2">ID</th>
                    <th className="py-3 px-2">Category</th>
                    <th className="py-3 px-2">Priority</th>
                    <th className="py-3 px-2">Reporter</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-850">
                  {complaints.map((comp) => (
                    <tr key={comp._id} className="hover:bg-slate-50/50 dark:hover:bg-navy-950/20 transition-colors">
                      <td className="py-3 px-2 font-bold font-mono text-navy-800 dark:text-saffron-400">{comp.complaintId}</td>
                      <td className="py-3 px-2">{comp.category}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          comp.priority === 'High' ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200/50' :
                          comp.priority === 'Medium' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200/50' :
                          'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200/50'
                        }`}>
                          {comp.priority}
                        </span>
                      </td>
                      <td className="py-3 px-2 truncate max-w-[120px]">{comp.citizenEmail}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          comp.status === 'Resolved' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50' :
                          comp.status === 'In Progress' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200/50' :
                          'bg-slate-50 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-200/50'
                        }`}>
                          {comp.status}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => {
                            setSelectedComplaint(comp);
                            setStatusUpdate(comp.status);
                          }}
                          className="px-2.5 py-1 bg-navy-800 dark:bg-navy-950 dark:hover:bg-navy-850 hover:bg-navy-900 text-white font-bold rounded"
                        >
                          Audit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Audit Form or Heatmap Mockup (Right 1 column) */}
        <div className="lg:col-span-1 space-y-6">
          
          {selectedComplaint ? (
            /* Selected Audit Card form */
            <div className="glass bg-white dark:bg-navy-900 border-2 border-saffron-500/30 rounded-2xl p-6 shadow-md animate-scale-up space-y-4">
              <h3 className="text-sm font-bold font-outfit text-navy-800 dark:text-white border-b border-slate-100 dark:border-navy-800 pb-2">
                Audit Issue: {selectedComplaint.complaintId}
              </h3>
              
              <div className="text-xs font-semibold text-slate-500 space-y-2.5">
                <p>REPORTER: <span className="text-slate-800 dark:text-slate-200">{selectedComplaint.citizenEmail}</span></p>
                <p>DESCRIPTION: <span className="text-slate-700 dark:text-slate-350 leading-relaxed font-semibold italic">"{selectedComplaint.description}"</span></p>
              </div>

              <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs font-semibold text-slate-500">
                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Update Status</label>
                  <select
                    value={statusUpdate}
                    onChange={(e) => setStatusUpdate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-navy-800 rounded-lg bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-saffron-500 font-bold"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="uppercase tracking-wider">Department Note / Action log</label>
                  <textarea
                    rows={3}
                    value={noteUpdate}
                    onChange={(e) => setNoteUpdate(e.target.value)}
                    placeholder="Enter audit investigation note..."
                    className="w-full px-3 py-2 border border-slate-250 dark:border-navy-800 rounded-lg bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-saffron-500 text-xs"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 py-2 bg-saffron-500 hover:bg-saffron-600 text-white font-bold rounded-lg text-xs"
                  >
                    {updating ? 'Updating...' : 'Update status'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedComplaint(null)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-navy-950 dark:hover:bg-navy-850 text-slate-700 dark:text-slate-250 font-bold rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Map Heatmap Overlay Showcase */
            <div className="glass bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold font-outfit text-navy-800 dark:text-white border-b border-slate-100 dark:border-navy-850 pb-2 flex items-center gap-1.5">
                <Map size={16} className="text-saffron-500" />
                Active Complaint Heatmap
              </h3>
              
              <div className="relative h-44 rounded-xl border border-slate-150 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-grid-pattern opacity-10" />
                
                {/* Simulated Heatmap visual layers */}
                <div className="absolute top-1/4 left-1/3 w-16 h-16 bg-red-500/30 rounded-full blur-xl animate-pulse" />
                <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-amber-500/30 rounded-full blur-xl animate-pulse" />
                <div className="absolute top-2/3 left-1/4 w-12 h-12 bg-red-500/25 rounded-full blur-xl animate-pulse" />
                
                <span className="text-[10px] bg-navy-800 text-white px-2 py-0.5 rounded font-bold border border-white/10 z-10 shadow">
                  Delhi Ward 14 Density: High
                </span>
              </div>

              <div className="space-y-2 text-[11px] font-semibold text-slate-500 leading-normal">
                <p>📍 High-density Zone: <span className="text-red-500 font-bold">Connaught Place block 12 (Garbage)</span></p>
                <p>📈 Average response speed: <span className="text-emerald-600 font-bold">4.2 hours (low impact)</span></p>
                <p>🛠️ Assigned contractors: <span className="text-slate-800 dark:text-slate-200">NDMC sanitation division 2</span></p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
