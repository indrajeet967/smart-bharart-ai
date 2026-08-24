import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Lock, FileText, CheckCircle2, ShieldAlert, Sparkles, UploadCloud, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function DocumentAssistant() {
  const { profile } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('locker'); // 'locker' or 'simplifier'

  // Locker state
  const [documents, setDocuments] = useState([]);
  const [uploadDocType, setUploadDocType] = useState('Aadhaar Card');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [ocrDetails, setOcrDetails] = useState(null);

  // Legal simplifier state
  const [legalText, setLegalText] = useState('');
  const [simplifying, setSimplifying] = useState(false);
  const [simplifiedOutput, setSimplifiedOutput] = useState('');

  // Fetch user locker files
  const fetchLockerDocs = async () => {
    if (!profile?.email) return;
    try {
      const res = await axios.get(`/api/documents/user/${profile.email}`);
      setDocuments(res.data);
    } catch (e) {
      console.warn("Could not retrieve locker files, loading fallback mocks.");
      // Fallback local list
      setDocuments([
        {
          _id: 'doc_mock_1',
          docType: 'Aadhaar Card',
          fileName: 'aadhaar_front.jpg',
          fileUrl: '#',
          verificationStatus: 'Verified (Mock Mode)',
          details: { docNumber: 'XXXX-XXXX-8924', name: profile?.displayName || 'Citizen Name' },
          uploadedAt: new Date().toISOString()
        }
      ]);
    }
  };

  useEffect(() => {
    fetchLockerDocs();
  }, [profile?.email]);

  const handleLockerSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    setOcrDetails(null);

    const formData = new FormData();
    formData.append('documentFile', uploadFile);
    formData.append('email', profile?.email || 'guest@gmail.com');
    formData.append('docType', uploadDocType);

    try {
      const res = await axios.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.success) {
        setOcrDetails(res.data.document);
        // Refresh list
        fetchLockerDocs();
        setUploadFile(null);
      }
    } catch (err) {
      console.error(err);
      alert("Verification Upload failed. Verify Gemini credentials.");
    } finally {
      setUploading(false);
    }
  };

  const handleSimplifySubmit = async (e) => {
    e.preventDefault();
    if (!legalText.trim()) return;

    setSimplifying(true);
    setSimplifiedOutput('');

    try {
      const res = await axios.post('/api/documents/simplify', { legalText });
      setSimplifiedOutput(res.data.simplifiedText);
    } catch (err) {
      console.error(err);
      setSimplifiedOutput("❌ Failed to contact legal simplify service.");
    } finally {
      setSimplifying(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold font-outfit text-navy-800 dark:text-white flex items-center gap-2">
          <Lock className="text-saffron-500" />
          AI Digital Locker & Document Suite
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          Store important credentials securely, run auto-verification checks, and simplify complicated legal circulars using conversational AI.
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 dark:border-navy-800 max-w-md">
        <button
          onClick={() => setActiveTab('locker')}
          className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-all ${
            activeTab === 'locker'
              ? 'border-saffron-500 text-saffron-500'
              : 'border-transparent text-slate-450 dark:text-slate-500 hover:text-slate-655'
          }`}
        >
          🔒 Digital Locker
        </button>
        <button
          onClick={() => setActiveTab('simplifier')}
          className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-all ${
            activeTab === 'simplifier'
              ? 'border-saffron-500 text-saffron-500'
              : 'border-transparent text-slate-450 dark:text-slate-500 hover:text-slate-655'
          }`}
        >
          ⚖️ Legal Jargon Simplifier
        </button>
      </div>

      {/* Content wrapper */}
      {activeTab === 'locker' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          
          {/* Locker Upload Card (1 column) */}
          <div className="lg:col-span-1 glass bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl shadow-sm p-6 space-y-4 h-fit">
            <h3 className="text-base font-bold font-outfit text-navy-800 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-navy-800 pb-2">
              <UploadCloud size={18} className="text-saffron-500" /> Verify & Store ID
            </h3>

            <form onSubmit={handleLockerSubmit} className="space-y-4 text-xs font-semibold text-slate-500">
              <div className="space-y-1">
                <label className="uppercase tracking-wider">Document Type</label>
                <select
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-navy-800 rounded-lg bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-saffron-500 font-bold"
                >
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Driving Licence">Driving Licence</option>
                  <option value="Voter ID Card">Voter ID Card</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="uppercase tracking-wider">Select File</label>
                <div className="border-2 border-dashed border-slate-200 dark:border-navy-850 rounded-xl p-4 text-center cursor-pointer hover:border-saffron-500 bg-slate-50/50 dark:bg-navy-950/20 relative flex flex-col items-center">
                  <FileText size={24} className="text-slate-400 mb-1" />
                  <span className="text-[10px] text-slate-500 font-bold">
                    {uploadFile ? uploadFile.name : 'Choose JPG/PNG/PDF'}
                  </span>
                  <input
                    type="file"
                    required
                    accept="image/*,application/pdf"
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-2 bg-navy-800 dark:bg-saffron-500 hover:bg-navy-900 dark:hover:bg-saffron-600 text-white font-bold rounded-lg shadow text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {uploading ? (
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>OCR Verifying...</span>
                  </div>
                ) : (
                  <>Upload & Run OCR</>
                )}
              </button>
            </form>

            {/* OCR Success Panel */}
            {ocrDetails && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 rounded-2xl space-y-3 animate-scale-up">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                  <CheckCircle2 size={16} /> Verified Document
                </div>
                <div className="text-[10px] font-semibold text-slate-500 space-y-1">
                  <p>NAME EXTRACTED: <span className="text-slate-800 dark:text-white font-bold">{ocrDetails.details?.name}</span></p>
                  <p>NUMBER EXTRACTED: <span className="text-slate-850 dark:text-white font-bold font-mono">{ocrDetails.details?.docNumber}</span></p>
                  <p>OCR STATUS: <span className="text-emerald-600 font-bold">{ocrDetails.verificationStatus}</span></p>
                </div>
              </div>
            )}
          </div>

          {/* Secure cabinet files grid (Right 2 columns) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-base font-bold font-outfit text-navy-800 dark:text-white flex items-center gap-2">
              Verified Documents Cabinet ({documents.length})
            </h3>

            {documents.length === 0 ? (
              <div className="p-8 text-center glass bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800">
                <p className="text-sm font-semibold text-slate-450">Locker is empty. Upload your identity cards on the left.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {documents.map((doc) => (
                  <div key={doc._id} className="p-5 rounded-2xl glass bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 hover-card-trigger flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] bg-slate-100 dark:bg-navy-950 px-2 py-0.5 rounded font-bold text-slate-500 tracking-wider">
                          {doc.docType}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          doc.verificationStatus.includes('Verified') 
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50' 
                            : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200/50'
                        }`}>
                          {doc.verificationStatus}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{doc.fileName}</p>
                        <p className="text-[9px] text-slate-400">Uploaded on: {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                      </div>
                      
                      <div className="p-2.5 bg-slate-50 dark:bg-navy-950 rounded-xl space-y-1 text-[10px] text-slate-500 font-semibold border border-slate-150 dark:border-navy-850">
                        <p>ID: <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">{doc.details?.docNumber}</span></p>
                        <p>Name: <span className="text-slate-800 dark:text-slate-200 font-bold">{doc.details?.name}</span></p>
                      </div>
                    </div>

                    <a 
                      href={doc.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-4 block w-full py-1.5 text-center bg-slate-100 hover:bg-slate-200 dark:bg-navy-950 dark:hover:bg-navy-850 text-slate-700 dark:text-slate-250 font-bold rounded-lg text-xs transition-colors border border-slate-200/60 dark:border-navy-850"
                    >
                      View Document File
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Jargon Simplifier Page Tab */
        <div className="glass bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl shadow-sm p-6 space-y-6 max-w-4xl mx-auto animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="text-saffron-500" />
            <h3 className="text-lg font-bold font-outfit text-navy-800 dark:text-white">AI Legal Jargon Simplifier</h3>
          </div>

          <form onSubmit={handleSimplifySubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Paste Government Circular or Legal Language</label>
              <textarea
                required
                rows={6}
                value={legalText}
                onChange={(e) => setLegalText(e.target.value)}
                placeholder="Paste the dense circular or legal clauses here..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-250 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 focus:border-saffron-500 focus:outline-none text-sm transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={simplifying}
              className="w-full py-2.5 bg-navy-800 dark:bg-saffron-500 hover:bg-navy-900 dark:hover:bg-saffron-600 text-white font-bold rounded-lg shadow text-xs flex items-center justify-center gap-1.5"
            >
              {simplifying ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Simplifying dense text...</span>
                </div>
              ) : (
                <>Simplify Phrases with AI</>
              )}
            </button>
          </form>

          {/* Simplifier output display */}
          {simplifiedOutput && (
            <div className="p-6 bg-saffron-500/5 border border-saffron-200/50 dark:border-navy-800 rounded-2xl shadow-inner animate-scale-up space-y-3 whitespace-pre-line text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-semibold">
              <div className="flex items-center gap-1 text-saffron-600 dark:text-saffron-400 font-bold border-b border-saffron-200/50 pb-2">
                <Sparkles size={14} /> Simplified Plain Terms
              </div>
              <div>
                {simplifiedOutput}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
