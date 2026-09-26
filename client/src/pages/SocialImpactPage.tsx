import React, { useEffect, useState } from 'react';
import {
  HeartPulse,
  Scale,
  DollarSign,
  ShieldCheck,
  Download,
  Users,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Briefcase,
  Car,
  Home,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import { api, getDocumentDownloadUrl } from '../services/api';

type TabType = 'emergency' | 'penalties' | 'rights' | 'playbooks';

interface Persona {
  id: string;
  name: string;
  role: string;
  badge: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  documentsToUpload: string[];
  remindersCreated: string[];
  impactStat: string;
}

const PERSONAS: Persona[] = [
  {
    id: 'students',
    name: 'Students & Applicants',
    role: 'Scholarships, Fee Receipts & Exam Schedules',
    badge: 'Academic & Career',
    icon: GraduationCap,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/40',
    borderColor: 'border-indigo-200 dark:border-indigo-900/60',
    documentsToUpload: [
      'Marksheets & Degree Certificates',
      'Scholarship Application & Award Letters',
      'College Semester Fee Receipts',
      'Entrance Exam Hall Tickets'
    ],
    remindersCreated: [
      'Scholarship portal closure notifications (15d & 3d prior)',
      'Semester fee payment cutoffs to prevent late fines',
      'Category & Domicile certificate renewal windows'
    ],
    impactStat: 'Prevents missed scholarship funds (averaging ₹20,000–₹50,000/yr)'
  },
  {
    id: 'families',
    name: 'Households & Families',
    role: 'Health Policies, Utilities, Leases & Municipal Bills',
    badge: 'Family Living',
    icon: Home,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-200 dark:border-emerald-900/60',
    documentsToUpload: [
      'Family Floater Health Insurance Policies',
      'Monthly Electricity & Water Bills',
      '11-Month Rental / Lease Agreements',
      'Home Appliance Invoices & Warranty Cards'
    ],
    remindersCreated: [
      '30-Day IRDAI statutory grace period for health insurance',
      'Monthly utility bill payment before disconnection fees',
      'Rent agreement 60-day renewal notice'
    ],
    impactStat: 'Protects against health insurance lapses and sudden out-of-pocket costs'
  },
  {
    id: 'workers',
    name: 'Salaried Professionals',
    role: 'Employment Contracts, Tax Filings & Certifications',
    badge: 'Career & Tax',
    icon: Briefcase,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    borderColor: 'border-amber-200 dark:border-amber-900/60',
    documentsToUpload: [
      'Offer, Appointment & Relieving Letters',
      'Form 16 & Tax Computation Sheets',
      'Professional Accreditations & Licenses'
    ],
    remindersCreated: [
      'ITR filing deadline (31 July) reminders with tax proof schedule',
      'Professional certification renewal windows',
      'PF / Gratuity milestone tracking'
    ],
    impactStat: 'Eliminates Section 234F late filing penalties up to ₹5,000'
  },
  {
    id: 'vehicle_owners',
    name: 'Vehicle Owners',
    role: 'PUC, Motor Insurance, RC & Driver Licensing',
    badge: 'Vehicle Compliance',
    icon: Car,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50 dark:bg-rose-950/40',
    borderColor: 'border-rose-200 dark:border-rose-900/60',
    documentsToUpload: [
      'Vehicle Registration Certificate (RC)',
      'Comprehensive / Third-Party Motor Insurance',
      'Pollution Under Control (PUC) Certificate',
      'Driving Licence (DL)'
    ],
    remindersCreated: [
      'PUC expiry alert 14 days and 2 days before deadline',
      'Insurance renewal 30 days ahead to retain No-Claim Bonus (NCB)',
      'Driving licence renewal reminder'
    ],
    impactStat: 'Saves up to ₹10,000 in MV Act fines and preserves NCB'
  }
];

export const SocialImpactPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('emergency');
  const [expandedPersona, setExpandedPersona] = useState<string>('students');
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
        console.error('Failed to load social impact data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedRightsCategory]);

  if (loading && !emergencyData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>India Citizen Utilities</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Emergency Kit & Legal Safeguards
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm">
              Instant hospital emergency dossiers, statutory fine protection, and consumer rights.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center space-x-6 bg-white/10 backdrop-blur-md px-6 py-4 rounded-xl border border-white/10 shrink-0">
            <div>
              <span className="text-2xl font-black text-emerald-400 block font-mono">
                {savingsData?.currency || '₹'}{savingsData?.totalSavingsEstimated?.toLocaleString('en-IN') || '28,500'}
              </span>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mt-0.5">
                Fines & Penalties Avoided
              </span>
            </div>
            <div className="h-8 w-px bg-white/15"></div>
            <div>
              <span className="text-2xl font-black text-indigo-300 block font-mono">
                {savingsData?.actionsCompletedCount || 0}
              </span>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mt-0.5">
                On-Time Renewals
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Clean 4-Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('emergency')}
          className={`px-3.5 py-2 rounded-lg flex items-center space-x-2 transition ${
            activeTab === 'emergency'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          <span>Emergency Medical Dossier</span>
        </button>

        <button
          onClick={() => setActiveTab('penalties')}
          className={`px-3.5 py-2 rounded-lg flex items-center space-x-2 transition ${
            activeTab === 'penalties'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Fines & Penalties Guide</span>
        </button>

        <button
          onClick={() => setActiveTab('rights')}
          className={`px-3.5 py-2 rounded-lg flex items-center space-x-2 transition ${
            activeTab === 'rights'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Citizen Rights Advisor</span>
        </button>

        <button
          onClick={() => setActiveTab('playbooks')}
          className={`px-3.5 py-2 rounded-lg flex items-center space-x-2 transition ${
            activeTab === 'playbooks'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Category Playbooks</span>
        </button>
      </div>

      {/* TAB 1: EMERGENCY MEDICAL DOSSIER */}
      {activeTab === 'emergency' && (
        <div className="space-y-6">
          <div className="bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 bg-rose-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-rose-600/30">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-950 dark:text-rose-200">
                  Instant Emergency Medical Dossier
                </h3>
                <p className="text-xs text-rose-800 dark:text-rose-300 mt-0.5">
                  Curated health policies, TPA desk references, and blood group cards for hospital admissions.
                </p>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Critical Documents List */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified Health & Identity Records</span>
              </h4>

              {emergencyData?.emergencyDocuments?.length > 0 ? (
                <div className="space-y-2.5">
                  {emergencyData.emergencyDocuments.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          {doc.category_name}
                        </span>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white mt-1">{doc.title}</h5>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {doc.provider || 'Authority'} • Ref: {doc.document_number || 'N/A'}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block">
                          Exp: {doc.expiry_date || 'No Expiry'}
                        </span>
                        <a
                          href={getDocumentDownloadUrl(doc.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold text-emerald-600 hover:underline mt-0.5 inline-block"
                        >
                          View Document →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  Upload health insurance or identity records to populate this emergency dossier.
                </div>
              )}
            </div>

            {/* Trusted Contacts */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Emergency Contacts</span>
              </h4>
              <p className="text-xs text-slate-500">
                Designated members with emergency access permissions.
              </p>

              {emergencyData?.trustedContacts?.length > 0 ? (
                <div className="space-y-2">
                  {emergencyData.trustedContacts.map((contact: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                      <span className="font-bold text-slate-900 dark:text-white block">{contact.name}</span>
                      <span className="text-slate-400 font-mono text-[11px]">{contact.email}</span>
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block mt-1">
                        Role: {contact.role} ({contact.vault_name})
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center text-xs text-slate-400">
                  Add members in <strong>Family Vault</strong> to set emergency contacts.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FINES & PENALTIES GUIDE */}
      {activeTab === 'penalties' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Statutory Fines & Deadlines Reference
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Official penalties under Indian law for late renewals, expired certifications, and taxes.
              </p>
            </div>

            <div className="text-right">
              <span className="text-2xl font-black text-emerald-600 font-mono">
                {savingsData?.currency || '₹'}{savingsData?.totalSavingsEstimated?.toLocaleString('en-IN') || 0}
              </span>
              <span className="text-[11px] text-slate-400 block">Total Estimated Savings</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase block">
                Completed on Time
              </span>
              <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-1 block">
                {savingsData?.actionsCompletedCount || 0}
              </span>
              <p className="text-[10px] text-emerald-600 mt-0.5">Deadlines satisfied</p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
              <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase block">
                Protected Items
              </span>
              <span className="text-xl font-black text-amber-700 dark:text-amber-400 mt-1 block">
                {savingsData?.actionsAtRiskCount || 0}
              </span>
              <p className="text-[10px] text-amber-600 mt-0.5">Active monitoring</p>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
              <span className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase block">
                Motor Vehicle PUC Rule
              </span>
              <span className="text-xl font-black text-blue-700 dark:text-blue-400 mt-1 block">
                ₹10,000 Fine
              </span>
              <p className="text-[10px] text-blue-600 mt-0.5">MV Act Sec 190(2)</p>
            </div>
          </div>

          {/* Breakdown Table */}
          {savingsData?.breakdown?.length > 0 ? (
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5">Protected Obligation</th>
                    <th className="py-2.5">Category</th>
                    <th className="py-2.5">Penalty Prevented</th>
                    <th className="py-2.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {savingsData.breakdown.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{item.title}</td>
                      <td className="py-3 text-slate-500">{item.category}</td>
                      <td className="py-3 text-emerald-600 font-bold font-mono">
                        +{savingsData?.currency || '₹'}{item.fineAvoided?.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 text-slate-400 font-mono">
                        {item.completedAt ? item.completedAt.slice(0, 10) : 'Recent'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-400">
              Complete document renewal actions to log penalty savings.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CITIZEN RIGHTS ADVISOR */}
      {activeTab === 'rights' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Statutory Citizen & Consumer Rights
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mandatory grace periods, ombudsman channels, and regulatory provisions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {['Insurance', 'Vehicle', 'Warranty', 'Utilities'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedRightsCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    selectedRightsCategory === cat
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {rightsData && (
            <div className="space-y-5">
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl flex items-center space-x-3 text-xs text-blue-900 dark:text-blue-200">
                <Scale className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <span className="font-bold block">{rightsData.title}</span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 block">
                    {rightsData.statutoryGracePeriod}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Guaranteed Provisions
                </h4>
                <div className="space-y-2">
                  {rightsData.rights?.map((right: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start space-x-2.5 text-xs text-slate-700 dark:text-slate-300"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{right}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800">
                <span>Dispute or arbitrary cancellation?</span>
                <a
                  href={rightsData.ombudsmanLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  <span>Official Ombudsman Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PLAYBOOKS (COMPACT ACCORDIONS) */}
      {activeTab === 'playbooks' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Category Playbooks & Checklists
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Recommended document checklists and automated reminder intervals by persona.
            </p>
          </div>

          <div className="space-y-3">
            {PERSONAS.map((persona) => {
              const Icon = persona.icon;
              const isExpanded = expandedPersona === persona.id;

              return (
                <div
                  key={persona.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedPersona(isExpanded ? '' : persona.id)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg ${persona.bgColor} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${persona.color}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {persona.name}
                          </h4>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {persona.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{persona.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <span className="hidden sm:inline text-xs text-emerald-600 font-semibold font-mono">
                        {persona.impactStat}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mt-3">
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Checklist: Documents to Upload
                        </span>
                        <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                          {persona.documentsToUpload.map((doc, idx) => (
                            <li key={idx} className="flex items-center space-x-2">
                              <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span>{doc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Automated Reminder Triggers
                        </span>
                        <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                          {persona.remindersCreated.map((rem, idx) => (
                            <li key={idx} className="flex items-center space-x-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>{rem}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
