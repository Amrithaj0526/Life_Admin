import React from 'react';
import {
  ShieldCheck,
  Calendar,
  HeartHandshake,
  Clock,
  ExternalLink,
  UploadCloud,
  Cpu,
  CheckCircle,
  BellRing,
  HelpCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';

export const HelpPage: React.FC = () => {
  const steps = [
    {
      num: '1',
      title: 'Connect',
      desc: 'Connect your Google Calendar if you want automatic calendar reminders across your phone and laptop.',
      icon: Calendar,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200'
    },
    {
      num: '2',
      title: 'Add Documents',
      desc: 'Upload important documents, bills, certificates, receipts, and insurance records in PDF or image format.',
      icon: UploadCloud,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200'
    },
    {
      num: '3',
      title: 'We Find Important Information',
      desc: 'OCR and Gemini AI identify useful information such as dates, amounts, expiry dates, and actions.',
      icon: Cpu,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200'
    },
    {
      num: '4',
      title: 'You Stay in Control',
      desc: 'Review and confirm important information before it becomes an active reminder. AI never acts without your consent.',
      icon: CheckCircle,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200'
    },
    {
      num: '5',
      title: 'Never Miss Important Dates',
      desc: 'LifeAdmin synchronizes confirmed deadlines with Google Calendar and prioritizes urgent obligations.',
      icon: Clock,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200'
    },
    {
      num: '6',
      title: 'Get Reminded',
      desc: 'Google Calendar notifies you on your Android or iOS devices according to your preferred reminder schedule.',
      icon: BellRing,
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200'
    }
  ];

  const faqs = [
    {
      q: 'How does Google Calendar Synchronization work?',
      a: 'LifeAdmin provides both 1-click direct calendar web saving and full background OAuth 2.0 integration. Only document titles and due dates are synced. Sensitive personal numbers, policy details, and raw text are never sent to third parties.',
      icon: Calendar,
    },
    {
      q: 'What is the Emergency Medical Dossier?',
      a: 'The Emergency Medical Dossier (/social-impact) aggregates critical health insurance numbers, TPA pre-authorization helplines, blood group, and emergency contacts into an instant 1-page printable card ready during hospital admissions.',
      icon: HeartHandshake,
    },
    {
      q: 'How are priority urgency scores calculated?',
      a: 'Our priority engine combines deadline proximity (days remaining) with legal and financial consequence scores (e.g., motor vehicle PUC fine of up to ₹10,000 under Section 190(2) or ₹2,000 for expired insurance vs utility late charges).',
      icon: Clock,
    },
    {
      q: 'Is my data encrypted and private?',
      a: 'Yes. Sensitive tokens are encrypted with AES-256-GCM. Files are stored with secure UUID keys and served only via authenticated JWT sessions. No document content is shared with advertisers or used to train third-party models.',
      icon: ShieldCheck,
    },
    {
      q: 'Does LifeAdmin replace DigiLocker or government portals?',
      a: 'No. DigiLocker provides authoritative digital credential issuance, and UMANG provides citizen government services. LifeAdmin acts as the personal administration layer on top — extracting dates, calculating penalties, and keeping your family on schedule.',
      icon: ShieldCheck,
    },
    {
      q: 'Can other family members see my documents?',
      a: 'Only if you explicitly add documents into a Family Vault. Personal documents uploaded to your private vault remain completely private to your individual account.',
      icon: HelpCircle,
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-12">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Help & How It Works
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Simple instructions, common questions, and how LifeAdmin protects your family's documents.
        </p>
      </div>

      {/* "How LifeAdmin Works" 6-Step Walkthrough */}
      <Card className="border-indigo-100 dark:border-indigo-950/60 overflow-hidden">
        <CardHeader className="bg-slate-50/60 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
            <HelpCircle className="w-5 h-5" />
            <CardTitle className="text-lg">How LifeAdmin Works</CardTitle>
          </div>
          <CardDescription>
            The 6-step journey from paperwork chaos to automated, stress-free reminders.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-2 hover:border-indigo-300 dark:hover:border-indigo-800 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                      Step {step.num}
                    </span>
                    <div className={`p-2 rounded-xl border ${step.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                    {step.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Frequently Asked Questions */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Frequently Asked Questions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqs.map((faq, idx) => {
            const Icon = faq.icon;
            return (
              <Card key={idx}>
                <CardContent className="p-5 space-y-2">
                  <div className="flex items-center space-x-2.5 text-indigo-600 dark:text-indigo-400">
                    <Icon className="w-4 h-4 shrink-0" />
                    <h4 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {faq.q}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-6.5">
                    {faq.a}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Open Source / Community Card */}
      <Card className="bg-slate-900 text-white border-0">
        <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl">
            <h4 className="text-base font-bold text-white">
              LifeAdmin is an Open & Citizen-Focused Platform
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Designed to help students, families, workers, and vehicle owners across India manage real-world responsibilities and avoid penalties.
            </p>
          </div>

          <a
            href="https://github.com/Amrithaj0526/Life_Admin"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shrink-0 shadow-lg shadow-indigo-600/30"
          >
            <span>GitHub Repository</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </CardContent>
      </Card>
    </div>
  );
};
