import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  AlertCircle,
  X,
  FileCheck
} from 'lucide-react';
import { api } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useToast } from '../context/ToastContext';

export const UploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setProgress(15);
    setStatusText('Uploading document to secure encrypted vault...');
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const docId = res.data.id;

      setProgress(45);
      setStatusText('Extracting text & running OCR analysis...');
      await new Promise((r) => setTimeout(r, 900));

      setProgress(85);
      setStatusText('AI analyzing dates, providers, and consequence scores...');
      await new Promise((r) => setTimeout(r, 1100));

      setProgress(100);
      setStatusText('Upload & AI analysis complete!');
      toast.success('Document uploaded and analyzed successfully.');

      setTimeout(() => {
        navigate(`/documents/${docId}`);
      }, 700);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Unable to upload document.';
      setError(msg);
      toast.error(msg);
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Upload Document
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Upload insurance policies, utility bills, warranties, or certificates for automated deadline tracking.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <CardContent className="p-6 sm:p-8 space-y-6">
          <form onSubmit={handleUpload} className="space-y-6">
            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all relative ${
                isDragging
                  ? 'border-primary-500 bg-primary-50/40 dark:bg-primary-950/30 scale-[1.01]'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-900/40'
              }`}
            >
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                disabled={uploading}
                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />

              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-300 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                    Upload your document
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Drag & drop here or browse files
                  </p>
                </div>
                <div className="pt-1">
                  <span className="inline-block px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm">
                    Browse Files
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  PDF, DOCX, JPG, PNG up to 10 MB
                </span>
              </div>
            </div>

            {/* Selected File Card */}
            {file && (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <FileText className="w-4 h-4 text-primary-600 shrink-0" />
                  <span className="font-semibold text-slate-800 dark:text-white truncate">
                    {file.name}
                  </span>
                  <span className="text-slate-400 text-[11px] shrink-0">
                    ({(file.size / 1024).toFixed(0)} KB)
                  </span>
                </div>

                {!uploading && (
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Upload Progress Bar */}
            {uploading && (
              <div className="space-y-2 pt-1 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
                  <span>{statusText}</span>
                  <span className="font-bold">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-600 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Action */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                disabled={uploading}
                onClick={() => navigate('/documents')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!file || uploading}
                isLoading={uploading}
              >
                <FileCheck className="w-4 h-4" />
                <span>Upload & Extract</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
