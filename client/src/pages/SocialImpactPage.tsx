import React, { useEffect, useState } from 'react';
import {
  HeartHandshake,
  HeartPulse,
  Scale,
  DollarSign,
  ShieldCheck,
  Download,
  Users,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { api, getDocumentDownloadUrl } from '../services/api';

export const SocialImpactPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'emergency' | 'savings' | 'rights'>('emergency');
  const [emergencyData, setEmergencyData] = useState<any>(null);
  const [savingsData, setSavingsData] = useState<any>(null);
  const [rightsData, setRightsData] = useState<any>(null);
  const [selectedRightsCategory, setSelectedRightsCategory] = useState('Insurance');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [emRes, savRes, rigRes] = await Promise.all([
          api.get('/impact/emergency-kit'),
          api.get('/impact/penalty-savings'),
          api.get('/impact/citizen-rights', { params: { category: selectedRightsCategory } }),
        ]);
        setEmergencyData(emRes.data);
        setSavingsData(savRes.data);
        setRightsData(rigRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedRightsCategory]);

  if (loading && !emergencyData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Social Impact Hero Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Public Good & Societal Safety Net</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight">Citizen Protection & Life Assurance</h2>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Documents are not just files — they are hospital admissions, legal rights, and financial buffers. LifeAdmin safeguards families against devastating insurance lapses, extortionate penalties, and claim rejections.
            </p>
          </div>

          <div className="flex items-center space-x-4 bg-white/10 backdrop-blur p-4 rounded-2xl border border-white/10">
            <div className="text-center px-2">
              <span className="text-2xl font-black text-emerald-400 block">
                ${savingsData?.totalSavingsEstimated || 795}
              </span>
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Fines & Losses Prevented
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-8 text-sm">
        <button
          onClick={() => setActiveTab('emergency')}
          className={`pb-3 font-extrabold flex items-center space-x-2 transition ${
            activeTab === 'emergency'
              ? 'border-b-2 border-emerald-600 text-emerald-700'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <HeartPulse className="w-4 h-4 text-rose-500" />
          <span>Emergency Medical & ID Kit</span>
        </button>

        <button
          onClick={() => setActiveTab('savings')}
          className={`pb-3 font-extrabold flex items-center space-x-2 transition ${
            activeTab === 'savings'
              ? 'border-b-2 border-emerald-600 text-emerald-700'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <span>Penalty & Fine Prevention Meter</span>
        </button>

        <button
          onClick={() => setActiveTab('rights')}
          className={`pb-3 font-extrabold flex items-center space-x-2 transition ${
            activeTab === 'rights'
              ? 'border-b-2 border-emerald-600 text-emerald-700'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Scale className="w-4 h-4 text-blue-600" />
          <span>Citizen & Consumer Rights Advisor</span>
        </button>
      </div>

      {/* TAB 1: EMERGENCY MEDICAL & CRITICAL ID KIT */}
      {activeTab === 'emergency' && (
        <div className="space-y-6">
          <div className="bg-rose-50 border border-rose-200/90 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
                <HeartPulse className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-rose-950">One-Tap Emergency Medical Dossier</h3>
                <p className="text-xs text-rose-800 mt-0.5">
                  Curated vital health policies, blood group records, and identity cards ready for immediate hospital ER admission or first responders.
                </p>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/20 transition shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Print / Export Emergency Dossier</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Critical Documents List */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h4 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified Health & Identity Records</span>
              </h4>

              {emergencyData?.emergencyDocuments?.length > 0 ? (
                <div className="space-y-3">
                  {emergencyData.emergencyDocuments.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {doc.category_name}
                        </span>
                        <h5 className="text-sm font-black text-slate-900 mt-1">{doc.title}</h5>
                        <p className="text-slate-500 font-mono mt-0.5">
                          {doc.provider || 'Authority'} • Ref: {doc.document_number || 'N/A'}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-slate-700 block">
                          Exp: {doc.expiry_date || 'No Expiry'}
                        </span>
                        <a
                          href={getDocumentDownloadUrl(doc.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold text-emerald-600 hover:underline mt-1 inline-block"
                        >
                          View Document →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">
                  Upload health insurance or identity records to populate this emergency dossier.
                </p>
              )}
            </div>

            {/* Trusted Contacts in Vaults */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h4 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Trusted Emergency Contacts</span>
              </h4>
              <p className="text-xs text-slate-500">
                Individuals authorized to access your emergency dossier in crisis situations.
              </p>

              {emergencyData?.trustedContacts?.length > 0 ? (
                <div className="space-y-2">
                  {emergencyData.trustedContacts.map((contact: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <span className="font-bold text-slate-900 block">{contact.name}</span>
                      <span className="text-slate-400 font-mono text-[11px]">{contact.email}</span>
                      <span className="text-[10px] font-bold text-emerald-700 block mt-1">
                        Role: {contact.role} ({contact.vault_name})
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                  Add family members in the <strong>Family Vault</strong> tab to designate emergency contacts.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PENALTY SAVINGS METER */}
      {activeTab === 'savings' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">Household Penalty & Fine Prevention Meter</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Quantifying tangible economic savings by eliminating late fees, lapsed insurance restoration costs, and traffic penalty charges.
                </p>
              </div>

              <div className="text-right">
                <span className="text-3xl font-black text-emerald-600">
                  ${savingsData?.totalSavingsEstimated || 0}
                </span>
                <span className="text-xs text-slate-400 block font-semibold">Total Cumulative Savings</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-1">
                <span className="text-xs font-bold text-emerald-800 uppercase">Resolved Obligations</span>
                <span className="text-2xl font-black text-emerald-700 block">
                  {savingsData?.actionsCompletedCount || 0}
                </span>
                <p className="text-[11px] text-emerald-600">Timely completed deadlines</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-1">
                <span className="text-xs font-bold text-amber-800 uppercase">Upcoming Protected Items</span>
                <span className="text-2xl font-black text-amber-700 block">
                  {savingsData?.actionsAtRiskCount || 0}
                </span>
                <p className="text-[11px] text-amber-600">Under active monitoring</p>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-1">
                <span className="text-xs font-bold text-blue-800 uppercase">Average Fine Prevented</span>
                <span className="text-2xl font-black text-blue-700 block">$125</span>
                <p className="text-[11px] text-blue-600">Per averted vehicle/insurance penalty</p>
              </div>
            </div>

            {/* Savings Breakdown Table */}
            {savingsData?.breakdown?.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-black text-slate-800">Prevented Losses Breakdown</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-2.5">Prevented Penalty Action</th>
                        <th className="py-2.5">Category</th>
                        <th className="py-2.5">Estimated Loss Avoided</th>
                        <th className="py-2.5">Completion Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {savingsData.breakdown.map((item: any) => (
                        <tr key={item.id}>
                          <td className="py-3 font-bold text-slate-800">{item.title}</td>
                          <td className="py-3 text-slate-500">{item.category}</td>
                          <td className="py-3 text-emerald-700 font-black">+${item.fineAvoided}</td>
                          <td className="py-3 text-slate-400 font-mono">
                            {item.completedAt ? item.completedAt.slice(0, 10) : 'Recent'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CITIZEN LEGAL & CONSUMER RIGHTS ADVISOR */}
      {activeTab === 'rights' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">Citizen Legal & Consumer Rights Advisor</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Empowering ordinary citizens with statutory rights, mandatory grace periods, and ombudsman escalations.
                </p>
              </div>

              {/* Category Selector */}
              <div className="flex items-center space-x-2">
                {['Insurance', 'Warranty', 'Bills'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedRightsCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                      selectedRightsCategory === cat
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Advisor Content Card */}
            {rightsData && (
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center space-x-3 text-xs text-blue-900">
                  <Scale className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-black block text-sm">{rightsData.title}</span>
                    <span className="mt-0.5 block">{rightsData.statutoryGracePeriod}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-black text-slate-800">Your Enforceable Statutory Rights</h4>
                  <div className="space-y-2.5">
                    {rightsData.rights?.map((right: string, idx: number) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-start space-x-3 text-xs text-slate-700"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-relaxed font-medium">{right}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                  <span className="font-semibold">Faced unfair rejection or arbitrary cancellation?</span>
                  <a
                    href={rightsData.ombudsmanLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-blue-600 font-bold hover:underline"
                  >
                    <span>Official National Consumer Helpline</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
