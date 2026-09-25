import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../config/database.js';

export const relationshipController = {
  // 1. Get relationships for a document
  async getForDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const db = await getDatabase();

      const result = await db.query(
        `SELECT r.id, r.relationship_type, r.confidence, r.created_at,
                d.id as related_doc_id, d.title as related_title, d.expiry_date as related_expiry,
                c.name as related_category, c.color as related_color
         FROM document_relationships r
         JOIN documents d ON (r.target_document_id = d.id)
         LEFT JOIN categories c ON d.category_id = c.id
         WHERE r.source_document_id = $1`,
        [id]
      );

      return res.json({ relationships: result.rows });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 2. Create relationship between two documents
  async create(req: Request, res: Response) {
    try {
      const { sourceDocumentId, targetDocumentId, relationshipType } = req.body;
      const db = await getDatabase();
      const id = uuidv4();

      await db.query(
        `INSERT INTO document_relationships (id, source_document_id, target_document_id, relationship_type, confidence, created_at)
         VALUES ($1, $2, $3, $4, 1.0, CURRENT_TIMESTAMP)`,
        [id, sourceDocumentId, targetDocumentId, relationshipType || 'RELATED_TO']
      );

      return res.status(201).json({ id, message: 'Document relationship mapped successfully.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 3. Delete relationship
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const db = await getDatabase();

      await db.query(`DELETE FROM document_relationships WHERE id = $1`, [id]);
      return res.json({ message: 'Relationship removed successfully.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },
};
