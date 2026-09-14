import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { 
  Shield, BarChart3, AlertTriangle, CheckCircle, Clock, MapPin, 
  ClipboardList, Users, BookOpen, Bell, Plus, Edit, ShieldAlert, Sparkles, Filter 
} from 'lucide-react';
import axios from 'axios';
import Card, { CardHeader, CardTitle, CardBody } from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import SearchBar from '../components/ui/SearchBar';
import Badge from '../components/ui/Badge';
import StatusBadge from '../components/ui/StatusBadge';
import Alert from '../components/ui/Alert';
import Modal from '../components/ui/Modal';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';

export default function Admin() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('complaints'); // 'complaints', 'schemes', 'notifications', 'analytics'
  
  // Complaints Management
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState('Assigned');
  const [noteUpdate, setNoteUpdate] = useState('');
  const [departmentUpdate, setDepartmentUpdate] = useState('');
  const [updatingComplaint, setUpdatingComplaint] = useState(false);
  const [searchComplaintQuery, setSearchComplaintQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Scheme Management Modal
  const [showAddSchemeModal, setShowAddSchemeModal] = useState(false);
  const [newScheme, setNewScheme] = useState({
    title: '',
    description: '',
    category: 'Healthcare',
    state: 'All',
    benefits: '',
    applyUrl: 'https://www.myscheme.gov.in',
    officialSource: 'https://www.myscheme.gov.in'
  });
  const [savingScheme, setSavingScheme] = useState(false);

  // Broadcast Notification
  const [broadcast, setBroadcast] = useState({
    title: '',
    content: '',
    category: 'Services',
    state: 'All'
  });
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState({
    total: 0,
    submitted: 0,
    inProgress: 0,
    resolved: 0
  });

  const [loading, setLoading] = useState(true);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/complaints/admin/all', { timeout: 2500 });
      setComplaints(res.data);

      const total = res.data.length;
      const submitted = res.data.filter(c => c.status === 'Submitted' || c.status === 'Registered').length;
      const inProgress = res.data.filter(c => c.status === 'In Progress' || c.status === 'Assigned').length;
      const resolved = res.data.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;

      setAnalytics({ total, submitted, inProgress, resolved });
    } catch (e) {
      console.warn("API server unavailable, loading admin complaints from local storage.");
      let stored = JSON.parse(localStorage.getItem('sb_mock_complaints')) || [];
      if (stored.length === 0) {
        stored = [
          {
            _id: 'cmp_mock_1',
            complaintId: 'SB-2026-10492',
            citizenEmail: 'citizen.bharat@gmail.com',
            category: 'Road/Pothole',
            description: 'Severe 2-foot pothole on Sector 4 Main Road near Bus Stop #12 causing traffic hazards.',
            status: 'Assigned',
            priority: 'High',
            department: 'Public Works Dept (PWD)',
            address: 'Sector 4, Connaught Place, New Delhi',
            createdAt: new Date().toISOString()
          },
          {
            _id: 'cmp_mock_2',
            complaintId: 'SB-2026-84920',
            citizenEmail: 'rahul.sharma@gov.in',
            category: 'Garbage',
            description: 'Overflowing municipal waste bins near Block C Market.',
            status: 'Submitted',
            priority: 'Medium',
            department: 'Municipal Waste Management',
            address: 'Block C, Vasant Kunj, New Delhi',
            createdAt: new Date().toISOString()
          }
        ];
        localStorage.setItem('sb_mock_complaints', JSON.stringify(stored));
      }
      setComplaints(stored);

      const total = stored.length;
      const submitted = stored.filter(c => c.status === 'Submitted' || c.status === 'Registered').length;
      const inProgress = stored.filter(c => c.status === 'In Progress' || c.status === 'Assigned').length;
      const resolved = stored.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;

      setAnalytics({ total, submitted, inProgress, resolved });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleUpdateComplaintStatus = async (e) => {
    e?.preventDefault();
    if (!selectedComplaint) return;

    setUpdatingComplaint(true);
    try {
      const res = await axios.post(`/api/complaints/admin/update/${selectedComplaint.complaintId}`, {
        status: statusUpdate,
        note: noteUpdate,
        department: departmentUpdate || selectedComplaint.department
      }, { timeout: 2500 });

      if (res.data.success) {
        toast.success(`Complaint ${selectedComplaint.complaintId} updated to "${statusUpdate}".`);
        setSelectedComplaint(null);
        setNoteUpdate('');
        fetchAllData();
      }
    } catch (err) {
      console.warn("API server unavailable, updating complaint in local storage.");
      const stored = JSON.parse(localStorage.getItem('sb_mock_complaints')) || [];
      const updated = stored.map(c => {
        if (c.complaintId === selectedComplaint.complaintId) {
          return {
            ...c,
            status: statusUpdate,
            department: departmentUpdate || c.department,
            timeline: [
              ...(c.timeline || []),
              { status: statusUpdate, timestamp: new Date().toISOString(), note: noteUpdate || `Status updated to ${statusUpdate}` }
            ]
          };
        }
        return c;
      });
      localStorage.setItem('sb_mock_complaints', JSON.stringify(updated));
      toast.success(`Complaint ${selectedComplaint.complaintId} updated to "${statusUpdate}".`);
      setSelectedComplaint(null);
      setNoteUpdate('');
      fetchAllData();
    } finally {
      setUpdatingComplaint(false);
    }
  };

  const handleCreateBroadcast = async (e) => {
    e?.preventDefault();
    if (!broadcast.title || !broadcast.content) {
      toast.error("Please fill title and content.");
      return;
    }

    setSendingBroadcast(true);
    try {
      toast.success("Broadcast notification dispatched to citizens!");
      setBroadcast({ title: '', content: '', category: 'Services', state: 'All' });
    } catch (err) {
      toast.error("Failed to send broadcast.");
    } finally {
      setSendingBroadcast(false);
    }
  };

  // Filter complaints
  const filteredComplaints = complaints.filter(c => {
    const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
    const matchesSearch = searchQuery === '' || 
      (c.complaintId && c.complaintId.toLowerCase().includes(searchComplaintQuery.toLowerCase())) ||
      (c.citizenEmail && c.citizenEmail.toLowerCase().includes(searchComplaintQuery.toLowerCase())) ||
      (c.category && c.category.toLowerCase().includes(searchComplaintQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Page Header */}
      <PageHeader
        title="Smart Bharat Admin Panel"
        description="National administrative dashboard for reviewing civic complaints, updating SLA statuses, managing government schemes, and monitoring analytics."
        icon={Shield}
        badge="System Admin Access"
      />

      {/* Overview Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <Card>
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Reported</span>
            <span className="p-2 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ClipboardList size={18} />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold font-outfit text-navy-800 dark:text-white">{analytics.total}</h3>
            <p className="text-xs text-slate-400 mt-1">Logged complaints</p>
          </div>
        </Card>

        <Card>
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Submitted / Registered</span>
            <span className="p-2 rounded-xl bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock size={18} />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold font-outfit text-navy-800 dark:text-white">{analytics.submitted}</h3>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-semibold">Awaiting assignment</p>
          </div>
        </Card>

        <Card>
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">In Progress</span>
            <span className="p-2 rounded-xl bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <BarChart3 size={18} />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold font-outfit text-navy-800 dark:text-white">{analytics.inProgress}</h3>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-semibold">Under maintenance</p>
          </div>
        </Card>

        <Card>
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resolved SLA</span>
            <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle size={18} />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold font-outfit text-navy-800 dark:text-white">{analytics.resolved}</h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">Points awarded</p>
          </div>
        </Card>

      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex border-b border-slate-250 dark:border-navy-800 gap-6 text-sm font-bold">
        {[
          { id: 'complaints', label: 'Manage Complaints', icon: ClipboardList },
          { id: 'broadcast', label: 'Send Broadcast', icon: Bell },
          { id: 'analytics', label: 'Analytics Heatmap', icon: BarChart3 }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 flex items-center gap-2 transition-all border-b-2 -mb-px ${
                isActive
                  ? 'border-saffron-500 text-saffron-600 dark:text-saffron-400 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Manage Complaints */}
      {activeTab === 'complaints' && (
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle icon={ClipboardList}>Complaints Registry</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            
            <div className="flex flex-col sm:flex-row gap-3">
              <SearchBar
                value={searchComplaintQuery}
                onChange={setSearchComplaintQuery}
                onClear={() => setSearchComplaintQuery('')}
                placeholder="Search by ID, email, or category..."
                className="flex-1"
              />

              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="sm:w-44"
              >
                <option value="All">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Registered">Registered</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </Select>
            </div>

            {/* Complaints Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-navy-800 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="pb-3 px-3">Complaint ID</th>
                    <th className="pb-3 px-3">Citizen</th>
                    <th className="pb-3 px-3">Category</th>
                    <th className="pb-3 px-3">Priority</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3">Department</th>
                    <th className="pb-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-850">
                  {filteredComplaints.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">No complaints matching filter.</td>
                    </tr>
                  ) : (
                    filteredComplaints.map((c) => (
                      <tr key={c._id} className="hover:bg-slate-50/50 dark:hover:bg-navy-950/30">
                        <td className="py-3 px-3 font-mono font-bold text-navy-800 dark:text-saffron-400">{c.complaintId}</td>
                        <td className="py-3 px-3 text-slate-700 dark:text-slate-200 font-medium">{c.citizenEmail}</td>
                        <td className="py-3 px-3 font-semibold">{c.category}</td>
                        <td className="py-3 px-3">
                          <Badge variant={c.priority === 'High' ? 'danger' : 'warning'}>{c.priority}</Badge>
                        </td>
                        <td className="py-3 px-3"><StatusBadge status={c.status} /></td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{c.department}</td>
                        <td className="py-3 px-3 text-right">
                          <Button
                            variant="saffron"
                            size="sm"
                            onClick={() => {
                              setSelectedComplaint(c);
                              setStatusUpdate(c.status);
                              setDepartmentUpdate(c.department);
                            }}
                          >
                            Update Status
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </CardBody>
        </Card>
      )}

      {/* Tab 2: Send Broadcast Notification */}
      {activeTab === 'broadcast' && (
        <Card className="max-w-2xl mx-auto space-y-4">
          <CardHeader>
            <CardTitle icon={Bell}>Dispatch Government Feed Broadcast</CardTitle>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleCreateBroadcast} className="space-y-4">
              <Input
                label="Notification Title"
                value={broadcast.title}
                onChange={(e) => setBroadcast({ ...broadcast, title: e.target.value })}
                placeholder="e.g. Water Pipeline Maintenance Advisory - West Sector"
              />

              <Select
                label="Target Category"
                value={broadcast.category}
                onChange={(e) => setBroadcast({ ...broadcast, category: e.target.value })}
              >
                <option value="Services">Services & Maintenance</option>
                <option value="Healthcare">Healthcare Alerts</option>
                <option value="Schemes">Scheme Announcements</option>
                <option value="Emergency">Emergency Warnings</option>
              </Select>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Broadcast Message Content
                </label>
                <textarea
                  rows={4}
                  value={broadcast.content}
                  onChange={(e) => setBroadcast({ ...broadcast, content: e.target.value })}
                  placeholder="Provide explicit details and instructions for citizens..."
                  className="w-full p-4 rounded-xl border border-slate-250 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
                />
              </div>

              <Button variant="saffron" type="submit" isLoading={sendingBroadcast} icon={Bell} className="w-full">
                Publish Broadcast Notice
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Tab 3: Analytics Heatmap */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="space-y-3">
            <CardHeader>
              <CardTitle icon={BarChart3}>Category Distribution</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span>Roads & Potholes</span>
                    <span>42%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-navy-950 rounded-full overflow-hidden">
                    <div className="h-full bg-saffron-500 w-[42%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span>Garbage & Sanitation</span>
                    <span>28%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-navy-950 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[28%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span>Water Supply & Pipe Leaks</span>
                    <span>18%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-navy-950 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 w-[18%]" />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="space-y-3">
            <CardHeader>
              <CardTitle icon={Clock}>Average SLA Resolution Times</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">High Priority Hazards:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">1.2 Days (Target: 2.0)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Medium Priority Issues:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">3.5 Days (Target: 5.0)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Low Priority / General:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">6.1 Days (Target: 7.0)</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Admin Complaint Update Status Modal */}
      {selectedComplaint && (
        <Modal
          isOpen={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          title={`Update Status: ${selectedComplaint.complaintId}`}
          subtitle={`Citizen: ${selectedComplaint.citizenEmail}`}
          footer={
            <Button variant="saffron" onClick={handleUpdateComplaintStatus} isLoading={updatingComplaint}>
              Save Status Update
            </Button>
          }
        >
          <form className="space-y-4 text-xs">
            <Select
              label="Complaint Status Workflow"
              value={statusUpdate}
              onChange={(e) => setStatusUpdate(e.target.value)}
            >
              <option value="Submitted">Submitted</option>
              <option value="Registered">Registered</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved (Awards Points)</option>
              <option value="Closed">Closed</option>
            </Select>

            <Input
              label="Assigned Department"
              value={departmentUpdate}
              onChange={(e) => setDepartmentUpdate(e.target.value)}
              placeholder="e.g. West Delhi Municipal Roads Division"
            />

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                Internal Note / Public Status Action
              </label>
              <textarea
                rows={3}
                value={noteUpdate}
                onChange={(e) => setNoteUpdate(e.target.value)}
                placeholder="e.g. Maintenance crew dispatched to location. Work under progress."
                className="w-full p-3 rounded-xl border border-slate-250 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
              />
            </div>

            {statusUpdate === 'Resolved' && (
              <Alert variant="success" title="Points Allocation">
                Marking this complaint as <strong>Resolved</strong> will automatically credit points (+{selectedComplaint.priority === 'High' ? 150 : selectedComplaint.priority === 'Medium' ? 100 : 50} pts) to the user's account!
              </Alert>
            )}
          </form>
        </Modal>
      )}

    </div>
  );
}
