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
import { DOCUMENT_SERVICES } from '../data/governmentKnowledge';

export default function DocumentAssistant() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();

  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [documentError, setDocumentError] = useState('');

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
    try {
      setLoadingDocs(true);
      setDocumentError('');
      const res = await axios.get(`/api/documents/user/${profile?.email || 'guest@gmail.com'}`, { timeout: 2500 });
      setDocuments(res.data);
    } catch (err) {
      setDocuments([]);
      setDocumentError(err.response?.data?.error || 'Your private vault could not be loaded.');
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

    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(selectedFile.type)) {
      toast.error('Choose a PDF, JPEG, PNG, or WebP file.');
      e.target.value = '';
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit.");
      e.target.value = '';
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

    try {
      const res = await axios.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 3000
      });

      if (res.data.success) {
        toast.success(`Saved "${docType}" in your Smart Bharat vault. It was not sent to official DigiLocker.`);
        setFile(null);
        setFilePreview('');
        await fetchDocuments();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed. Your document was not saved.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDocId) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/documents/${deleteDocId}`, { timeout: 2500 });
      toast.success("Document removed from your Smart Bharat vault.");
      setDeleteDocId(null);
      await fetchDocuments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'The document could not be deleted.');
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
      const res = await axios.post('/api/documents/simplify', { legalText }, { timeout: 3000 });
      setSimplifiedOutput(res.data.simplifiedText);
      toast.success("Legal text simplified into plain language!");
    } catch (err) {
      toast.error(err.response?.data?.error || 'The legal text could not be simplified.');
    } finally {
      setSimplifying(false);
    }
  };

  const documentKnowledgeBase = DOCUMENT_SERVICES.map((service) => ({
    id: service.id,
    title: service.name,
    icon: '??',
    officialUrl: service.applyUrl || service.officialWebsite || service.source || '',
    overview: service.who || 'See the linked official source for service details.',
    sections: {
      'Eligibility': service.eligibility || 'Not specified in this catalog; confirm with the responsible authority.',
      'Required documents': service.requiredDocuments?.join('\n') || 'Not specified in this catalog; check the official portal.',
      'How to apply': service.process?.map((step, index) => `${index + 1}. ${step}`).join('\n') || 'Check the official portal for current instructions.',
      'Fees and processing time': 'Not verified in this catalog. Confirm current fees and timelines with the responsible authority.',
      'Helpline and source': [service.helpline, service.source].filter(Boolean).join('\n') || 'No official contact or source link is listed.'
    }
  }));

  const [selectedDocKb, setSelectedDocKb] = useState(documentKnowledgeBase[0]);
  const [selectedSubSectionKey, setSelectedSubSectionKey] = useState('Eligibility');

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
        title="Smart Bharat Document Vault"
        description="Private storage for supported deployments, plus a searchable guide to citizen documents. This is separate from official DigiLocker."
        icon={Lock}
        badge="Not an official DigiLocker integration"
      />

      {/* ONE-TAP DOCUMENT KNOWLEDGE SYSTEM */}
      <Card className="border-2 border-saffron-500/30 bg-slate-50/50 dark:bg-navy-950/40 space-y-6">
        <CardHeader>
          <CardTitle icon={Sparkles}>One-Tap Government Document Knowledge System</CardTitle>
          <Badge variant="saffron">Shared service catalog</Badge>
        </CardHeader>

        <CardBody className="space-y-6">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select an entry to review the available guidance and source link. Catalog details are not live-verified; confirm current requirements with the responsible authority before applying.
          </p>

          {/* Document Pills/Grid displaying all 19 documents with dark/bold font */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 max-h-64 overflow-y-auto pr-1">
            {documentKnowledgeBase.map((docItem) => {
              const isSelected = selectedDocKb.id === docItem.id;
              return (
                <button
                  key={docItem.id}
                  onClick={() => {
                    setSelectedDocKb(docItem);
                    const firstSectionKey = Object.keys(docItem.sections)[0];
                    setSelectedSubSectionKey(firstSectionKey);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-saffron-500 text-white border-saffron-500 shadow-md font-extrabold'
                      : 'bg-white dark:bg-navy-900 text-slate-900 dark:text-white border-slate-200 dark:border-navy-800 hover:border-saffron-400 font-bold hover:bg-slate-50 dark:hover:bg-navy-850'
                  }`}
                >
                  <span className="text-lg">{docItem.icon}</span>
                  <span className="text-xs font-extrabold font-outfit truncate">{docItem.title}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Document Details & Sub-Section Filtering Display */}
          {selectedDocKb && (
            <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-lg space-y-5 animate-scale-up">

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-150 dark:border-navy-800 pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedDocKb.icon}</span>
                  <div>
                    <h3 className="text-lg font-extrabold font-outfit text-navy-800 dark:text-white">{selectedDocKb.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{selectedDocKb.overview}</p>
                  </div>
                </div>

                {selectedDocKb.officialUrl ? (
                  <a
                    href={selectedDocKb.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    <Button variant="saffron" size="sm" icon={ExternalLink}>
                      Listed Service Portal
                    </Button>
                  </a>
                ) : (
                  <span className="text-xs text-slate-500">No portal link is available in this catalog.</span>
                )}
              </div>

              {/* Clickable Sub-Section Buttons */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Click a section to filter details:
                </span>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(selectedDocKb.sections).map((secKey) => {
                    const isSecSelected = selectedSubSectionKey === secKey;
                    return (
                      <button
                        key={secKey}
                        onClick={() => setSelectedSubSectionKey(secKey)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          isSecSelected
                            ? 'bg-navy-800 text-white border-navy-800 shadow-sm'
                            : 'bg-slate-100 dark:bg-navy-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-navy-800 hover:border-navy-700'
                        }`}
                      >
                        {secKey}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Sub-Section Content Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-2">
                <h4 className="text-xs font-extrabold font-outfit text-saffron-600 dark:text-saffron-400 uppercase tracking-wider flex items-center gap-2">
                  <span>▶</span> {selectedSubSectionKey}
                </h4>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-line">
                  {selectedDocKb.sections[selectedSubSectionKey] || selectedDocKb.sections[Object.keys(selectedDocKb.sections)[0]]}
                </p>
              </div>

            </div>
          )}

        </CardBody>
      </Card>

      <Alert variant="info" title="Official DigiLocker service">
        Smart Bharat is not integrated with or operated by DigiLocker. For issued digital documents, use the official
        {' '}<a href="https://www.digilocker.gov.in/" target="_blank" rel="noopener noreferrer" className="font-bold underline">DigiLocker website</a>.
        Smart Bharat uploads are not authenticity-checked.
      </Alert>

      {/* College Project Educational Disclaimer Warning Banner */}
      <Alert variant="warning" title="Educational Project Notice">
        <strong>Important:</strong> This demonstration vault is separate from DigiLocker. Do not upload sensitive identity documents unless you trust and have confirmed the backend storage configuration.
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
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
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
                Save to Smart Bharat Vault
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

            {documentError && <Alert variant="error" title="Vault unavailable">{documentError}</Alert>}

            {/* Documents Grid */}
            {loadingDocs ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading stored documents...</div>
            ) : filteredDocuments.length === 0 ? (
              <EmptyState
                icon={Lock}
                title="No Documents Found"
                description="No documents are stored in your Smart Bharat vault yet, or the current search has no matches."
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
                      <span>Authenticity: <strong className="text-slate-500">{doc.verificationStatus || 'Not verified'}</strong></span>
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
                <span className="font-bold font-mono text-saffron-500">{selectedDoc.details?.docNumber || 'Not captured'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Holder Name:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{selectedDoc.details?.name || 'Not captured; authenticity not verified'}</span>
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
        title="Delete from Smart Bharat Vault"
        message="Delete this private copy from the Smart Bharat vault? This does not affect a document in official DigiLocker."
        confirmText="Delete Document"
        variant="danger"
        isLoading={deleting}
      />

    </div>
  );
}
