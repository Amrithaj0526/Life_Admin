import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, AlertCircle, FileText, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export const UploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState<'idle' | 'uploading' | 'ocr' | 'ai' | 'done'>('idle');
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
    setStep('uploading');
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const id = res.data.id;

      // Simulate step progression for intuitive UI feedback
      setStep('ocr');
      await new Promise((r) => setTimeout(r, 1200));

      setStep('ai');
      await new Promise((r) => setTimeout(r, 1500));

      setStep('done');
      setTimeout(() => {
        navigate(`/documents/${id}`);
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload and processing failed.');
      setStep('idle');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-800">Upload & Analyze Document</h2>
        <p className="text-sm text-slate-500 mt-1">
          Upload insurance policies, bills, warranties, or certificates. Our pipeline will extract
          text, detect deadlines, and calculate priorities.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <form onSubmit={handleUpload} className="space-y-6">
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-emerald-500 transition cursor-pointer relative">
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-3">
                <UploadCloud className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-slate-700">
                {file ? file.name : 'Click or drag document to upload'}
              </p>
              <p className="text-xs text-slate-400 mt-1">PDF, JPG, or PNG up to 10MB</p>
            </div>
          </div>

          {file && (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <span className="font-semibold text-slate-700">{file.name}</span>
                <span className="text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
              <span className="text-emerald-600 font-bold">Ready</span>
            </div>
          )}

          {uploading && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    step === 'uploading' ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'
                  }`}
                />
                <span className="font-semibold text-slate-700">1. Uploading file securely...</span>
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    step === 'ocr'
                      ? 'bg-amber-500 animate-ping'
                      : ['ai', 'done'].includes(step)
                      ? 'bg-emerald-500'
                      : 'bg-slate-300'
                  }`}
                />
                <span className="font-semibold text-slate-700">2. OCR & Raw Text Extraction...</span>
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    step === 'ai'
                      ? 'bg-amber-500 animate-ping'
                      : step === 'done'
                      ? 'bg-emerald-500'
                      : 'bg-slate-300'
                  }`}
                />
                <span className="font-semibold text-slate-700">
                  3. AI Analyzing fields, deadlines & priority...
                </span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!file || uploading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center space-x-2 transition shadow-md shadow-emerald-600/20"
          >
            <span>{uploading ? 'Processing Pipeline Active...' : 'Upload & Start Intelligence Engine'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
