import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sparkles, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [naturalMode, setNaturalMode] = useState(true);
  const [results, setResults] = useState<any>({ documents: [], actions: [] });
  const [loading, setLoading] = useState(false);
  const [interpreted, setInterpreted] = useState<any>(null);

  const sampleQueries = [
    'Show documents expiring next month',
    'Which insurance documents do I have?',
    'What payments are due this week?',
    'Show warranties expiring this year',
  ];

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      if (naturalMode) {
        const res = await api.get('/search/natural-language', { params: { q: searchQuery } });
        setResults(res.data);
        setInterpreted(res.data.interpretedQuery);
      } else {
        const res = await api.get('/search', { params: { q: searchQuery } });
        setResults(res.data);
        setInterpreted(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-800">Search & Natural Language Intelligence</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Ask questions in plain English or perform deep keyword queries across raw OCR text and metadata.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setNaturalMode(true)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
                naturalMode
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Natural Language Mode</span>
            </button>
            <button
              onClick={() => setNaturalMode(false)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                !naturalMode
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Keyword Search
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={
                naturalMode
                  ? "Ask anything (e.g. 'Show insurance documents expiring next month')"
                  : 'Enter keywords (policy, invoice, dell, registration)...'
              }
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition"
          >
            Search
          </button>
        </div>

        {/* Suggestion pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-bold text-slate-400">Suggestions:</span>
          {sampleQueries.map((sq, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(sq);
                handleSearch(sq);
              }}
              className="text-xs bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200 transition"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Interpreted Filter Feedback */}
      {interpreted && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="font-bold">Interpreted Query Intent:</span>
            <span>
              Category: <strong className="uppercase">{interpreted.category || 'All'}</strong> | Expiring
              Soon: <strong>{interpreted.expiringSoon ? 'YES' : 'NO'}</strong> | Overdue:{' '}
              <strong>{interpreted.overdue ? 'YES' : 'NO'}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {results.documents?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-800">Matching Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.documents.map((doc: any) => (
                  <Link
                    key={doc.id}
                    to={`/documents/${doc.id}`}
                    className="p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-500 transition shadow-sm flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {doc.category_name}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{doc.title}</h4>
                      <p className="text-xs text-slate-400">
                        {doc.expiry_date ? `Expires: ${doc.expiry_date}` : doc.provider || ''}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.actions?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-800">Matching Actions & Deadlines</h3>
              <div className="space-y-2">
                {results.actions.map((act: any) => (
                  <div
                    key={act.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{act.title}</span>
                      <span className="text-slate-400">Source: {act.document_title}</span>
                    </div>
                    <span className="text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded">
                      Due: {act.due_date}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
