import React, { useEffect, useState } from 'react';
import { Users, Plus } from 'lucide-react';
import { api } from '../services/api';

export const VaultsPage: React.FC = () => {
  const [vaults, setVaults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const fetchVaults = async () => {
    try {
      const res = await api.get('/vaults');
      setVaults(res.data.vaults);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVaults();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await api.post('/vaults', { name, description });
      setName('');
      setDescription('');
      setShowCreate(false);
      fetchVaults();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Family & Household Vaults</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Safely share documents with spouse, parents, or dependents with role-based access control.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Vault</span>
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Create Shared Document Space</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Vault Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Household Utilities or Family Health"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Shared medical records and property papers"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="text-xs font-bold text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-xs font-bold bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
            >
              Create Vault
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : vaults.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vaults.map((vault) => (
            <div key={vault.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                  Role: {vault.role}
                </span>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{vault.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{vault.description || 'Shared vault for family items'}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No vaults created yet</h3>
          <p className="text-xs text-slate-400 mt-1">Create a family vault to organize documents across your household.</p>
        </div>
      )}
    </div>
  );
};
