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
  AlertCircle,
  ArrowRight,
  Layers,
  Sparkles,
  Check
} from 'lucide-react';
import { api, getDocumentDownloadUrl } from '../services/api';

type TabType = 'personas' | 'matrix' | 'digital-journey' | 'emergency' | 'penalties' | 'rights';

interface Persona {
  id: string;
  name: string;
  role: string;
  badge: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  painPoints: string[];
  documentsToUpload: string[];
  remindersCreated: string[];
  sampleWorkflow: { step: string; detail: string }[];
  impactStat: string;
}

const PERSONAS: Persona[] = [
  {
    id: 'students',
    name: 'College & Competitive Exam Students',
    role: 'Higher Education, Scholarships & Internships',
    badge: '🎓 Academic & Career Track',
    icon: GraduationCap,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    painPoints: [
      'Scholarship application dates missed due to scattered circulars',
      'Semester fee receipts lost before income tax 80E / reimbursement claims',
      'Caste, income, or domicile certificate renewal deadlines overlooked',
      'Internship completion certificates and university transcripts scattered across downloads'
    ],
    documentsToUpload: [
      '10th / 12th & Degree Marksheets',
      'Scholarship Application & Award Letters',
      'College Semester Fee Receipts',
      'Entrance Exam Hall Tickets & Scorecards',
      'Internship Certificates & Recommendation Letters'
    ],
    remindersCreated: [
      'Scholarship portal closure (e.g. NSP / State Portal) at 15 days, 3 days',
      'College fee installment deadline before late fines accrue',
      'Domicile / Category Certificate 3-year validity renewal'
    ],
    sampleWorkflow: [
      { step: 'Upload Fee Receipt', detail: 'Student drops semester fee receipt PDF into LifeAdmin.' },
      { step: 'AI Detects Cutoff', detail: 'Identifies next installment due on 15 Nov and reimbursement claim deadline.' },
      { step: 'Google Calendar Sync', detail: 'Adds deadline with 48h mobile reminder to prevent ₹500 late registration fee.' }
    ],
    impactStat: 'Prevents missed scholarship funds (averaging ₹20,000–₹50,000/year)'
  },
  {
    id: 'families',
    name: 'Indian Households & Family Heads',
    role: 'Utilities, Healthcare, Leases & Insurance',
    badge: '👨‍👩‍👧 Family Living',
    icon: Home,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    painPoints: [
      'Single family member shoulders the mental burden of remembering every renewal',
      'Family health insurance lapsing, causing forfeiture of accrued pre-existing disease waiting periods',
      'House rent agreement 11-month expiry causing landlord renegotiation friction',
      'Electricity / gas bills unpaid, risking disconnection and reconnection fees'
    ],
    documentsToUpload: [
      'Family Floater Health Insurance Policies',
      'Monthly Electricity, Water & Piped Gas Bills',
      '11-Month Rental / Lease Agreements',
      'Home Appliance Invoices & Warranty Cards',
      'LPG Subsidy & Consumer Registration Slips'
    ],
    remindersCreated: [
      '30-Day IRDAI grace period notice for Health Insurance',
      'Monthly DISCOM electricity bill payment before disconnection penalty',
      'House lease renewal notice 60 days before 11 months expire'
    ],
    sampleWorkflow: [
      { step: 'Add Health Insurance', detail: 'Father uploads family health policy document.' },
      { step: 'Family Vault Access', detail: 'Shared into Family Vault; spouse and grown children can view TPA card.' },
      { step: 'Cashless Admission Ready', detail: 'Policy number, TPA desk contact & claim forms accessible during medical emergencies.' }
    ],
    impactStat: 'Shields families from catastrophic ₹2,00,000+ emergency out-of-pocket health costs'
  },
  {
    id: 'workers',
    name: 'Salaried Workers & Job Seekers',
    role: 'Employment Records, Tax Forms & Career Credentials',
    badge: '💼 Career & Taxation',
    icon: Briefcase,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    painPoints: [
      'Scrambling for previous employer relieving letters during Background Verification (BGV)',
      'Missing Form 16 / ITR filing deadlines resulting in Section 234F penalties up to ₹5,000',
      'Professional certificates (PMP, AWS, Medical/Bar Council) expiring unrenewed',
      'Losing track of provident fund UAN or medical reimbursement claims'
    ],
    documentsToUpload: [
      'Appointment & Offer Letters',
      'Experience & Relieving Letters',
      'Form 16, Salary Slips & ITR-V acknowledgements',
      'Professional Licenses & Skill Accreditations',
      'Health insurance claim submission receipts'
    ],
    remindersCreated: [
      'ITR filing deadline (31 July) reminders with tax proof preparation timeline',
      'Professional certification recertification window (e.g., 3-year expiry)',
      'Probation confirmation or notice period milestone tracking'
    ],
    sampleWorkflow: [
      { step: 'Upload Relieving Letter', detail: 'Worker saves service certificate from previous organization.' },
      { step: 'Instant BGV Dossier', detail: 'Tagged under Employment with verified start and end dates.' },
      { step: 'Tax Reminder', detail: 'Form 16 upload triggers reminder to cross-verify TDS in AIS/26AS before July.' }
    ],
    impactStat: 'Avoids Section 234F IT fines (₹5,000) and prevents BGV employment delays'
  },
  {
    id: 'vehicle_owners',
    name: 'Two-Wheeler & Four-Wheeler Owners',
    role: 'PUC, Motor Insurance, RC & Driver Licensing',
    badge: '🚗 Vehicle Compliance',
    icon: Car,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    painPoints: [
      'PUC (Pollution Under Control) certificate expiring after 6 months, facing ₹10,000 fine under MV Act 190(2)',
      'Third-party vehicle insurance lapsing, causing loss of accrued No-Claim Bonus (NCB) up to 50%',
      'Confusion when stopped by traffic police regarding digital document validity',
      'Missing vehicle fitness or high-security registration plate (HSRP) schedules'
    ],
    documentsToUpload: [
      'Vehicle Registration Certificate (RC)',
      'Comprehensive / Third-Party Motor Insurance',
      'Pollution Under Control (PUC) Certificate',
      'Driving Licence (DL)',
      'Vehicle Service & Warranty Handbook'
    ],
    remindersCreated: [
      'PUC expiry alert at 14 days and 2 days before deadline',
      'Insurance renewal 30 days ahead to retain up to 50% No Claim Bonus',
      'Driving licence renewal reminder before penalty phase'
    ],
    sampleWorkflow: [
      { step: 'Scan PUC Receipt', detail: 'Owner snaps quick photo of petrol pump PUC printout.' },
      { step: 'AI Extracts Expiry', detail: 'Gemini recognizes 6-month validity date and vehicle registration number.' },
      { step: 'Calendar & Legal Card', detail: 'LifeAdmin adds reminder to Google Calendar with Rule 139 CMVR digital validity note.' }
    ],
    impactStat: 'Saves up to ₹10,000 in MV Act fines and preserves ₹8,000+ No-Claim Bonus'
  }
];

const PROBLEM_SOLUTION_MATRIX = [
  {
    problem: 'Documents are scattered across physical almirahs, WhatsApp chats, downloads, and lost folders.',
    impact: 'Average citizen spends 4+ hours searching for a paper when needed in emergencies or during college admissions.',
    solution: 'Single unified life administration space with OCR search, tags, and category vaults for the entire family.'
  },
  {
    problem: 'People forget critical renewals (Insurance, PUC, driving licenses, rent agreements, warranties).',
    impact: 'Results in harsh fines (₹10,000 for PUC under Section 190(2)), forfeited insurance policies, and loss of claims.',
    solution: 'Proactive Action Center with human-verified dates synced straight to Google Calendar and phone alerts.'
  },
  {
    problem: 'Complex policy jargon, legal clauses, and fine print make documents difficult to comprehend.',
    impact: 'People miss claiming insurance benefits, warranty repairs, or statutory grace periods they are legally entitled to.',
    solution: 'Gemini AI extracts key facts into simple, plain English summaries: Who, What, Due Date, and Action Required.'
  },
  {
    problem: 'One family member carries the full mental burden of managing all bills, insurance, and medical files.',
    impact: 'If that member is unavailable, the family is left stranded during hospital admissions or utility disconnections.',
    solution: 'Collaborative Family Vaults and 1-Click Emergency Medical Dossier readable on any device.'
  },
  {
    problem: 'Students and workers miss cutoff windows for scholarships, entrance tests, and tax filings.',
    impact: 'Students lose lakhs in financial aid; workers pay hefty Section 234F late fees or face BGV clearance delays.',
    solution: 'Priority-based deadline tracking and automated multi-stage reminders before deadlines expire.'
  }
];

export const SocialImpactPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('personas');
  const [selectedPersona, setSelectedPersona] = useState<string>('students');
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

  const currentPersona = PERSONAS.find(p => p.id === selectedPersona) || PERSONAS[0];

  if (loading && !emergencyData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>India & Community Impact</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Life Administration Built for Indian Citizens
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Documents are not just files — they are hospital admissions, legal rights, and financial buffers. LifeAdmin helps ordinary students, families, workers, and vehicle owners avoid losing documents, missing critical deadlines, and paying unnecessary penalties.
            </p>
          </div>

          {/* Quick Metrics Card */}
          <div className="flex sm:flex-col items-center justify-around sm:justify-center gap-4 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 shrink-0">
            <div className="text-center">
              <span className="text-3xl font-black text-emerald-400 block font-mono">
                {savingsData?.currency || '₹'}{savingsData?.totalSavingsEstimated?.toLocaleString('en-IN') || '28,500'}
              </span>
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mt-1">
                Household Fines & Losses Prevented
              </span>
            </div>
            <div className="h-px w-full bg-white/10 hidden sm:block"></div>
            <div className="text-center">
              <span className="text-xl font-black text-indigo-300 block">
                {savingsData?.actionsCompletedCount || 0} Deadlines
              </span>
              <span className="text-[11px] text-slate-400 font-semibold block">
                Resolved on Time
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4 text-xs sm:text-sm">
        <button
          onClick={() => setActiveTab('personas')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center space-x-2 transition ${
            activeTab === 'personas'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>India User Personas</span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center space-x-2 transition ${
            activeTab === 'matrix'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Problem → Solution Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('digital-journey')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center space-x-2 transition ${
            activeTab === 'digital-journey'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ArrowRight className="w-4 h-4" />
          <span>India's Digital Journey</span>
        </button>

        <button
          onClick={() => setActiveTab('emergency')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center space-x-2 transition ${
            activeTab === 'emergency'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <HeartPulse className="w-4 h-4 text-rose-500" />
          <span>Emergency Medical Dossier</span>
        </button>

        <button
          onClick={() => setActiveTab('penalties')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center space-x-2 transition ${
            activeTab === 'penalties'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <span>Penalty Prevention Meter</span>
        </button>

        <button
          onClick={() => setActiveTab('rights')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center space-x-2 transition ${
            activeTab === 'rights'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Scale className="w-4 h-4 text-blue-600" />
          <span>Citizen Legal Rights</span>
        </button>
      </div>

      {/* TAB 1: INDIA USER PERSONAS */}
      {activeTab === 'personas' && (
        <div className="space-y-6">
          {/* Persona Selection Header */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PERSONAS.map((persona) => {
              const Icon = persona.icon;
              const isSelected = selectedPersona === persona.id;
              return (
                <button
                  key={persona.id}
                  onClick={() => setSelectedPersona(persona.id)}
                  className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                    isSelected
                      ? `${persona.bgColor} ${persona.borderColor} border-2 shadow-sm`
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className={`p-2 rounded-xl ${isSelected ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                      <Icon className={`w-5 h-5 ${persona.color}`} />
                    </div>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {persona.badge}
                    </span>
                    <h4 className="text-sm font-black text-slate-900 mt-0.5 leading-snug">
                      {persona.name}
                    </h4>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Persona Details Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div className="flex items-center space-x-4">
                <div className={`p-3.5 rounded-2xl ${currentPersona.bgColor} ${currentPersona.borderColor} border`}>
                  <currentPersona.icon className={`w-7 h-7 ${currentPersona.color}`} />
                </div>
                <div>
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                    {currentPersona.badge}
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 mt-0.5">{currentPersona.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{currentPersona.role}</p>
                </div>
              </div>

              <div className="px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                💡 Societal Value: {currentPersona.impactStat}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Pain Points */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-rose-700 flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  <span>Real Indian Pain Points</span>
                </h4>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  {currentPersona.painPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start space-x-2 bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                      <span className="text-rose-500 font-bold text-sm leading-none mt-0.5">•</span>
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* What to Upload */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  <span>Documents to Upload</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-700 font-medium">
                  {currentPersona.documentsToUpload.map((doc, idx) => (
                    <li key={idx} className="flex items-center space-x-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Automatic Reminders Created */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-700 flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>Automated Reminders</span>
                </h4>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  {currentPersona.remindersCreated.map((reminder, idx) => (
                    <li key={idx} className="flex items-start space-x-2 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
                      <span className="text-emerald-600 font-bold text-sm leading-none mt-0.5">✓</span>
                      <span className="leading-relaxed font-semibold text-emerald-950">{reminder}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Workflow walkthrough */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                End-to-End Workflow in LifeAdmin
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {currentPersona.sampleWorkflow.map((step, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 relative">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      Step {idx + 1}
                    </span>
                    <h5 className="text-xs font-black text-slate-900">{step.step}</h5>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-1">{step.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROBLEM TO SOLUTION MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
            <div>
              <h3 className="text-xl font-black text-slate-900">
                Real-World Problem → LifeAdmin Solution Matrix
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
                Why LifeAdmin is essential: We bridge the gap between static files and proactive life administration for ordinary Indian households.
              </p>
            </div>

            <div className="space-y-4">
              {PROBLEM_SOLUTION_MATRIX.map((item, idx) => (
                <div key={idx} className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80 items-start text-xs">
                  {/* Problem & Impact */}
                  <div className="lg:col-span-6 space-y-1.5">
                    <div className="flex items-center space-x-2 text-rose-700 font-bold uppercase tracking-wider text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      <span>The Everyday Indian Problem</span>
                    </div>
                    <p className="font-bold text-slate-900 text-sm">{item.problem}</p>
                    <p className="text-slate-500 leading-relaxed">{item.impact}</p>
                  </div>

                  {/* Arrow Divider */}
                  <div className="hidden lg:flex lg:col-span-1 items-center justify-center h-full pt-4 text-slate-300">
                    <ArrowRight className="w-5 h-5 text-indigo-400" />
                  </div>

                  {/* Solution */}
                  <div className="lg:col-span-5 space-y-1.5 bg-white p-4 rounded-xl border border-indigo-100 shadow-xs">
                    <div className="flex items-center space-x-2 text-indigo-700 font-bold uppercase tracking-wider text-[10px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>LifeAdmin Solution</span>
                    </div>
                    <p className="font-semibold text-indigo-950 leading-relaxed text-xs">
                      {item.solution}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INDIA'S DIGITAL JOURNEY COMPLEMENT */}
      {activeTab === 'digital-journey' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
            <div className="max-w-2xl">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                India Stack Complement
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                Where LifeAdmin Fits in India's Digital Journey
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                India has built world-class digital public infrastructure: DigiLocker for document access, UMANG for citizen services, and UPI for payments. LifeAdmin serves as the essential personal administration layer.
              </p>
            </div>

            {/* Stepped Visual Journey */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              {/* DigiLocker */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 font-black text-xs flex items-center justify-center">
                  1
                </span>
                <h4 className="text-base font-black text-slate-900">DigiLocker</h4>
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                  Authoritative Issuance
                </span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Repository for legally valid electronic credentials directly from state & central authorities.
                </p>
              </div>

              {/* UMANG */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="w-8 h-8 rounded-xl bg-orange-100 text-orange-800 font-black text-xs flex items-center justify-center">
                  2
                </span>
                <h4 className="text-base font-black text-slate-900">UMANG</h4>
                <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider block">
                  Citizen Services
                </span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Unified portal connecting citizens to 1,200+ government department services and grievance tracking.
                </p>
              </div>

              {/* UPI */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
                  3
                </span>
                <h4 className="text-base font-black text-slate-900">UPI</h4>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Instant Payments
                </span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Real-time mobile payment rails enabling instantaneous settlement for bills, fees, and services.
                </p>
              </div>

              {/* LifeAdmin */}
              <div className="p-5 rounded-2xl bg-indigo-50 border-2 border-indigo-400 space-y-2 shadow-sm">
                <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                  4
                </span>
                <h4 className="text-base font-black text-indigo-950">LifeAdmin</h4>
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                  Personal Administration Layer
                </span>
                <p className="text-xs text-indigo-900/80 leading-relaxed font-medium">
                  Document intelligence, deadline priority engine, human verification, and Google Calendar reminders.
                </p>
              </div>
            </div>

            {/* Clear Product Positioning & Trust Disclaimer */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Our Product Boundaries & Positioning</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                LifeAdmin does <strong>not</strong> claim to replace DigiLocker, UMANG, government portals, banking applications, or medical establishments. LifeAdmin complements them by helping citizens organize their personal paperwork, translate complex clauses into simple language, and act on deadlines before penalties occur.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ONE-TAP EMERGENCY MEDICAL DOSSIER */}
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

      {/* TAB 5: PENALTY & FINE PREVENTION METER */}
      {activeTab === 'penalties' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">Household Penalty & Fine Prevention Meter</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Quantifying tangible economic savings by eliminating late fees, lapsed insurance restoration costs, and traffic penalty charges under Indian law.
                </p>
              </div>

              <div className="text-right">
                <span className="text-3xl font-black text-emerald-600 font-mono">
                  {savingsData?.currency || '₹'}{savingsData?.totalSavingsEstimated?.toLocaleString('en-IN') || 0}
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
                <span className="text-xs font-bold text-blue-800 uppercase">MV Act PUC Fine Protected</span>
                <span className="text-2xl font-black text-blue-700 block">₹10,000</span>
                <p className="text-[11px] text-blue-600">Section 190(2) maximum statutory fine</p>
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
                          <td className="py-3 text-emerald-700 font-black">+{savingsData?.currency || '₹'}{item.fineAvoided?.toLocaleString('en-IN')}</td>
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

      {/* TAB 6: CITIZEN LEGAL RIGHTS ADVISOR */}
      {activeTab === 'rights' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">Citizen Legal & Consumer Rights Advisor</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Empowering Indian citizens with statutory rights, mandatory grace periods, and regulatory ombudsman access.
                </p>
              </div>

              {/* Category Selector */}
              <div className="flex flex-wrap items-center gap-2">
                {['Insurance', 'Vehicle', 'Warranty', 'Utilities'].map((cat) => (
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
                  <span className="font-semibold">Faced arbitrary rejection or unfair dispute?</span>
                  <a
                    href={rightsData.ombudsmanLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-blue-600 font-bold hover:underline"
                  >
                    <span>Official Portal / Ombudsman</span>
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
