import React, { useEffect, useState } from 'react';
import { History, Shield, CheckCircle, RefreshCw, UserCheck } from 'lucide-react';
import { api } from '../services/api';
import type { AuditLogItem } from '../types';

export const AuditHistoryPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/audit-logs');
      setLogs(res.data.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadge = (action: string) => {
    if (action.includes('RENEW')) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 flex items-center space-x-1">
          <RefreshCw className="w-3 h-3 mr-1" />
          {action}
        </span>
      );
    }
    if (action.includes('VERIFIED')) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center space-x-1">
          <CheckCircle className="w-3 h-3 mr-1" />
          {action}
        </span>
      );
    }
    if (action.includes('LOGIN') || action.includes('REGISTERED')) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 flex items-center space-x-1">
          <UserCheck className="w-3 h-3 mr-1" />
          {action}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
        {action}
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-emerald-600" />
            <h2 className="text-2xl font-black text-slate-800">Compliance & Audit Trail</h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Immutable system logs documenting uploads, OCR extractions, user confirmations, and lifecycle events.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : logs.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Event Action</th>
                  <th className="px-6 py-4">Entity</th>
                  <th className="px-6 py-4">Context Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  let parsedMeta: any = {};
                  try {
                    parsedMeta = log.metadata ? JSON.parse(log.metadata) : {};
                  } catch {
                    parsedMeta = { raw: log.metadata };
                  }

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-500">
                        {log.created_at}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getActionBadge(log.action)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-slate-700 text-xs tracking-wide">
                          {log.entity_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-600 max-w-xs truncate">
                        {JSON.stringify(parsedMeta)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No audit events recorded yet</h3>
          <p className="text-xs text-slate-400 mt-1">Actions performed on documents and vaults will appear here.</p>
        </div>
      )}
    </div>
  );
};
