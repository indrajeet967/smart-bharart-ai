import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { 
  FileText, ShieldCheck, Lock, UploadCloud, Search, Trash2, Download, 
  ExternalLink, Sparkles, Filter, AlertTriangle, Eye, ShieldAlert 
} from 'lucide-react';
import axios from 'axios';
import Card, { CardHeader, CardTitle, CardBody } from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import SearchBar from '../components/ui/SearchBar';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';

export default function DocumentAssistant() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();

  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Upload Form State
  const [docType, setDocType] = useState('Aadhaar Card');
  const [category, setCategory] = useState('Identity');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [uploading, setUploading] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  // Modal / Action State
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [deleteDocId, setDeleteDocId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Legal Simplifier State
  const [legalText, setLegalText] = useState('');
  const [simplifiedOutput, setSimplifiedOutput] = useState('');
  const [simplifying, setSimplifying] = useState(false);

  const docTypeOptions = [
    { value: 'Aadhaar Card', category: 'Identity' },
    { value: 'PAN Card', category: 'Identity' },
    { value: 'Voter ID Card', category: 'Identity' },
    { value: 'Driving Licence', category: 'Identity' },
    { value: '10th / 12th Marksheet', category: 'Education' },
    { value: 'Degree Certificate', category: 'Education' },
    { value: 'Birth Certificate', category: 'Certificates' },
    { value: 'Income Certificate', category: 'Certificates' },
    { value: 'Ration Card', category: 'Government' },
    { value: 'Other Document', category: 'Other' }
  ];

  // Fetch documents
  const fetchDocuments = async () => {
    if (!profile?.email) return;
    try {
      setLoadingDocs(true);
      const res = await axios.get(`/api/documents/user/${profile.email}`);
      setDocuments(res.data);
    } catch (err) {
      console.warn("Could not load documents:", err);
      toast.error("Failed to load DigiLocker documents.");
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [profile?.email]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit.");
      return;
    }

    setFile(selectedFile);
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please attach a document file.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('documentFile', file);
    formData.append('docType', docType);
    formData.append('category', category);
    formData.append('email', profile?.email || 'guest@gmail.com');

    try {
      const res = await axios.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        toast.success(`Saved "${docType}" to DigiLocker!`);
        setFile(null);
        setFilePreview('');
        fetchDocuments();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDocId) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/documents/${deleteDocId}`);
      toast.success("Document removed from DigiLocker.");
      setDeleteDocId(null);
      fetchDocuments();
    } catch (err) {
      toast.error("Failed to delete document.");
    } finally {
      setDeleting(false);
    }
  };

  const handleSimplifyLegalText = async () => {
    if (!legalText.trim()) {
      toast.error("Please paste legal text or circular content first.");
      return;
    }

    setSimplifying(true);
    try {
      const res = await axios.post('/api/documents/simplify', { legalText });
      setSimplifiedOutput(res.data.simplifiedText);
      toast.success("Legal text simplified into plain language!");
    } catch (err) {
      toast.error("Failed to simplify document text.");
    } finally {
      setSimplifying(false);
    }
  };

  // Filtered documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesCategory = selectedCategoryFilter === 'All' || doc.category === selectedCategoryFilter;
    const matchesSearch = searchQuery === '' || 
      (doc.docType && doc.docType.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.fileName && doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Page Header */}
      <PageHeader
        title="DigiLocker & Document Vault"
        description="Encrypted government document vault with AI OCR verification and plain-language legal circular simplification."
        icon={Lock}
        badge="256-Bit SSL Encrypted"
      />

      {/* College Project Educational Disclaimer Warning Banner */}
      <Alert variant="warning" title="Educational Project Notice">
        <strong>Important:</strong> This is a college demonstration project. Please do <strong>not</strong> upload real sensitive Aadhaar numbers, PAN cards, OTPs, or passwords. Use sample test files or dummy documents for demonstration.
      </Alert>

      {/* Main Split Layout: Upload & Vault List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload Form (Left Column) */}
        <Card className="lg:col-span-1 space-y-4">
          <CardHeader>
            <CardTitle icon={UploadCloud}>Upload Document</CardTitle>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleUpload} className="space-y-4">
              
              <Select
                label="Document Type"
                value={docType}
                onChange={(e) => {
                  setDocType(e.target.value);
                  const selectedOpt = docTypeOptions.find(o => o.value === e.target.value);
                  if (selectedOpt) setCategory(selectedOpt.category);
                }}
              >
                {docTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.value} ({opt.category})</option>
                ))}
              </Select>

              <Select
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Identity">Identity</option>
                <option value="Education">Education</option>
                <option value="Certificates">Certificates</option>
                <option value="Government">Government</option>
                <option value="Other">Other</option>
              </Select>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Attachment File
                </label>
                <div className="border-2 border-dashed border-slate-300 dark:border-navy-700 rounded-xl p-4 text-center bg-slate-50/50 dark:bg-navy-950/20 hover:border-saffron-500 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                    id="locker-file-input"
                  />
                  <label htmlFor="locker-file-input" className="cursor-pointer text-xs font-bold text-saffron-500 hover:underline">
                    {file ? file.name : "Select PDF / Image (Max 5MB)"}
                  </label>
                </div>
              </div>

              {filePreview && (
                <img src={filePreview} alt="Preview" className="h-28 w-full object-cover rounded-xl border border-slate-200 dark:border-navy-800" />
              )}

              <Button variant="saffron" type="submit" isLoading={uploading} icon={UploadCloud} className="w-full">
                Upload & Verify
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Saved Documents Grid & Filter (Right 2 Columns) */}
        <Card className="lg:col-span-2 space-y-4">
          <CardHeader>
            <CardTitle icon={Lock}>
              My Vault ({filteredDocuments.length})
            </CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            
            {/* Search & Category Filter Header */}
            <div className="flex flex-col sm:flex-row gap-3">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onClear={() => setSearchQuery('')}
                placeholder="Search documents by name..."
                className="flex-1"
              />
              <Select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="sm:w-40"
              >
                <option value="All">All Categories</option>
                <option value="Identity">Identity</option>
                <option value="Education">Education</option>
                <option value="Certificates">Certificates</option>
                <option value="Government">Government</option>
                <option value="Other">Other</option>
              </Select>
            </div>

            {/* Documents Grid */}
            {loadingDocs ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading stored documents...</div>
            ) : filteredDocuments.length === 0 ? (
              <EmptyState
                icon={Lock}
                title="No Documents Found"
                description="Upload your credentials or adjust search filters to view your locker files."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc._id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-950/40 hover:border-slate-300 dark:hover:border-navy-700 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-navy-800 dark:text-white block">{doc.docType}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{doc.fileName}</span>
                      </div>
                      <Badge variant="saffron" size="sm">{doc.category}</Badge>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-150 dark:border-navy-800 text-[10px] text-slate-400">
                      <span>Verified Status: <strong className="text-emerald-600 dark:text-emerald-400">{doc.verificationStatus}</strong></span>
                      <span>{doc.fileSize}</span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedDoc(doc)} icon={Eye}>
                        View
                      </Button>
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" download>
                        <Button variant="outline" size="sm" icon={Download}>
                          Download
                        </Button>
                      </a>
                      <Button variant="danger" size="sm" onClick={() => setDeleteDocId(doc._id)} icon={Trash2} />
                    </div>
                  </div>
                ))}
              </div>
            )}

          </CardBody>
        </Card>

      </div>

      {/* AI Legal Text Simplifier Card */}
      <Card className="space-y-4">
        <CardHeader>
          <CardTitle icon={Sparkles}>AI Legal Circular Simplifier</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Paste Legal Text / Government Circular
            </label>
            <textarea
              rows={4}
              value={legalText}
              onChange={(e) => setLegalText(e.target.value)}
              placeholder="Paste complex legal text, government notifications, or circular clauses here..."
              className="w-full p-4 rounded-xl border border-slate-250 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
            />
          </div>

          <Button variant="saffron" onClick={handleSimplifyLegalText} isLoading={simplifying} icon={Sparkles}>
            Simplify Legal Language
          </Button>

          {simplifiedOutput && (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-2">
              <h4 className="text-xs font-bold text-saffron-500 uppercase tracking-wider">Simplified Summary</h4>
              <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                {simplifiedOutput}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Document Inspector Modal */}
      {selectedDoc && (
        <Modal
          isOpen={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          title={`Inspector: ${selectedDoc.docType}`}
          subtitle={`Uploaded on ${new Date(selectedDoc.uploadedAt).toLocaleDateString()}`}
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Category:</span>
                <span className="font-bold text-navy-800 dark:text-white">{selectedDoc.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Document Number:</span>
                <span className="font-bold font-mono text-saffron-500">{selectedDoc.details?.docNumber || 'SB-DOC-XXXXX'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Holder Name:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{selectedDoc.details?.name || profile?.displayName || 'Citizen'}</span>
              </div>
            </div>

            {selectedDoc.fileUrl && selectedDoc.fileType?.startsWith('image/') && (
              <img src={selectedDoc.fileUrl} alt="Document" className="w-full max-h-60 object-contain rounded-xl border border-slate-200 dark:border-navy-800" />
            )}
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deleteDocId}
        onClose={() => setDeleteDocId(null)}
        onConfirm={handleDelete}
        title="Delete Document from DigiLocker"
        message="Are you sure you want to delete this document? This action cannot be undone."
        confirmText="Delete Document"
        variant="danger"
        isLoading={deleting}
      />

    </div>
  );
}
