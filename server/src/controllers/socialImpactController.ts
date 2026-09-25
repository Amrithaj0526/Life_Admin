import { Request, Response } from 'express';
import { getDatabase } from '../config/database.js';

export const socialImpactController = {
  // 1. Get Emergency Medical & Critical Identity Kit for First Responders / Family
  async getEmergencyKit(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const db = await getDatabase();

      // Fetch critical identity, medical, and insurance documents
      const docsRes = await db.query(
        `SELECT d.id, d.title, d.provider, d.document_number, d.expiry_date,
                d.owner_name, d.summary, d.status,
                c.name as category_name, c.color as category_color, c.icon as category_icon
         FROM documents d
         JOIN categories c ON d.category_id = c.id
         WHERE d.user_id = $1
           AND c.name IN ('Medical', 'Insurance', 'Identity')
           AND d.status != 'ARCHIVED'
         ORDER BY c.name ASC, d.created_at DESC`,
        [userId]
      );

      // Fetch emergency contacts / family members from vaults
      const contactsRes = await db.query(
        `SELECT u.name, u.email, vm.role, v.name as vault_name
         FROM vault_members vm
         JOIN vaults v ON vm.vault_id = v.id
         JOIN users u ON vm.user_id = u.id
         WHERE v.owner_id = $1 AND u.id != $2`,
        [userId, userId]
      );

      return res.json({
        emergencyDocuments: docsRes.rows,
        trustedContacts: contactsRes.rows,
        generatedAt: new Date().toISOString(),
        guidance: 'Keep this emergency digital kit bookmarked or printed for immediate hospital admission or travel verification.',
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 2. Financial Penalty & Fine Prevention Meter
  async getPenaltySavings(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const db = await getDatabase();

      // Completed actions representing penalties and lapses avoided
      const completedRes = await db.query(
        `SELECT a.id, a.title, a.type, a.due_date, a.completed_at,
                d.title as doc_title, d.amount, c.name as category_name
         FROM actions a
         JOIN documents d ON a.document_id = d.id
         LEFT JOIN categories c ON d.category_id = c.id
         WHERE d.user_id = $1 AND a.status = 'COMPLETED'`,
        [userId]
      );

      // Pending actions at risk
      const pendingRes = await db.query(
        `SELECT a.id, a.title, a.type, a.due_date, a.priority,
                d.title as doc_title, d.amount, c.name as category_name
         FROM actions a
         JOIN documents d ON a.document_id = d.id
         LEFT JOIN categories c ON d.category_id = c.id
         WHERE d.user_id = $1 AND a.status != 'COMPLETED'`,
        [userId]
      );

      // Calculate realistic societal financial impact:
      // - Insurance lapse fine / reinstatement fee: ~$150 - $300
      // - Utility bill disconnection / reconnection & late fee: ~$35 - $60
      // - Vehicle inspection / pollution expired fine: ~$100 - $250
      // - Warranty lapse hardware repair loss saved: ~$200 - $500
      let totalSavingsEstimated = 0;
      const breakdown = completedRes.rows.map((row: any) => {
        let estimatedFineAvoided = 50;
        if (row.category_name === 'Insurance') estimatedFineAvoided = 250;
        else if (row.category_name === 'Vehicle') estimatedFineAvoided = 150;
        else if (row.category_name === 'Bills') estimatedFineAvoided = 45;
        else if (row.category_name === 'Warranty') estimatedFineAvoided = 350;

        totalSavingsEstimated += estimatedFineAvoided;
        return {
          id: row.id,
          title: row.title,
          category: row.category_name,
          fineAvoided: estimatedFineAvoided,
          completedAt: row.completed_at,
        };
      });

      return res.json({
        totalSavingsEstimated,
        actionsCompletedCount: completedRes.rows.length,
        actionsAtRiskCount: pendingRes.rows.length,
        breakdown,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 3. Citizen Legal & Consumer Rights Advisor (Guides on what to do when warranty / insurance denies claims)
  async getCitizenRightsAdvisor(req: Request, res: Response) {
    try {
      const { category } = req.query;

      const rightsGuidance: Record<string, any> = {
        Insurance: {
          title: 'Consumer Health & Motor Insurance Safeguards',
          statutoryGracePeriod: 'Most insurance regulations mandate a 15 to 30-day grace period for policy renewals.',
          rights: [
            'Insurer cannot arbitrarily deny cashless claims if pre-authorization was submitted within 24 hours of emergency admission.',
            'No Claim Bonus (NCB) can be transferred when switching vehicle insurance providers within 90 days of expiry.',
            'Portability rights allow transferring health insurance without losing accrued waiting-period credits.',
          ],
          ombudsmanLink: 'https://consumerhelpline.gov.in',
        },
        Warranty: {
          title: 'Consumer Product Protection & Right-to-Repair',
          statutoryGracePeriod: 'Implied statutory warranty protects against manufacturing defects even if standard warranty recently elapsed.',
          rights: [
            'Manufacturers must provide access to genuine spare parts and authorized repair services.',
            'Unfair warranty voiding tags (e.g., "warranty void if sticker removed") are legally unenforceable in many consumer jurisdictions.',
            'If a product repeatedly fails within the warranty term, consumers have the legal right to a full replacement or refund.',
          ],
          ombudsmanLink: 'https://consumerhelpline.gov.in',
        },
        Bills: {
          title: 'Essential Utility Consumer Protections',
          statutoryGracePeriod: 'Disconnection notice of at least 15 days is mandatory prior to cutting essential electricity or water supplies.',
          rights: [
            'Disputed meter readings entitle consumers to an independent audit before settlement.',
            'Utility companies cannot levy extortionate reconnection charges without itemized cost justification.',
          ],
          ombudsmanLink: 'https://consumerhelpline.gov.in',
        },
      };

      const selected = (category && rightsGuidance[category as string]) || rightsGuidance['Insurance'];
      return res.json(selected);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },
};
