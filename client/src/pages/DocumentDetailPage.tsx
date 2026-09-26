import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Download,
  Archive,
  Link2,
  ShieldCheck,
  RefreshCw,
  GitCompare,
  UploadCloud,
  Info,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api, getDocumentDownloadUrl } from '../services/api';
import type { FieldDiff } from '../types';

export const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [diffs, setDiffs] = useState<FieldDiff[]>([]);
  const [renewalFile, setRenewalFile] = useState<File | null>(null);
  const [renewing, setRenewing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    provider: '',
    documentNumber: '',
    expiryDate: '',
    amount: '',
  });
  const navigate = useNavigate();

  const fetchDocument = async () => {
    try {
      const res = await api.get(`/documents/${id}`);
      setData(res.data);
      const doc = res.data.document;
      setFormData({
        title: doc.title || '',
        provider: doc.provider || '',
        documentNumber: doc.document_number || '',
        expiryDate: doc.expiry_date || '',
        amount: doc.amount ? doc.amount.toString() : '',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    try {
      await api.post(`/documents/${id}/verify`, {
        ...formData,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
      });
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      await fetchDocument();
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleStartRenewal = async () => {
    try {
      await api.post(`/documents/${id}/start-renewal`);
      await fetchDocument();
      setShowRenewalModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExecuteRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewalFile) return;

    setRenewing(true);
    const fd = new FormData();
    fd.append('file', renewalFile);

    try {
      const res = await api.post(`/documents/${id}/renew`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setShowRenewalModal(false);
      setDiffs(res.data.diffs || []);
      setShowDiffModal(true);
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
      await fetchDocument();
    } catch (err) {
      console.error(err);
    } finally {
      setRenewing(false);
    }
  };

  const handleCompareVersions = async () => {
    try {
      const res = await api.get(`/documents/${id}/compare-versions`);
      setDiffs(res.data.diffs || []);
      setShowDiffModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async () => {
    if (confirm('Are you sure you want to archive this document?')) {
      try {
        await api.post(`/documents/${id}/archive`);
        navigate('/documents');
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading || !data) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const { document: doc, actions, fields, versions, relationships } = data;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300">
              {doc.category_name || 'General'}
            </span>

            {/* AI / Demo Intelligence Transparency Badge */}
            {doc.is_demo_mode || doc.analysis_source === 'DEMO_FALLBACK' ? (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 inline-flex items-center space-x-1.5" title="Analyzed using offline heuristic rule engine">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Demo analysis mode</span>
              </span>
            ) : (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30 inline-flex items-center space-x-1.5" title="Deep neural extraction powered by Gemini AI">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>Gemini AI Analyzed</span>
              </span>
            )}

            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                doc.verification_status === 'VERIFIED'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
              }`}
            >
              {doc.verification_status === 'VERIFIED' ? 'Verified Extraction' : 'Needs User Verification'}
            </span>
            {doc.renewal_status && doc.renewal_status !== 'NOT_REQUIRED' && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300">
                Renewal: {doc.renewal_status}
              </span>
            )}
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{doc.title}</h2>
          <p className="text-xs text-slate-400 mt-1">
            Original: {doc.original_filename} • Uploaded on {doc.created_at}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Start Renewal Lifecycle Button */}
          <button
            onClick={handleStartRenewal}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Start Renewal</span>
          </button>

          {versions && versions.length > 1 && (
            <button
              onClick={handleCompareVersions}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 border border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100 rounded-xl text-xs font-bold transition"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Compare Versions</span>
            </button>
          )}

          <a
            href={getDocumentDownloadUrl(id!)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 border border-slate-200 dark:border-neutral-800 rounded-xl text-xs font-bold text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-900 transition"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </a>

          <button
            onClick={handleArchive}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 border border-rose-200 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
          >
            <Archive className="w-4 h-4" />
            <span>Archive</span>
          </button>
        </div>
      </div>

      {/* Demo Analysis Transparency Notice */}
      {(doc.is_demo_mode || doc.analysis_source === 'DEMO_FALLBACK') && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start space-x-3 text-xs text-amber-800 dark:text-amber-300">
          <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="font-bold text-sm text-amber-900 dark:text-amber-200">
              Demo Analysis Mode Active
            </p>
            <p className="text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
              This document was analyzed using offline heuristic preview rules without an active Gemini API key. Please review, edit, and confirm the extracted values below. To enable production deep multimodal extraction, provide your Gemini API key in server configuration.
            </p>
          </div>
        </div>
      )}

      {/* Human-In-The-Loop Verification Card */}
      {doc.verification_status !== 'VERIFIED' ? (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300/80 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-sm shadow-amber-500/30 shrink-0 mt-0.5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-amber-950">
                  AI Detected Information — Please Confirm
                </h3>
                <p className="text-xs text-amber-800/90 mt-1 max-w-2xl leading-relaxed">
                  OCR and AI can occasionally make mistakes. Please verify that the detected dates, amounts, and numbers match your original paper before LifeAdmin activates automated reminders on your Google Calendar.
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-200/80 text-amber-900 border border-amber-300">
              Awaiting Verification
            </span>
          </div>

          <form onSubmit={handleVerify} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">Document Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full text-xs font-medium px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">Provider / Authority</label>
              <input
                type="text"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                placeholder="e.g. LIC, RTO, TNEB"
                className="w-full text-xs font-medium px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">Expiry / Due Date</label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full text-xs font-medium px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">Amount / Premium (₹)</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="e.g. 8450"
                className="w-full text-xs font-medium px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-amber-200/60">
              <span className="text-[11px] text-amber-800 italic">
                Only confirmed deadlines are synchronized with Google Calendar to protect against false alarms.
              </span>
              <button
                type="submit"
                disabled={isVerifying}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-amber-600/20 transition flex items-center justify-center space-x-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isVerifying ? 'Confirming...' : 'Confirm Information'}</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>
              <strong>Verified by User:</strong> This document's details were checked and confirmed. Active reminders are in sync with your calendar.
            </span>
          </div>
          <button
            onClick={() => {
              // Allow re-verifying / editing verified documents
              setData({ ...data, document: { ...doc, verification_status: 'PENDING' } });
            }}
            className="text-[11px] font-bold text-emerald-700 hover:underline shrink-0"
          >
            Edit Details
          </button>
        </div>
      )}

      {/* Main Grid: Details + Extracted Actions & Relationships */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Plain-Language Summary + Metadata & Raw OCR */}
        <div className="lg:col-span-2 space-y-6">
          {/* Plain-Language Document Summary (Spec Section 3) */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-indigo-700">
              <Sparkles className="w-4 h-4" />
              <h3 className="text-base font-black text-slate-900">Plain-Language Document Summary</h3>
            </div>

            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed space-y-2">
              <p className="font-medium text-slate-800 text-sm">
                {doc.summary || `${doc.title} issued by ${doc.provider || 'Authority'}.`}
              </p>
              {doc.expiry_date && (
                <p className="text-rose-700 font-semibold">
                  ⚠️ Expires on <strong>{doc.expiry_date}</strong>. Ensure renewal or compliance is completed prior to this date.
                </p>
              )}
              {doc.amount && (
                <p className="text-emerald-700 font-semibold">
                  💳 Payment of <strong>₹{doc.amount}</strong> is associated with this record.
                </p>
              )}
            </div>

            {/* Quick Fact Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Document Type</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{doc.category_name || 'General'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Owner / Name</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{doc.owner_name || 'Account Holder'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reference / Reg No.</span>
                <span className="font-bold font-mono text-slate-800 mt-0.5 block">{doc.document_number || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Metadata Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900">Key Document Fields</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-bold block mb-1 uppercase tracking-wider">Provider</span>
                <span className="text-slate-900 font-black text-sm">{doc.provider || 'N/A'}</span>
              </div>
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-bold block mb-1 uppercase tracking-wider">Document Number</span>
                <span className="text-slate-900 font-black text-sm font-mono">
                  {doc.document_number || 'N/A'}
                </span>
              </div>
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-bold block mb-1 uppercase tracking-wider">Expiry Date</span>
                <span className="text-rose-600 font-black text-sm">{doc.expiry_date || 'N/A'}</span>
              </div>
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-bold block mb-1 uppercase tracking-wider">Premium / Amount</span>
                <span className="text-slate-900 font-black text-sm">
                  {doc.amount ? `${doc.amount} ${doc.currency}` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Granular Fields Table */}
          {fields && fields.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
              <h3 className="text-base font-black text-slate-900 mb-3">Extracted Attributes & Confidence</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-2.5">Field</th>
                    <th className="py-2.5">Value</th>
                    <th className="py-2.5">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fields.map((f: any) => (
                    <tr key={f.id}>
                      <td className="py-3 font-bold text-slate-800">{f.field_name}</td>
                      <td className="py-3 text-slate-600">{f.field_value}</td>
                      <td className="py-3">
                        <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200/50">
                          {(f.confidence * 100).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Raw OCR Text Traceability */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
            <h3 className="text-base font-black text-slate-900 mb-2">Raw OCR Text Traceability</h3>
            <pre className="text-xs font-mono text-slate-600 bg-slate-50 p-4 rounded-2xl max-h-48 overflow-y-auto whitespace-pre-wrap border border-slate-100">
              {doc.ocr_text || 'No text extracted.'}
            </pre>
          </div>
        </div>

        {/* Right Column: Actions, Versions, Relationships */}
        <div className="space-y-6">
          {/* Actions & Deadlines */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
            <h3 className="text-base font-black text-slate-900 mb-3">Required Actions & Deadlines</h3>
            {actions && actions.length > 0 ? (
              <div className="space-y-3">
                {actions.map((act: any) => (
                  <div key={act.id} className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md">
                        {act.priority}
                      </span>
                      <span className="text-xs font-bold text-rose-600">Due: {act.due_date}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">{act.title}</h4>
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">
                      Status: {act.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No actions required for this document.</p>
            )}
          </div>

          {/* Related Documents */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
            <h3 className="text-base font-black text-slate-900 mb-3">Related Documents</h3>
            {relationships && relationships.length > 0 ? (
              <div className="space-y-2">
                {relationships.map((rel: any) => (
                  <div
                    key={rel.id}
                    className="p-3 bg-slate-50/80 rounded-xl flex items-center justify-between text-xs border border-slate-100"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{rel.target_title}</span>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">
                        {rel.relationship_type}
                      </span>
                    </div>
                    <Link2 className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No related documents mapped yet.</p>
            )}
          </div>

          {/* Version History with Change Summaries */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-black text-slate-900">Version History</h3>
              {versions && versions.length > 1 && (
                <button
                  onClick={handleCompareVersions}
                  className="text-xs font-bold text-purple-600 hover:underline"
                >
                  View Diff
                </button>
              )}
            </div>
            <div className="space-y-2.5">
              {versions?.map((v: any) => (
                <div key={v.id} className="p-3 bg-slate-50/80 rounded-xl text-xs border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900">Version {v.version_number}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{v.created_at.slice(0, 10)}</span>
                  </div>
                  {v.change_summary && (
                    <p className="text-[11px] text-slate-500 mt-1 font-medium line-clamp-2">
                      {v.change_summary}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Renewal Modal */}
      {showRenewalModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Upload Renewed Policy</h3>
                <p className="text-xs text-slate-500">Attach the new renewal document to create a new version.</p>
              </div>
            </div>

            <form onSubmit={handleExecuteRenewal} className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-purple-500 transition cursor-pointer relative">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => e.target.files && setRenewalFile(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <UploadCloud className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">
                  {renewalFile ? renewalFile.name : 'Select renewed PDF or image'}
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRenewalModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!renewalFile || renewing}
                  className="px-5 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {renewing ? 'Processing Renewal...' : 'Confirm Renewal & Diff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Version Comparison (Diff) Modal */}
      {showDiffModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <GitCompare className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-black text-slate-900">Document Version Comparison Diff</h3>
              </div>
              <button
                onClick={() => setShowDiffModal(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Close
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-2">Attribute</th>
                    <th className="py-2">Previous Version</th>
                    <th className="py-2">New Version</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {diffs.map((diff, idx) => (
                    <tr key={idx}>
                      <td className="py-3 font-bold text-slate-800">{diff.fieldName}</td>
                      <td className="py-3 text-slate-500 font-mono">{diff.oldValue || '—'}</td>
                      <td className="py-3 text-slate-900 font-mono font-bold">{diff.newValue || '—'}</td>
                      <td className="py-3">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            diff.status === 'CHANGED'
                              ? 'bg-amber-100 text-amber-800'
                              : diff.status === 'ADDED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : diff.status === 'REMOVED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {diff.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowDiffModal(false)}
                className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
