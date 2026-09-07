import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Search, ClipboardList, Clock, ShieldCheck, MapPin, CheckCircle, Activity, FileText } from 'lucide-react';
import axios from 'axios';
import Card, { CardHeader, CardTitle, CardBody } from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import StatusBadge from '../components/ui/StatusBadge';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { StatusProgressBar, TimelineList } from '../components/ui/Timeline';

export default function ComplaintTracker() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();

  const [searchId, setSearchId] = useState('');
  const [trackedComplaint, setTrackedComplaint] = useState(null);
  const [userComplaints, setUserComplaints] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingList, setLoadingList] = useState(true);

  // Fetch user's own complaints on mount
  useEffect(() => {
    const fetchUserComplaints = async () => {
      if (!profile?.email) return;
      try {
        setLoadingList(true);
        const res = await axios.get(`/api/complaints/user/${profile.email}`);
        setUserComplaints(res.data);
      } catch (err) {
        console.warn("Could not fetch user complaints list:", err);
      } finally {
        setLoadingList(false);
      }
    };

    fetchUserComplaints();
  }, [profile?.email]);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchId.trim()) {
      toast.error("Please enter a valid Complaint ID.");
      return;
    }

    setLoadingSearch(true);
    setTrackedComplaint(null);

    try {
      const res = await axios.get(`/api/complaints/track/${searchId.trim()}`);
      setTrackedComplaint(res.data);
      toast.success(`Loaded details for ${res.data.complaintId}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Complaint ID not found. Verify format (e.g. SB-2026-00125).");
    } finally {
      setLoadingSearch(false);
    }
  };

  const selectUserComplaint = (complaint) => {
    setTrackedComplaint(complaint);
    setSearchId(complaint.complaintId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Page Header */}
      <PageHeader
        title="National Complaint Tracker"
        description="Track the resolution progress of your reported issues in real-time. Search by Complaint ID or inspect your active logs below."
        icon={Search}
      />

      {/* Search Input Bar */}
      <Card className="max-w-2xl mx-auto p-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <SearchBar
            value={searchId}
            onChange={setSearchId}
            onClear={() => setSearchId('')}
            placeholder="Enter Complaint ID (e.g. SB-2026-92841)"
            className="flex-1"
          />
          <Button variant="saffron" type="submit" isLoading={loadingSearch} icon={Search}>
            Track Issue
          </Button>
        </form>
      </Card>

      {/* Complaint Detail Flow (If Tracked) */}
      {trackedComplaint && (
        <div className="max-w-4xl mx-auto space-y-6 animate-scale-up">
          
          {/* Progress Workflow Bar */}
          <Card>
            <CardHeader>
              <CardTitle icon={Activity}>
                Complaint Status Flow ({trackedComplaint.complaintId})
              </CardTitle>
              <StatusBadge status={trackedComplaint.status} />
            </CardHeader>
            <CardBody className="pt-2">
              <StatusProgressBar currentStatus={trackedComplaint.status} />
            </CardBody>
          </Card>

          {/* Details & Action Timeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Metadata Card (1 column) */}
            <Card className="md:col-span-1 space-y-4">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Complaint ID</span>
                <p className="text-base font-extrabold text-navy-800 dark:text-saffron-400 font-mono">{trackedComplaint.complaintId}</p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Category</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{trackedComplaint.category}</p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Assigned Department</span>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{trackedComplaint.department}</p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Priority</span>
                <Badge variant={trackedComplaint.priority === 'High' ? 'danger' : 'warning'} className="mt-0.5">
                  {trackedComplaint.priority} Priority
                </Badge>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Location Tag</span>
                <p className="text-xs text-slate-600 dark:text-slate-350">{trackedComplaint.location?.address || 'GPS Coordinates Tagged'}</p>
              </div>

              {trackedComplaint.imageUrl && (
                <div className="pt-2 border-t border-slate-150 dark:border-navy-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Evidence Photo</span>
                  <img src={trackedComplaint.imageUrl} alt="Evidence" className="h-32 w-full object-cover rounded-xl border border-slate-200 dark:border-navy-800" />
                </div>
              )}
            </Card>

            {/* Timeline Action Log (2 columns) */}
            <Card className="md:col-span-2 space-y-4">
              <CardHeader>
                <CardTitle icon={Clock}>Department Action Timeline</CardTitle>
              </CardHeader>
              <CardBody>
                <TimelineList events={trackedComplaint.timeline} />
              </CardBody>
            </Card>

          </div>

        </div>
      )}

      {/* "My Complaints" User Section */}
      <div className="max-w-4xl mx-auto space-y-4 pt-4">
        <h3 className="text-lg font-bold font-outfit text-navy-800 dark:text-white flex items-center gap-2">
          <ClipboardList className="text-saffron-500" />
          My Logged Complaints ({userComplaints.length})
        </h3>

        {loadingList ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading your complaint records...</div>
        ) : userComplaints.length === 0 ? (
          <EmptyState
            title="No Complaints Logged"
            description="You haven't reported any civic issues yet. Click below to submit your first report."
            actionLabel="Report Issue"
            onAction={() => window.location.href = '/dashboard/report'}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userComplaints.map((comp) => (
              <Card 
                key={comp._id} 
                hoverable 
                onClick={() => selectUserComplaint(comp)}
                className="p-5 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-extrabold font-mono text-navy-800 dark:text-saffron-400">{comp.complaintId}</span>
                    <StatusBadge status={comp.status} />
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{comp.category}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{comp.description}</p>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-150 dark:border-navy-800 flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                  <span>Logged: {new Date(comp.createdAt).toLocaleDateString()}</span>
                  <span className="text-saffron-600 dark:text-saffron-400 font-bold flex items-center gap-0.5">
                    Inspect Timeline &rarr;
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
