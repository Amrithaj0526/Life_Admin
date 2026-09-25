import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Download,
  Archive,
  History,
  Link2,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';

export const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
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
      await fetchDocument();
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
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
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
              {doc.category_name || 'General'}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                doc.verification_status === 'VERIFIED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {doc.verification_status === 'VERIFIED' ? 'Verified Extraction' : 'Needs User Verification'}
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">{doc.title}</h2>
          <p className="text-xs text-slate-400 mt-1">Uploaded on {doc.created_at}</p>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href={`http://localhost:5000/api/documents/${id}/download`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            <Download className="w-4 h-4" />
            <span>Download File</span>
          </a>
          <button
            onClick={handleArchive}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 border border-rose-200 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
          >
            <Archive className="w-4 h-4" />
            <span>Archive</span>
          </button>
        </div>
      </div>

      {/* Human-In-The-Loop Verification Card */}
      {doc.verification_status !== 'VERIFIED' && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <ShieldCheck className="w-6 h-6 text-amber-600" />
            <div>
              <h3 className="font-extrabold text-amber-900">Verify AI-Extracted Information</h3>
              <p className="text-xs text-amber-700">
                Please confirm or adjust the details detected by our AI engine to activate this document.
              </p>
            </div>
          </div>

          <form onSubmit={handleVerify} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-amber-900 mb-1">Document Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full text-xs font-medium px-3 py-2 bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-amber-900 mb-1">Provider / Issuer</label>
              <input
                type="text"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="w-full text-xs font-medium px-3 py-2 bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-amber-900 mb-1">Expiry / Due Date</label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full text-xs font-medium px-3 py-2 bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={isVerifying}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm transition"
              >
                {isVerifying ? 'Confirming...' : 'Confirm & Activate Document'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Grid: Details + Extracted Actions & Relationships */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Metadata & Raw OCR */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-800">Key Document Fields</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-bold block mb-1 uppercase">Provider</span>
                <span className="text-slate-800 font-extrabold text-sm">{doc.provider || 'N/A'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-bold block mb-1 uppercase">Document Number</span>
                <span className="text-slate-800 font-extrabold text-sm font-mono">
                  {doc.document_number || 'N/A'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-bold block mb-1 uppercase">Expiry Date</span>
                <span className="text-rose-600 font-extrabold text-sm">{doc.expiry_date || 'N/A'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-bold block mb-1 uppercase">Premium / Amount</span>
                <span className="text-slate-800 font-extrabold text-sm">
                  {doc.amount ? `${doc.amount} ${doc.currency}` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Granular Fields Table */}
          {fields && fields.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-base font-extrabold text-slate-800 mb-3">Granular Extracted Fields</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-400 font-bold uppercase">
                    <th className="py-2">Field</th>
                    <th className="py-2">Extracted Value</th>
                    <th className="py-2">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fields.map((f: any) => (
                    <tr key={f.id}>
                      <td className="py-2.5 font-bold text-slate-700">{f.field_name}</td>
                      <td className="py-2.5 text-slate-600">{f.field_value}</td>
                      <td className="py-2.5">
                        <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
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
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-extrabold text-slate-800 mb-2">Raw OCR Text Traceability</h3>
            <pre className="text-xs font-mono text-slate-600 bg-slate-50 p-4 rounded-xl max-h-48 overflow-y-auto whitespace-pre-wrap">
              {doc.ocr_text || 'No text extracted.'}
            </pre>
          </div>
        </div>

        {/* Right Column: Actions, Versions, Relationships */}
        <div className="space-y-6">
          {/* Actions & Deadlines */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-extrabold text-slate-800 mb-3">Required Actions & Deadlines</h3>
            {actions && actions.length > 0 ? (
              <div className="space-y-3">
                {actions.map((act: any) => (
                  <div key={act.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">
                        {act.priority}
                      </span>
                      <span className="text-xs font-semibold text-rose-600">Due: {act.due_date}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800">{act.title}</h4>
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
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-extrabold text-slate-800 mb-3">Related Documents</h3>
            {relationships && relationships.length > 0 ? (
              <div className="space-y-2">
                {relationships.map((rel: any) => (
                  <div
                    key={rel.id}
                    className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800 block">{rel.target_title}</span>
                      <span className="text-[10px] font-semibold text-emerald-600 uppercase">
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

          {/* Version History */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-extrabold text-slate-800 mb-3">Version History</h3>
            <div className="space-y-2">
              {versions?.map((v: any) => (
                <div key={v.id} className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">Version {v.version_number}</span>
                    <span className="text-[11px] text-slate-400 block">{v.created_at.slice(0, 10)}</span>
                  </div>
                  <History className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
