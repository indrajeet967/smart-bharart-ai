import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Search, ClipboardList, Clock, ShieldCheck, MapPin, CheckCircle, Activity, FileText, Trash2, ExternalLink } from 'lucide-react';
import axios from 'axios';
import Card, { CardHeader, CardTitle, CardBody } from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import StatusBadge from '../components/ui/StatusBadge';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Alert from '../components/ui/Alert';
import { StatusProgressBar, TimelineList } from '../components/ui/Timeline';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';

export default function ComplaintTracker() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();

  const [searchId, setSearchId] = useState('');
  const [trackedComplaint, setTrackedComplaint] = useState(null);
  const [userComplaints, setUserComplaints] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState('');

  // Delete complaint modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch user's own complaints on mount
  const fetchUserComplaints = async () => {
    try {
      setLoadingList(true);
      setListError('');
      const res = await axios.get(`/api/complaints/user/${profile?.email || 'guest@gmail.com'}`, { timeout: 2500 });
      setUserComplaints(res.data);
    } catch (err) {
      setUserComplaints([]);
      setListError(err.response?.data?.error || 'Your complaint records could not be loaded. Please try again.');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchUserComplaints();
  }, [profile?.email]);

  const handleDeleteComplaint = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/complaints/${deleteConfirmId}`, {
        timeout: 2500
      });
      toast.success(`Complaint ${deleteConfirmId} deleted from Smart Bharat account.`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'The complaint could not be deleted.');
    } finally {
      setDeleting(false);
      if (trackedComplaint && trackedComplaint.complaintId === deleteConfirmId) {
        setTrackedComplaint(null);
      }
      setDeleteConfirmId(null);
      fetchUserComplaints();
    }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchId.trim()) {
      toast.error("Please enter a valid Complaint ID.");
      return;
    }

    setLoadingSearch(true);
    setTrackedComplaint(null);

    try {
      const res = await axios.get(`/api/complaints/track/${searchId.trim()}`, { timeout: 2500 });
      setTrackedComplaint(res.data);
      toast.success(`Loaded details for ${res.data.complaintId}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not retrieve this complaint. Check the reference and try again.');
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
        description="Review status updates for your Smart Bharat records. Search by reference number or inspect your records below."
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
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Internal Department</span>
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

              {/* External records link to their published tracker; internal records remain separate. */}
              <div className="pt-3 border-t border-slate-150 dark:border-navy-800 space-y-2">
                {trackedComplaint.submissionChannel === 'external-government' && trackedComplaint.externalTrackingUrl ? (
                  <>
                    <p className="text-[11px] text-slate-500">
                      External status is not retrieved automatically. Use the authority's tracker with the reference number you supplied.
                    </p>
                    <a href={trackedComplaint.externalTrackingUrl} target="_blank" rel="noopener noreferrer" className="block">
                      <Button variant="outline" size="sm" className="w-full" icon={ExternalLink}>
                        Open Official Status Tracker
                      </Button>
                    </a>
                  </>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    This record is internal to Smart Bharat. It has not been submitted to a government portal.
                  </p>
                )}
                <Button
                  variant="danger"
                  size="sm"
                  className="w-full"
                  icon={Trash2}
                  onClick={() => setDeleteConfirmId(trackedComplaint.complaintId)}
                >
                  Delete Complaint
                </Button>
              </div>
            </Card>

            {/* Timeline Action Log (2 columns) */}
            <Card className="md:col-span-2 space-y-4">
              <CardHeader>
                <CardTitle icon={Clock}>Department Action Timeline</CardTitle>
                <Badge variant="neutral">Smart Bharat Internal Log</Badge>
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

        {listError && <Alert variant="error" title="Complaint records unavailable">{listError}</Alert>}
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
                  <div className="flex items-center gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(comp.complaintId);
                      }}
                    />
                    <span className="text-saffron-600 dark:text-saffron-400 font-bold flex items-center gap-0.5">
                      Inspect Timeline &rarr;
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <ConfirmationDialog
          isOpen={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={handleDeleteComplaint}
          title="Delete Complaint"
          message={`Are you sure you want to delete complaint ${deleteConfirmId}? Note: Deleting this complaint from Smart Bharat removes it from your local account dashboard history, but does NOT cancel any officially lodged complaint on an external government portal.`}
          confirmText="Delete Complaint"
          variant="danger"
          isLoading={deleting}
        />
      )}

    </div>
  );
}
