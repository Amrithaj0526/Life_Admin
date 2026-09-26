import { Request, Response } from 'express';
import { getDatabase } from '../config/database.js';

export const socialImpactController = {
  // 1. Get Emergency Medical & Critical Identity Kit for First Responders / Family
  async getEmergencyKit(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const db = await getDatabase();

      // Fetch critical identity, medical/healthcare, and insurance documents
      const docsRes = await db.query(
        `SELECT d.id, d.title, d.provider, d.document_number, d.expiry_date,
                d.owner_name, d.summary, d.status,
                c.name as category_name, c.color as category_color, c.icon as category_icon
         FROM documents d
         JOIN categories c ON d.category_id = c.id
         WHERE d.user_id = $1
           AND c.name IN ('Healthcare', 'Medical', 'Insurance', 'Identity')
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

  // 2. Financial Penalty & Fine Prevention Meter (India Statutory Rates in ₹ INR)
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

      // Calculate realistic Indian societal financial impact:
      // - Insurance lapse: ₹10,000 - ₹25,000 risk + loss of NCB
      // - Motor Vehicle Act Section 190(2) PUC lapse fine: ₹10,000 / Expired insurance: ₹2,000
      // - Utility disconnection / reconnection & late fee: ₹500 - ₹1,500
      // - Warranty lapse repair loss saved: ₹3,500 - ₹8,000
      let totalSavingsEstimated = 0;
      const breakdown = completedRes.rows.map((row: any) => {
        let estimatedFineAvoided = 1500;
        if (row.category_name === 'Insurance') estimatedFineAvoided = 12000;
        else if (row.category_name === 'Vehicle') estimatedFineAvoided = 10000;
        else if (row.category_name === 'Bills' || row.category_name === 'Utilities') estimatedFineAvoided = 750;
        else if (row.category_name === 'Warranties' || row.category_name === 'Warranty') estimatedFineAvoided = 4500;

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
        currency: '₹',
        totalSavingsEstimated,
        actionsCompletedCount: completedRes.rows.length,
        actionsAtRiskCount: pendingRes.rows.length,
        breakdown,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 3. Citizen Legal & Consumer Rights Advisor (Statutory Indian Consumer Rights)
  async getCitizenRightsAdvisor(req: Request, res: Response) {
    try {
      const { category } = req.query;

      const rightsGuidance: Record<string, any> = {
        Insurance: {
          title: 'IRDAI Health & Life Insurance Citizen Safeguards',
          statutoryGracePeriod: 'IRDAI mandates a 30-day grace period for yearly premium payments (15 days for monthly mode).',
          rights: [
            'Hospitals & insurers must process cashless pre-authorization within 1 hour and final discharge authorization within 3 hours under IRDAI Master Circular.',
            'No Claim Bonus (NCB) of up to 50% can be retained or transferred to a new vehicle within 90 days of policy cancellation/expiry.',
            'Portability rights: You can switch health insurance companies without losing accrued waiting-period credits for pre-existing diseases by applying 45 days before renewal.',
            'Free-look period of 15–30 days allows full refund of premium if dissatisfied with policy terms.',
          ],
          ombudsmanLink: 'https://bimabharosa.irdai.gov.in',
        },
        Vehicle: {
          title: 'Motor Vehicles Act 2019 & DigiLocker Digital Legal Validity',
          statutoryGracePeriod: 'Driving Licence can be renewed up to 1 year before or after expiry without re-test.',
          rights: [
            'Rule 139 of the Central Motor Vehicles Rules (CMVR) mandates that traffic police and RTOs MUST accept digital RC, DL, and Insurance stored in DigiLocker/mParivahan as legally valid originals.',
            'Under Section 190(2) of the Motor Vehicles Act, expired PUC attracts up to ₹10,000 fine; valid digital PUC certificate must be accepted across all states.',
            'Third-party motor insurance is legally mandatory under Section 146; grace periods do NOT apply to third-party liability coverage while driving on public roads.',
          ],
          ombudsmanLink: 'https://parivahan.gov.in',
        },
        Warranty: {
          title: 'Consumer Protection Act 2019 & Right-to-Repair Portal',
          statutoryGracePeriod: 'Statutory warranty guarantees free repair or replacement during the manufacturer warranty period.',
          rights: [
            'Under the Consumer Protection Act 2019, manufacturers are liable for product defects. "Warranty void if sticker broken" cannot deny service for genuine manufacturing defects.',
            'Right to Repair India (Ministry of Consumer Affairs): Authorized service centres must supply genuine spare parts and repair manuals for electronics and appliances.',
            'Deficiency in service or repetitive failures during the warranty window entitles consumers to full replacement or refund via the District Consumer Disputes Redressal Commission.',
          ],
          ombudsmanLink: 'https://consumerhelpline.gov.in',
        },
        Utilities: {
          title: 'Electricity (Rights of Consumers) Rules 2020',
          statutoryGracePeriod: 'A mandatory minimum 15-day clear advance notice in writing or SMS is required before any electricity disconnection.',
          rights: [
            'Consumers have the statutory right to request testing of meter accuracy if billing is abnormally high, with testing completed within statutory time limits.',
            'Disconnection cannot be carried out on weekends, public holidays, or after 5:00 PM.',
            'Restoration of power supply must happen within 6 hours in urban areas (24 hours in rural areas) upon payment of undisputed arrears.',
          ],
          ombudsmanLink: 'https://consumerhelpline.gov.in',
        },
        Bills: {
          title: 'Electricity (Rights of Consumers) Rules 2020',
          statutoryGracePeriod: 'A mandatory minimum 15-day clear advance notice in writing or SMS is required before any electricity disconnection.',
          rights: [
            'Consumers have the statutory right to request testing of meter accuracy if billing is abnormally high, with testing completed within statutory time limits.',
            'Disconnection cannot be carried out on weekends, public holidays, or after 5:00 PM.',
            'Restoration of power supply must happen within 6 hours in urban areas (24 hours in rural areas) upon payment of undisputed arrears.',
          ],
          ombudsmanLink: 'https://consumerhelpline.gov.in',
        },
      };

      const selected = (category && rightsGuidance[category as string]) || rightsGuidance['Insurance'];
      return res.json(selected);
      return res.json(selected);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },
};
