import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../src/config/database.js';
import { PriorityEngine } from '../src/services/documents/priorityEngine.js';
import { ReminderService } from '../src/services/reminders/reminderService.js';

async function seed() {
  console.log('--- Starting LifeAdmin Realistic Seed ---');
  const db = await getDatabase();

  // 1. Create Default Demo User
  const userId = 'user_demo_101';
  const email = 'demo@lifeadmin.local';
  const name = 'Amritha Vasanth';
  const passwordHash = await bcrypt.hash('password123', 10);

  await db.query(`DELETE FROM users WHERE email = $1`, [email]);
  await db.query(
    `INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [userId, name, email, passwordHash]
  );
  console.log(`[Seed] Created User: ${email} (Password: password123)`);

  // Helper date generator relative to today
  const today = new Date();
  const getOffsetDate = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const seedDocs = [
    {
      id: 'doc_vehicle_insurance',
      title: 'Vehicle Insurance Policy (Honda Civic)',
      categoryId: 'cat_insurance',
      categoryName: 'Insurance',
      provider: 'National General Insurance',
      docNumber: 'POL-98234-A',
      ownerName: 'Amritha Vasanth',
      issueDate: getOffsetDate(-345),
      expiryDate: getOffsetDate(1), // Expires tomorrow -> CRITICAL
      amount: 480,
      currency: 'USD',
      summary: 'Comprehensive vehicle insurance coverage for Honda Civic TN 38 AB 1234.',
      ocrText: `NATIONAL GENERAL INSURANCE POLICY
Policy Number: POL-98234-A
Insured Vehicle: Honda Civic (TN 38 AB 1234)
Policy Expiry Date: ${getOffsetDate(1)}
Premium Amount: $480.00
Action Required: Annual policy renewal before expiry date to avoid lapse in coverage.`,
      action: {
        title: 'Renew vehicle insurance policy',
        description: 'Policy expires tomorrow. Renew immediately to ensure continuous coverage.',
        type: 'RENEW',
        dueOffset: 1,
      },
      relationshipTarget: 'Honda Civic Vehicle Registration',
    },
    {
      id: 'doc_electricity_bill',
      title: 'City Power & Electric Monthly Utility Bill',
      categoryId: 'cat_bills',
      categoryName: 'Bills',
      provider: 'City Power & Electric',
      docNumber: 'INV-2026-8910',
      ownerName: 'Amritha Vasanth',
      issueDate: getOffsetDate(-20),
      expiryDate: getOffsetDate(5), // Due in 5 days -> HIGH
      amount: 94.20,
      currency: 'USD',
      summary: 'Monthly residential electricity consumption invoice.',
      ocrText: `CITY POWER & ELECTRIC
Invoice ID: INV-2026-8910
Due Date: ${getOffsetDate(5)}
Amount Payable: $94.20
Late fee applies if not cleared before due date.`,
      action: {
        title: 'Pay electricity bill',
        description: 'Monthly electricity bill payment due in 5 days.',
        type: 'PAY',
        dueOffset: 5,
      },
    },
    {
      id: 'doc_laptop_warranty',
      title: 'Dell XPS 15 Extended Hardware Warranty',
      categoryId: 'cat_warranty',
      categoryName: 'Warranty',
      provider: 'Dell Technologies',
      docNumber: 'WR-8910-DL',
      ownerName: 'Amritha Vasanth',
      issueDate: getOffsetDate(-180),
      expiryDate: getOffsetDate(210), // Due in 7 months -> LOW
      amount: 199,
      currency: 'USD',
      summary: '3-Year Onsite Hardware Support and Accidental Damage Protection.',
      ocrText: `DELL HARDWARE WARRANTY CERTIFICATE
Service Tag: DELL-XPS-9520
Coverage Ends: ${getOffsetDate(210)}
Support Type: ProSupport Plus Next Business Day Onsite.`,
      action: {
        title: 'Review warranty expiration status',
        description: 'Verify extended coverage options before hardware warranty expiration.',
        type: 'REVIEW',
        dueOffset: 210,
      },
    },
    {
      id: 'doc_service_record',
      title: 'Authorized 30,000 KM Vehicle Periodic Service',
      categoryId: 'cat_vehicle',
      categoryName: 'Vehicle',
      provider: 'Honda Authorized Center',
      docNumber: 'SRV-88219',
      ownerName: 'Amritha Vasanth',
      issueDate: getOffsetDate(-60),
      expiryDate: getOffsetDate(30), // Due in 30 days -> MEDIUM
      amount: 145,
      currency: 'USD',
      summary: 'Periodic scheduled brake inspection, oil replacement, and multi-point check.',
      ocrText: `HONDA AUTHORIZED SERVICE INVOICE
Vehicle: Honda Civic (TN 38 AB 1234)
Next Recommended Service: ${getOffsetDate(30)}
Work Completed: Synthetic engine oil & fluid checks.`,
      action: {
        title: 'Schedule 30,000 km periodic service & brake inspection',
        description: 'Book vehicle periodic maintenance checkup with service center.',
        type: 'SERVICE',
        dueOffset: 30,
      },
      relationshipTarget: 'Vehicle Insurance Policy (Honda Civic)',
    },
  ];

  for (const doc of seedDocs) {
    await db.query(`DELETE FROM documents WHERE id = $1`, [doc.id]);
    await db.query(
      `INSERT INTO documents (
        id, user_id, title, category_id, status, owner_name, storage_key,
        original_filename, mime_type, file_size, ocr_text, summary, provider,
        document_number, issue_date, expiry_date, amount, currency, confidence,
        verification_status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, 'ACTIVE', $5, $6, $7, 'application/pdf', 145200, $8, $9, $10, $11, $12, $13, $14, $15, 0.96, 'VERIFIED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        doc.id,
        userId,
        doc.title,
        doc.categoryId,
        doc.ownerName,
        `${doc.id}.pdf`,
        `${doc.id}.pdf`,
        doc.ocrText,
        doc.summary,
        doc.provider,
        doc.docNumber,
        doc.issueDate,
        doc.expiryDate,
        doc.amount,
        doc.currency,
      ]
    );

    // Create Action & Calculate Priority
    if (doc.action) {
      const actionId = `action_${doc.id}`;
      const dueDate = getOffsetDate(doc.action.dueOffset);
      const evalRes = PriorityEngine.calculate(dueDate, doc.action.type, doc.categoryName);

      await db.query(`DELETE FROM actions WHERE id = $1`, [actionId]);
      await db.query(
        `INSERT INTO actions (id, document_id, title, description, type, due_date, priority, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', CURRENT_TIMESTAMP)`,
        [
          actionId,
          doc.id,
          doc.action.title,
          doc.action.description,
          doc.action.type,
          dueDate,
          evalRes.priority,
        ]
      );

      // Schedule automated reminders
      await ReminderService.scheduleRemindersForAction(actionId, dueDate);
    }
  }

  // Seed Relationships
  await db.query(`DELETE FROM document_relationships WHERE source_document_id = $1`, ['doc_service_record']);
  await db.query(
    `INSERT INTO document_relationships (id, source_document_id, target_document_id, relationship_type, confidence, created_at)
     VALUES ($1, $2, $3, 'SERVICE_FOR', 0.98, CURRENT_TIMESTAMP)`,
    [uuidv4(), 'doc_service_record', 'doc_vehicle_insurance']
  );

  console.log('[Seed] Database successfully populated with realistic portfolio data!');
  await db.close();
}

seed().catch(console.error);
