import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, Calendar, Search } from 'lucide-react';
import { api } from '../services/api';
import type { DocumentItem } from '../types';

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<any[]>([]);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents', {
        params: { search, category: categoryFilter },
      });
      setDocuments(res.data.documents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data.categories);
      } catch (err) {
        console.error(err);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [search, categoryFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800">All Stored Documents</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Organized records with automated verification, version history, and relations.
          </p>
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Document</span>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, provider, or policy number..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Documents Grid / Table */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <Link
              key={doc.id}
              to={`/documents/${doc.id}`}
              className="bg-white rounded-xl border border-slate-200 hover:border-emerald-500/50 hover:shadow-md transition p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {doc.category_name || 'General'}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      doc.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : doc.status === 'NEEDS_REVIEW'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 line-clamp-1">{doc.title}</h3>
                {doc.provider && (
                  <p className="text-xs font-medium text-slate-500 mt-0.5">{doc.provider}</p>
                )}
                {doc.document_number && (
                  <p className="text-xs text-slate-400 font-mono mt-1">Ref: {doc.document_number}</p>
                )}
              </div>

              <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {doc.expiry_date ? `Exp: ${doc.expiry_date}` : `Added: ${doc.created_at.slice(0, 10)}`}
                  </span>
                </span>
                {doc.amount && (
                  <span className="font-bold text-slate-800">
                    {doc.amount} {doc.currency}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No documents found</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Upload your insurance, bills, or warranties to begin tracking.
          </p>
          <Link
            to="/upload"
            className="inline-block bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-lg"
          >
            Upload Now
          </Link>
        </div>
      )}
    </div>
  );
};
