import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLocation as useAppLocation } from '../context/LocationContext';
import { useToast } from '../context/ToastContext';
import { 
  AlertTriangle, Camera, MapPin, CheckCircle, UploadCloud, RefreshCw, 
  Sparkles, WifiOff, ChevronRight, ChevronLeft, FileText, Check, ShieldCheck, ExternalLink,
  Navigation, Info
} from 'lucide-react';
import axios from 'axios';
import Card, { CardHeader, CardTitle, CardBody } from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { COMPLAINT_ROUTING } from '../data/governmentKnowledge';

export default function ReportIssue() {
  const { profile, refetchProfile } = useAuth();
  const { t } = useLanguage();
  const { selectedLocation, hasCoordinates, detectCurrentLocation, detecting } = useAppLocation();
  const toast = useToast();

  const [currentStep, setCurrentStep] = useState(1); // 1: Category, 2: Location, 3: Evidence, 4: Description, 5: Review
  
  // Form State
  const [category, setCategory] = useState('Road/Pothole');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [address, setAddress] = useState('');
  
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState(null);
  
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [syncingOffline, setSyncingOffline] = useState(false);

  const categoryOptions = [
    { value: 'Road/Pothole', label: '🛣️ Road Damage / Potholes', desc: 'Cracks, cave-ins, potholes, damaged asphalt' },
    { value: 'Garbage', label: '🗑️ Garbage / Waste Dump', desc: 'Uncollected trash bins, open waste dumps' },
    { value: 'Street Light', label: '💡 Street Light / Dark Lane', desc: 'Non-functional lamps, dark streets, broken poles' },
    { value: 'Water Supply', label: '💧 Water Supply / Leakage', desc: 'Broken pipe leaks, low pressure, dirty water' },
    { value: 'Drainage', label: '🌊 Drainage / Overflow', desc: 'Blocked sewers, overflowing gutters, bad odors' },
    { value: 'Electricity', label: '⚡ Electricity / Power Hazard', desc: 'Sparks, hanging wires, damaged transformers' },
    { value: 'Public Infrastructure', label: '🏛️ Public Infrastructure', desc: 'Damaged bus stops, broken footpaths, parks' },
    { value: 'Other', label: '⚠️ Other Civic Issue', desc: 'General municipal concerns' }
  ];

  // Monitor offline queue size
  useEffect(() => {
    const queue = JSON.parse(localStorage.getItem('sb_offline_reports') || '[]');
    setOfflineQueueCount(queue.length);
  }, []);

  // Auto-fill from LocationContext when it has coordinates
  useEffect(() => {
    if (hasCoordinates && selectedLocation.lat && !lat) {
      setLat(String(selectedLocation.lat));
      setLng(String(selectedLocation.lng));
      if (selectedLocation.displayName && selectedLocation.displayName !== 'Select Location') {
        setAddress(selectedLocation.displayName);
      }
    }
  }, [hasCoordinates, selectedLocation.lat]);

  // Derived complaint routing suggestion
  const routingInfo = (() => {
    const routing = COMPLAINT_ROUTING[category] || COMPLAINT_ROUTING.default;
    const userState = selectedLocation?.state || profile?.state || '';
    return userState ? routing.stateFallback?.[userState] || null : null;
  })();

  // GPS location pinning
  const handlePinLocation = async () => {
    setLocating(true);
    const result = await detectCurrentLocation();
    if (result.success) {
      const loc = result.location;
      setLat(String(loc.lat.toFixed(6)));
      setLng(String(loc.lng.toFixed(6)));
      setAddress(loc.displayName || `${loc.lat.toFixed(4)}°N, ${loc.lng.toFixed(4)}°E`);
      toast.success('GPS coordinates detected successfully!');
    } else {
      // Use whatever is in selectedLocation already
      if (hasCoordinates) {
        setLat(String(selectedLocation.lat));
        setLng(String(selectedLocation.lng));
        setAddress(selectedLocation.displayName);
        toast.info('Using your selected location.');
      } else {
        toast.error(result.error || 'Could not detect location. Enter address manually.');
      }
    }
    setLocating(false);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Evidence must be a JPEG, PNG, or WebP image.');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo size exceeds 5MB limit.");
      e.target.value = '';
      return;
    }

    setPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error("Please provide a description of the issue.");
      return;
    }

    setSubmitting(true);
    const isOnline = navigator.onLine;

    // Offline queue
    if (!isOnline) {
      const offlineReport = {
        category,
        description,
        lat,
        lng,
        address,
        photoBase64: photoPreview,
        photoName: photo ? photo.name : 'issue_photo.jpg',
        timestamp: new Date().toISOString()
      };

      const queue = JSON.parse(localStorage.getItem('sb_offline_reports') || '[]');
      queue.push(offlineReport);
      localStorage.setItem('sb_offline_reports', JSON.stringify(queue));
      setOfflineQueueCount(queue.length);

      setSubmitting(false);
      resetForm();
      toast.info('Saved on this device only. This report has not been submitted to Smart Bharat or a government portal.');
      return;
    }

    // Online submission
    const formData = new FormData();
    formData.append('category', category);
    formData.append('description', description);
    if (photo) {
      formData.append('photo', photo);
    }
    formData.append('lat', lat);
    formData.append('lng', lng);
    formData.append('address', address);

    try {
      const res = await axios.post('/api/complaints/report', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 3000
      });

      if (res.data.success && res.data.complaint?.complaintId) {
        setSubmittedComplaint(res.data.complaint);
        toast.success(`Smart Bharat complaint ${res.data.complaint.complaintId} was received.`);
        if (refetchProfile) {
          try {
            await refetchProfile();
          } catch (refreshError) {
            console.error('Complaint was received, but the profile refresh failed:', refreshError);
          }
        }
        resetForm();
      } else {
        throw new Error('The server did not confirm receipt. Your report has not been registered.');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission could not be confirmed. Check your tracker before trying again; your entries remain in the form.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setDescription('');
    setPhoto(null);
    setPhotoPreview('');
    setLat('');
    setLng('');
    setAddress('');
  };

  // Offline Sync
  const handleSyncOffline = async () => {
    if (!navigator.onLine) {
      toast.error("Cannot sync: device is offline.");
      return;
    }

    setSyncingOffline(true);
    const queue = JSON.parse(localStorage.getItem('sb_offline_reports') || '[]');
    const remainingQueue = [];
    let syncedCount = 0;

    for (const report of queue) {
      const formData = new FormData();
      formData.append('category', report.category);
      formData.append('description', report.description);
      formData.append('lat', report.lat);
      formData.append('lng', report.lng);
      formData.append('address', report.address);

      if (report.photoBase64) {
        try {
          const resBlob = await fetch(report.photoBase64);
          const blob = await resBlob.blob();
          formData.append('photo', blob, report.photoName);
        } catch (error) {
          console.error('Could not restore a queued report image:', error);
          remainingQueue.push(report);
          continue;
        }
      }

      try {
        const response = await axios.post('/api/complaints/report', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response.data.success && response.data.complaint?.complaintId) {
          syncedCount++;
        } else {
          remainingQueue.push(report);
        }
      } catch (error) {
        remainingQueue.push(report);
      }
    }

    localStorage.setItem('sb_offline_reports', JSON.stringify(remainingQueue));
    setOfflineQueueCount(remainingQueue.length);
    setSyncingOffline(false);
    if (syncedCount) {
      toast.success(`${syncedCount} queued report(s) received by Smart Bharat.`);
      if (refetchProfile) {
        try {
          await refetchProfile();
        } catch (error) {
          console.error('Could not refresh the account after report synchronization:', error);
        }
      }
    }
    if (remainingQueue.length) {
      toast.error(`${remainingQueue.length} report(s) remain on this device and were not submitted.`);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12 max-w-4xl mx-auto">
      
      {/* Page Header */}
      <PageHeader
        title="Report Civic Issue"
        description="Prepare a civic issue report, optionally send it to Smart Bharat for internal tracking, or continue to the recommended official grievance portal."
        icon={AlertTriangle}
        badge="Multi-Step Wizard"
        actions={routingInfo?.url && (
          <a
            href={routingInfo.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" icon={ExternalLink}>
              Open {routingInfo.portal || 'suggested grievance portal'}
            </Button>
          </a>
        )}
      />

      {/* Offline Sync Banner Alerts */}
      {offlineQueueCount > 0 && (
        <Alert variant="warning" title={`${offlineQueueCount} Offline Reports Pending Sync`}>
          <div className="flex items-center justify-between gap-4 mt-1">
            <span>These drafts are stored only on this device and have not been submitted. Sync sends them to Smart Bharat after you sign in.</span>
            <Button variant="saffron" size="sm" onClick={handleSyncOffline} isLoading={syncingOffline}>
              <RefreshCw size={14} className={syncingOffline ? 'animate-spin' : ''} /> Sync Queue
            </Button>
          </div>
        </Alert>
      )}

      {/* Step Indicator Navigation Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          {[
            { step: 1, label: 'Category' },
            { step: 2, label: 'Location' },
            { step: 3, label: 'Evidence' },
            { step: 4, label: 'Description' },
            { step: 5, label: 'Review' }
          ].map((s) => {
            const isCurrent = currentStep === s.step;
            const isDone = currentStep > s.step;
            return (
              <div 
                key={s.step} 
                onClick={() => isDone && setCurrentStep(s.step)}
                className={`flex items-center gap-2 cursor-pointer transition-all ${
                  isCurrent ? 'text-saffron-500 font-extrabold' : isDone ? 'text-navy-800 dark:text-slate-200 font-bold' : 'text-slate-400 font-medium'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${
                  isCurrent ? 'bg-saffron-500 text-white shadow-md' : isDone ? 'bg-navy-800 dark:bg-navy-700 text-white' : 'bg-slate-100 dark:bg-navy-950 text-slate-400'
                }`}>
                  {isDone ? <Check size={14} /> : s.step}
                </div>
                <span className="hidden sm:inline text-xs">{s.label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Step Contents */}
      <Card>
        
        {/* Step 1: Select Category */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold font-outfit text-navy-800 dark:text-white">Step 1: Select Issue Category</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Choose the category that best describes the municipal problem.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categoryOptions.map((opt) => {
                const selected = category === opt.value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => setCategory(opt.value)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selected
                        ? 'border-saffron-500 bg-saffron-500/10 dark:bg-saffron-500/15 shadow-sm'
                        : 'border-slate-200 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-950/40 hover:border-slate-300 dark:hover:border-navy-700'
                    }`}
                  >
                    <p className="text-sm font-bold text-navy-800 dark:text-white">{opt.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{opt.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Smart Routing Hint */}
            {routingInfo && (
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 space-y-2">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  <Info size={13} /> Suggested external portal for "{category}"
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                    {routingInfo.portal || routingInfo.department}
                </p>
                  {routingInfo.department && (
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Suggested department: <strong>{routingInfo.department}</strong>
                    </p>
                  )}
                  {routingInfo.note && (
                    <p className="text-xs text-blue-600 dark:text-blue-400">{routingInfo.note}</p>
                  )}
                {routingInfo.helpline && (
                  <p className="text-xs text-blue-500 dark:text-blue-400">
                    Helpline: <strong>{routingInfo.helpline}</strong>
                  </p>
                )}
                {routingInfo.url && (
                  <a
                    href={routingInfo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-blue-300 hover:underline"
                  >
                    <ExternalLink size={11} /> Open Suggested Portal
                  </a>
                )}
                <p className="text-[11px] text-blue-600 dark:text-blue-400">
                  Catalog routing suggestion only; verify the authority and portal before filing. This link opens the authority's website; Smart Bharat does not submit your report or transfer its attachments there.
                </p>
              </div>
            )}
            {!routingInfo && (
              <Alert variant="warning" title="Confirm the responsible authority">
                A state- and category-specific grievance destination is not configured for this location. Contact your municipal/local authority or use the official state grievance directory; CPGRAMS is intended for eligible central-government grievances, not every local civic issue.
              </Alert>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-150 dark:border-navy-800">
              <Button variant="saffron" icon={ChevronRight} iconPosition="right" onClick={() => setCurrentStep(2)}>
                Next: Location
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold font-outfit text-navy-800 dark:text-white">Step 2: Tag Incident Location</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pin your exact browser GPS coordinates or enter manual address details.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <p className="text-xs font-bold text-navy-800 dark:text-white flex items-center gap-1.5">
                    <MapPin size={16} className="text-saffron-500" /> Automatic GPS Geolocation
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Detect current latitude and longitude using browser location permissions.</p>
                </div>
                <Button variant="outline" size="sm" onClick={handlePinLocation} isLoading={locating}>
                  Pin GPS Location
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Latitude" value={lat} readOnly placeholder="28.613912" />
                <Input label="Longitude" value={lng} readOnly placeholder="77.209012" />
              </div>
            </div>

            <Input 
              label="Manual Landmark / Street Address" 
              value={address} 
              onChange={(e) => setAddress(e.target.value)}
              placeholder={`e.g. Near Hanuman Mandir, ${selectedLocation?.city || 'your area'}, Ward No. 5`}
              hint="Provide specific landmarks to help municipal teams identify the spot."
            />

            <div className="flex justify-between pt-4 border-t border-slate-150 dark:border-navy-800">
              <Button variant="ghost" icon={ChevronLeft} onClick={() => setCurrentStep(1)}>
                Back
              </Button>
              <Button variant="saffron" icon={ChevronRight} iconPosition="right" onClick={() => setCurrentStep(3)}>
                Next: Evidence Photo
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Evidence Photo */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold font-outfit text-navy-800 dark:text-white">Step 3: Upload Photo Evidence</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Attach a clear photo as evidence. Automated category and priority suggestions are not an official assessment.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="border-2 border-dashed border-slate-300 dark:border-navy-700 rounded-2xl p-8 text-center bg-slate-50/50 dark:bg-navy-950/20 hover:border-saffron-500 transition-colors flex flex-col items-center justify-center">
                <UploadCloud size={36} className="text-slate-400 mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  <label className="text-saffron-500 hover:underline cursor-pointer">
                    Browse File
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  </label>
                  &nbsp;or drag image here
                </p>
                <p className="text-[10px] text-slate-400 mt-1">JPG, PNG up to 5MB</p>
              </div>

              <div className="h-44 rounded-2xl border border-slate-200 dark:border-navy-800 overflow-hidden bg-slate-100 dark:bg-navy-950 flex items-center justify-center">
                {photoPreview ? (
                  <img src={photoPreview} alt="Evidence preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Camera size={18} /> Evidence Photo Preview
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-150 dark:border-navy-800">
              <Button variant="ghost" icon={ChevronLeft} onClick={() => setCurrentStep(2)}>
                Back
              </Button>
              <Button variant="saffron" icon={ChevronRight} iconPosition="right" onClick={() => setCurrentStep(4)}>
                Next: Description
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Description */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold font-outfit text-navy-800 dark:text-white">Step 4: Describe the Civic Issue</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Explain the problem clearly to assist AI priority detection.</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Detailed Description
              </label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the problem in detail (e.g. 'Deep 2-foot pothole on the main bus route causing severe traffic congestion and near-accidents during rain...')"
                className="w-full p-4 rounded-xl border border-slate-250 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-500/50 focus:border-saffron-500"
              />
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-150 dark:border-navy-800">
              <Button variant="ghost" icon={ChevronLeft} onClick={() => setCurrentStep(3)}>
                Back
              </Button>
              <Button 
                variant="saffron" 
                icon={ChevronRight} 
                iconPosition="right" 
                onClick={() => {
                  if (!description.trim()) {
                    toast.error("Please enter a description first.");
                    return;
                  }
                  setCurrentStep(5);
                }}
              >
                Next: Review & Submit
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Review & Confirmation */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold font-outfit text-navy-800 dark:text-white">Step 5: Review Report Details</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review your details before sending this internal Smart Bharat report. It is not a government grievance submission.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Category</span>
                  <span className="text-sm font-bold text-navy-800 dark:text-white">{category}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Location</span>
                  <span className="text-slate-800 dark:text-slate-200">{address || 'GPS Coordinates Tagged'}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px] mb-1">Description</span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic bg-white dark:bg-navy-900 p-3 rounded-xl border border-slate-200 dark:border-navy-800">
                  "{description}"
                </p>
              </div>

              {photoPreview && (
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px] mb-2">Evidence Attached</span>
                  <img src={photoPreview} alt="Evidence" className="h-28 rounded-xl object-cover border border-slate-200 dark:border-navy-800" />
                </div>
              )}
            </div>

            <Alert variant="info" title="Submission destination">
              This creates an internal Smart Bharat tracking record only. Use the suggested external portal separately to file a government grievance.
            </Alert>

            <div className="flex justify-between pt-4 border-t border-slate-150 dark:border-navy-800">
              <Button variant="ghost" icon={ChevronLeft} onClick={() => setCurrentStep(4)} isDisabled={submitting}>
                Back
              </Button>
              <Button variant="saffron" size="lg" onClick={handleSubmit} isLoading={submitting}>
                Submit to Smart Bharat
              </Button>
            </div>
          </div>
        )}

      </Card>

      {/* Confirmation Modal */}
      {submittedComplaint && (
        <Modal
          isOpen={!!submittedComplaint}
          onClose={() => setSubmittedComplaint(null)}
          title="Smart Bharat report received"
          subtitle="This is an internal Smart Bharat record, not a government grievance submission."
          footer={
            <Button variant="saffron" onClick={() => setSubmittedComplaint(null)}>
              Done
            </Button>
          }
        >
          <div className="space-y-5 text-center py-2">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full mx-auto flex items-center justify-center">
              <ShieldCheck size={36} />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Smart Bharat Reference</p>
              <p className="text-2xl font-extrabold font-mono text-saffron-500">{submittedComplaint.complaintId}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-left">
              <div className="p-3 rounded-lg bg-slate-100 dark:bg-navy-950">
                <span className="text-slate-400 text-[10px] font-bold block">SUGGESTED PRIORITY</span>
                <Badge variant={submittedComplaint.priority === 'High' ? 'danger' : 'warning'}>
                  {submittedComplaint.priority} Priority
                </Badge>
              </div>
              <div className="p-3 rounded-lg bg-slate-100 dark:bg-navy-950">
                <span className="text-slate-400 text-[10px] font-bold block">POINTS EARNED</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">+{submittedComplaint.rewardsEarned || 0}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Internal routing: <strong className="text-navy-800 dark:text-white">{submittedComplaint.department || 'Unassigned'}</strong>
            </p>
          </div>
        </Modal>
      )}

    </div>
  );
}
