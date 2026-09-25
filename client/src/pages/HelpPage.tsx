import React from 'react';
import {
  ShieldCheck,
  Calendar,
  HeartHandshake,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';

export const HelpPage: React.FC = () => {
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
      a: 'Our priority engine combines deadline proximity (days remaining) with legal and financial consequence scores (e.g., motor insurance lapse fine of ₹2,000 to ₹4,000 under MV Act Sec 196 vs a utility reconnection fee).',
      icon: Clock,
    },
    {
      q: 'Is my data encrypted and private?',
      a: 'Yes. Files are stored with random UUID keys and served only via authenticated JWT tokens. No document content is exposed publicly or used for model training.',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Help & Knowledge Base
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Everything you need to know about LifeAdmin features, security, and integrations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {faqs.map((faq, idx) => {
          const Icon = faq.icon;
          return (
            <Card key={idx}>
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center space-x-2.5 text-primary-600 dark:text-primary-400">
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

      {/* Support Contact Card */}
      <Card>
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Need technical assistance or custom integration?
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              LifeAdmin is fully open-source and customizable for families and organizations.
            </p>
          </div>

          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition shrink-0"
          >
            <span>Documentation</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </CardContent>
      </Card>
    </div>
  );
};
