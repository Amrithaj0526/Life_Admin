import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Calendar, ArrowRight, X } from 'lucide-react';
import { api } from '../../services/api';

interface CommandMenuProps {
  open: boolean;
  onClose: () => void;
}

export const CommandMenu: React.FC<CommandMenuProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    documents: Array<{ id: string; title: string; category_name?: string }>;
    actions: Array<{ id: string; title: string; due_date: string }>;
  }>({ documents: [], actions: [] });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults({ documents: [], actions: [] });
      return;
    }

    if (!query.trim()) {
      setResults({ documents: [], actions: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [docRes, actRes] = await Promise.all([
          api.get('/documents', { params: { search: query, limit: 5 } }),
          api.get('/actions', { params: { limit: 5 } }),
        ]);

        const filteredActions = (actRes.data.actions || [])
          .filter((a: any) => a.title.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 4);

        setResults({
          documents: docRes.data.documents || [],
          actions: filteredActions,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, open]);

  if (!open) return null;

  const handleSelect = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-100">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search documents & deadlines..."
            className="w-full py-4 text-sm bg-transparent focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded ml-2">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2">
          {loading && (
            <div className="py-6 text-center text-xs text-slate-400">
              Searching LifeAdmin...
            </div>
          )}

          {!loading && !query && (
            <div className="p-3 text-xs text-slate-400 space-y-2">
              <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 block px-2">
                Quick Navigation
              </span>
              <button
                onClick={() => handleSelect('/dashboard')}
                className="w-full flex items-center justify-between px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition text-left"
              >
                <span>Dashboard Overview</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => handleSelect('/documents')}
                className="w-full flex items-center justify-between px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition text-left"
              >
                <span>All Documents</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => handleSelect('/calendar')}
                className="w-full flex items-center justify-between px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition text-left"
              >
                <span>Deadlines Calendar</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => handleSelect('/social-impact')}
                className="w-full flex items-center justify-between px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition text-left"
              >
                <span>Emergency Dossier & Citizen Rights</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          )}

          {!loading && query && (
            <>
              {results.documents.length === 0 && results.actions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No matching documents or deadlines found for "{query}"
                </div>
              ) : (
                <div className="space-y-3 p-1">
                  {results.documents.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1 block">
                        Documents
                      </span>
                      {results.documents.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => handleSelect(`/documents/${d.id}`)}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-800 dark:text-slate-200 hover:bg-primary-50 dark:hover:bg-primary-950/40 rounded-lg transition text-left"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <FileText className="w-4 h-4 text-primary-600 shrink-0" />
                            <span className="font-medium truncate">{d.title}</span>
                          </div>
                          {d.category_name && (
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 shrink-0">
                              {d.category_name}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {results.actions.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1 block">
                        Upcoming Deadlines
                      </span>
                      {results.actions.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => handleSelect('/actions')}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-800 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition text-left"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                            <span className="font-medium truncate">{a.title}</span>
                          </div>
                          <span className="text-[10px] text-rose-600 font-bold shrink-0">
                            {a.due_date}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
