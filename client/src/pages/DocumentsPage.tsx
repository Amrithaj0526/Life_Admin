import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Calendar as CalendarIcon,
  Search,
  LayoutGrid,
  List as ListIcon,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import type { DocumentItem } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Dialog } from '../components/ui/dialog';
import { getGoogleCalendarWebUrl } from '../utils/calendar';
import { useToast } from '../context/ToastContext';

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [documentToDelete, setDocumentToDelete] = useState<DocumentItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const categories = [
    'ALL',
    'Insurance',
    'Vehicle',
    'Bills',
    'Identity',
    'Warranty',
    'Medical',
    'Property',
  ];

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents', {
        params: {
          search,
          category: activeCategory !== 'ALL' ? activeCategory : undefined,
        },
      });
      setDocuments(res.data.documents || []);
    } catch {
      toast.error('Unable to fetch documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [search, activeCategory]);

  const handleDelete = async () => {
    if (!documentToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/documents/${documentToDelete.id}`);
      toast.success('Document deleted successfully.');
      setDocumentToDelete(null);
      fetchDocuments();
    } catch {
      toast.error('Failed to delete document.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Documents
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage all your important documents, policies, and certificates in one place.
          </p>
        </div>

        <Button onClick={() => navigate('/upload')} variant="primary" size="md">
          <Plus className="w-4 h-4" />
          <span>Upload Document</span>
        </Button>
      </div>

      {/* 2. Search & Category Filters Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents by title, provider, or identifier..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* View Toggle (Grid / List) */}
          <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start sm:self-auto shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 shadow-sm text-primary-600 dark:text-primary-400'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 shadow-sm text-primary-600 dark:text-primary-400'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title="List View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                activeCategory === cat
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {cat === 'ALL' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Documents Presentation */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No documents found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {search
              ? `No results matching "${search}". Try clearing search or selecting a different category.`
              : 'Start organizing your important documents, policies, and IDs in one place.'}
          </p>
          <div className="mt-5">
            <Button onClick={() => navigate('/upload')} variant="primary" size="sm">
              <Plus className="w-4 h-4" />
              <span>Upload Your First Document</span>
            </Button>
          </div>
        </Card>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className="hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-subtle-hover transition-all flex flex-col justify-between"
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-300 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={`/documents/${doc.id}`}
                        className="font-bold text-sm text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 truncate block"
                      >
                        {doc.title}
                      </Link>
                      <span className="text-xs text-slate-400 block mt-0.5">
                        {doc.category_name || 'General Record'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setDocumentToDelete(doc)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span className="flex items-center space-x-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>Expires</span>
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {doc.expiry_date || 'No Expiry'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Status</span>
                    <Badge
                      variant={
                        doc.status === 'ACTIVE'
                          ? 'success'
                          : doc.status === 'NEEDS_REVIEW'
                          ? 'warning'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {doc.status}
                    </Badge>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  {doc.expiry_date && (
                    <a
                      href={getGoogleCalendarWebUrl({
                        title: `${doc.title} Renewal`,
                        due_date: doc.expiry_date,
                        document_title: doc.title,
                      })}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center space-x-1"
                    >
                      <CalendarIcon className="w-3 h-3" />
                      <span>Add to G-Cal</span>
                    </a>
                  )}

                  <Link
                    to={`/documents/${doc.id}`}
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-primary-600 flex items-center space-x-1 ml-auto"
                  >
                    <span>View & Verify</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* List View (Table) */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Document Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {documents.map((doc) => (
                <tr
                  key={doc.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                >
                  <td className="py-3 px-4">
                    <Link
                      to={`/documents/${doc.id}`}
                      className="font-bold text-slate-900 dark:text-white hover:text-primary-600 truncate block max-w-xs"
                    >
                      {doc.title}
                    </Link>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {doc.document_number || 'ID: ' + doc.id.slice(0, 8)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    {doc.category_name || 'General'}
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                    {doc.expiry_date || 'None'}
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        doc.status === 'ACTIVE'
                          ? 'success'
                          : doc.status === 'NEEDS_REVIEW'
                          ? 'warning'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {doc.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <Link
                      to={`/documents/${doc.id}`}
                      className="text-primary-600 hover:underline font-semibold"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => setDocumentToDelete(doc)}
                      className="text-rose-600 hover:underline font-semibold ml-2"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Dialog for Delete (Spec #26) */}
      {documentToDelete && (
        <Dialog
          open={Boolean(documentToDelete)}
          onClose={() => setDocumentToDelete(null)}
          title="Delete document?"
          description="This action cannot be undone. All extracted data, action deadlines, and audit trails associated with this document will be removed."
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-white">
                {documentToDelete.title}
              </span>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDocumentToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
